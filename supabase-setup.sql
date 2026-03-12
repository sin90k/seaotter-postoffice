-- 在 Supabase SQL Editor 中运行

-- 1. 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  nickname text,
  role text DEFAULT 'user',
  credits integer DEFAULT 3,
  generated_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 删除旧策略（若存在）
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- 4. 创建策略
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin 可读全部 profiles（用于 AdminPanel）
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 5. 触发器：新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 为已存在的用户补建 profile
INSERT INTO public.profiles (id, email, nickname, credits)
SELECT id, email, COALESCE(raw_user_meta_data->>'nickname', split_part(email, '@', 1)), 3
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ========== postcards 表（明信片历史） ==========
CREATE TABLE IF NOT EXISTS public.postcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_postcards_user_id ON public.postcards(user_id);
CREATE INDEX IF NOT EXISTS idx_postcards_created_at ON public.postcards(created_at DESC);

ALTER TABLE public.postcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own postcards" ON public.postcards;
DROP POLICY IF EXISTS "Users can insert own postcards" ON public.postcards;
DROP POLICY IF EXISTS "Users can update own postcards" ON public.postcards;
DROP POLICY IF EXISTS "Users can delete own postcards" ON public.postcards;

CREATE POLICY "Users can read own postcards"
  ON public.postcards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own postcards"
  ON public.postcards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own postcards"
  ON public.postcards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own postcards"
  ON public.postcards FOR DELETE
  USING (auth.uid() = user_id);

-- ========== events 表（行为埋点） ==========
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Admins can read all events" ON public.events;

CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read all events"
  ON public.events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ========== 双积分列 + 管理员可改他人积分 ==========
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS promo_credits integer DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_credits integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_paid_credits integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_source text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
-- 兼容旧数据：无 promo/paid 时用 credits 当作 promo
UPDATE public.profiles SET promo_credits = COALESCE(promo_credits, credits, 0), paid_credits = COALESCE(paid_credits, 0) WHERE promo_credits IS NULL OR paid_credits IS NULL;

DROP POLICY IF EXISTS "Admins can update any profile credits" ON public.profiles;
CREATE POLICY "Admins can update any profile credits"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (true);

-- 新用户注册时写入双积分
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, credits, promo_credits, paid_credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    3,
    3,
    0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== credits_ledger 积分流水（管理后台 MVP） ==========
CREATE TABLE IF NOT EXISTS public.credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_type text NOT NULL CHECK (credit_type IN ('promo', 'paid', 'other')),
  source text NOT NULL CHECK (source IN ('registration', 'purchase', 'postcard', 'admin_adjust', 'event')),
  amount integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_credits_ledger_user_id ON public.credits_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_created_at ON public.credits_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credits_ledger_source ON public.credits_ledger(source);

ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read credits_ledger" ON public.credits_ledger;
DROP POLICY IF EXISTS "Admins and support can read credits_ledger" ON public.credits_ledger;
DROP POLICY IF EXISTS "Admins can insert credits_ledger" ON public.credits_ledger;
DROP POLICY IF EXISTS "Users can read own credits_ledger" ON public.credits_ledger;

CREATE POLICY "Admins and support can read credits_ledger"
  ON public.credits_ledger FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support')));

CREATE POLICY "Admins can insert credits_ledger"
  ON public.credits_ledger FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Users can insert own consumption rows (postcard) for audit trail
CREATE POLICY "Users can insert own postcard consumption"
  ON public.credits_ledger FOR INSERT
  WITH CHECK (auth.uid() = user_id AND source = 'postcard');

-- Support 角色：可读全部 profiles/postcards/events，不可改积分
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 仅 admin 可更新他人 profile（support 不可）
DROP POLICY IF EXISTS "Admins can update any profile credits" ON public.profiles;
CREATE POLICY "Admins can update any profile credits"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (true);

-- Admin/Support 可读全部 postcards（用于后台列表）
DROP POLICY IF EXISTS "Admins can read all postcards" ON public.postcards;
CREATE POLICY "Admins can read all postcards"
  ON public.postcards FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support')));

-- ========== payments 表（支付订单，人工确认后自动充值） ==========
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- 购买的积分数量
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
  provider text, -- wechat / alipay / paypal / other
  note text, -- 备注或渠道单号
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  meta jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 普通用户可以插入自己的 pending 订单（前台创建）
DROP POLICY IF EXISTS "Users can insert own pending payments" ON public.payments;
CREATE POLICY "Users can insert own pending payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 普通用户可以查看自己的订单（仅前台展示）
DROP POLICY IF EXISTS "Users can read own payments" ON public.payments;
CREATE POLICY "Users can read own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

-- Admin/Support 可读取全部订单（后台列表）
DROP POLICY IF EXISTS "Admins can read all payments" ON public.payments;
CREATE POLICY "Admins can read all payments"
  ON public.payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support')));

-- 仅 admin 可以更新订单状态（标记已支付 / 取消）
DROP POLICY IF EXISTS "Admins can update any payments" ON public.payments;
CREATE POLICY "Admins can update any payments"
  ON public.payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (true);

-- ========== payment_config 表（收款码与说明，唯一单行，前台可读） ==========
CREATE TABLE IF NOT EXISTS public.payment_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  wechat_qr_url text,
  alipay_qr_url text,
  payment_note text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- 所有人（含未登录）可读，用于前台购买弹窗展示收款码
DROP POLICY IF EXISTS "Anyone can read payment_config" ON public.payment_config;
CREATE POLICY "Anyone can read payment_config"
  ON public.payment_config FOR SELECT
  USING (true);

-- 仅 admin 可插入/更新
DROP POLICY IF EXISTS "Admins can insert payment_config" ON public.payment_config;
CREATE POLICY "Admins can insert payment_config"
  ON public.payment_config FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "Admins can update payment_config" ON public.payment_config;
CREATE POLICY "Admins can update payment_config"
  ON public.payment_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (true);

INSERT INTO public.payment_config (id, wechat_qr_url, alipay_qr_url, payment_note)
VALUES (1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 收款码图片存储：请在 Supabase Dashboard → Storage 中新建桶 payment-qr，设为 Public。
-- 再在 Storage → Policies 为该桶添加：INSERT/UPDATE 仅当 profiles.role = 'admin'（或直接用 Dashboard 的 “Allow public read” + “Authenticated upload”）。
