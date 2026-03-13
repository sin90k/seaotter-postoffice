-- ============================================================
-- Sea Otter Post Office — 积分系统与流水迁移脚本
-- 在 Supabase SQL Editor 中整段复制粘贴、一次性执行。
-- 若你从未跑过 supabase-setup.sql，请先执行 supabase-setup.sql 再执行本文件；
-- 若已跑过，可直接执行本文件以升级积分与流水逻辑。
-- ============================================================

-- 1) 确保 profiles 有双积分列与扩展列
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promo_credits integer DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_credits integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_paid_credits integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
UPDATE public.profiles SET promo_credits = COALESCE(promo_credits, credits, 0), paid_credits = COALESCE(paid_credits, 0) WHERE promo_credits IS NULL OR paid_credits IS NULL;

-- 2) 确保 credits_ledger 存在并补充审计字段
CREATE TABLE IF NOT EXISTS public.credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('promo', 'paid', 'other')),
  source text NOT NULL,
  amount integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id ON public.credits_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_created_at ON public.credits_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_source ON public.credits_ledger(source);
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.credits_ledger ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.credits_ledger ADD COLUMN IF NOT EXISTS balance_after integer;
ALTER TABLE public.credits_ledger ADD COLUMN IF NOT EXISTS reference_id text;
ALTER TABLE public.credits_ledger ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.credits_ledger ADD COLUMN IF NOT EXISTS operator text;

ALTER TABLE public.credits_ledger DROP CONSTRAINT IF EXISTS credits_ledger_source_check;
ALTER TABLE public.credits_ledger ADD CONSTRAINT credits_ledger_source_check CHECK (
  source IN (
    'generation_cost', 'purchase', 'signup_bonus', 'promo_reward', 'admin_adjustment', 'refund',
    'registration', 'postcard', 'admin_adjust', 'event'
  )
);

DROP POLICY IF EXISTS "Admins can read credits_ledger" ON public.credits_ledger;
DROP POLICY IF EXISTS "Admins and support can read credits_ledger" ON public.credits_ledger;
DROP POLICY IF EXISTS "Admins can insert credits_ledger" ON public.credits_ledger;
DROP POLICY IF EXISTS "Users can read own credits_ledger" ON public.credits_ledger;
CREATE POLICY "Admins and support can read credits_ledger" ON public.credits_ledger FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support')));
CREATE POLICY "Admins can insert credits_ledger" ON public.credits_ledger FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Users can insert own postcard consumption" ON public.credits_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id AND source = 'postcard');

-- 3) 先创建统一积分函数（必须在 handle_new_user 之前）
CREATE OR REPLACE FUNCTION public.update_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_source text,
  p_reference_id text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_operator text DEFAULT 'system',
  p_bucket text DEFAULT NULL
)
RETURNS TABLE (promo_credits integer, paid_credits integer, total_credits integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_promo integer;
  v_paid integer;
  v_total integer;
  v_need integer;
  v_type text;
BEGIN
  IF p_amount = 0 THEN RAISE EXCEPTION 'amount cannot be zero'; END IF;

  SELECT promo_credits, paid_credits INTO v_promo, v_paid FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF v_promo IS NULL THEN v_promo := 0; END IF;
  IF v_paid IS NULL THEN v_paid := 0; END IF;

  IF p_amount < 0 THEN
    v_need := -p_amount;
    IF p_bucket = 'promo' THEN
      IF v_promo < v_need THEN RAISE EXCEPTION 'insufficient promo credits'; END IF;
      v_promo := v_promo - v_need;
    ELSIF p_bucket = 'paid' THEN
      IF v_paid < v_need THEN RAISE EXCEPTION 'insufficient paid credits'; END IF;
      v_paid := v_paid - v_need;
    ELSE
      IF v_promo + v_paid < v_need THEN RAISE EXCEPTION 'insufficient total credits'; END IF;
      IF v_promo >= v_need THEN v_promo := v_promo - v_need;
      ELSE v_need := v_need - v_promo; v_promo := 0; v_paid := v_paid - v_need; END IF;
    END IF;
    v_type := 'credit_deduct';
  ELSE
    IF p_bucket = 'promo' THEN v_promo := v_promo + p_amount;
    ELSIF p_bucket = 'paid' THEN v_paid := v_paid + p_amount;
    ELSIF p_source IN ('signup_bonus', 'promo_reward') THEN v_promo := v_promo + p_amount;
    ELSE v_paid := v_paid + p_amount; END IF;
    v_type := 'credit_add';
  END IF;

  v_total := v_promo + v_paid;
  UPDATE public.profiles SET
    promo_credits = v_promo, paid_credits = v_paid, credits = v_total,
    total_paid_credits = CASE WHEN p_source = 'purchase' AND p_amount > 0 THEN COALESCE(total_paid_credits, 0) + p_amount ELSE total_paid_credits END
  WHERE id = p_user_id;

  INSERT INTO public.credits_ledger (user_id, credit_type, source, amount, balance_after, reference_id, notes, operator, type)
  VALUES (
    p_user_id,
    CASE WHEN p_bucket = 'promo' OR p_source IN ('signup_bonus', 'promo_reward') THEN 'promo' ELSE 'paid' END,
    p_source, p_amount, v_total, p_reference_id, p_notes, COALESCE(p_operator, 'system'), v_type
  );
  RETURN QUERY SELECT v_promo, v_paid, v_total;
END;
$$;

-- 4) payment_config 增加「新用户赠送积分」「每张明信片消耗积分」配置（后台可改）
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS signup_bonus_credits integer DEFAULT 3;
ALTER TABLE public.payment_config ADD COLUMN IF NOT EXISTS credits_per_postcard integer DEFAULT 1;
UPDATE public.payment_config SET signup_bonus_credits = COALESCE(signup_bonus_credits, 3), credits_per_postcard = COALESCE(credits_per_postcard, 1) WHERE id = 1;

-- 5) 新用户注册：先建 profile(0,0,0)，再按后台配置 signup_bonus_credits 发放赠送积分
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE v_bonus integer;
BEGIN
  INSERT INTO public.profiles (id, email, nickname, credits, promo_credits, paid_credits)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)), 0, 0, 0);
  SELECT COALESCE(signup_bonus_credits, 0) INTO v_bonus FROM public.payment_config WHERE id = 1 LIMIT 1;
  IF v_bonus IS NOT NULL AND v_bonus > 0 THEN
    PERFORM public.update_user_credits(NEW.id, v_bonus, 'signup_bonus', NULL, 'Signup welcome bonus', 'system', 'promo');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) 后台可读全部 profiles（按你当前策略：登录即可读，便于用户列表有数据）
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- 执行完成后，新注册用户会走 handle_new_user → update_user_credits，有流水；生成/购买/管理员调整也请走 updateUserCredits RPC。