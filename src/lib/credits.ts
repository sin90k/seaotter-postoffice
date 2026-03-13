import { supabase, isSupabaseConnected } from './supabaseClient';

export type CreditSource =
  | 'generation_cost'
  | 'purchase'
  | 'signup_bonus'
  | 'promo_reward'
  | 'admin_adjustment'
  | 'refund';

export type CreditTxType = 'credit_add' | 'credit_deduct';

export type CreditBucket = 'promo' | 'paid' | null;

export type UpdateUserCreditsResult = {
  promo_credits: number;
  paid_credits: number;
  total_credits: number;
};

let creditsPerPostcardCache: number | null = null;

/**
 * 统一的积分变更入口。所有加/减积分都应通过此函数，内部调用 Supabase RPC（Postgres 函数 update_user_credits）。
 */
export async function updateUserCredits(
  userId: string,
  amount: number,
  source: CreditSource,
  options?: {
    referenceId?: string | null;
    notes?: string | null;
    operator?: 'system' | 'admin';
    bucket?: CreditBucket;
  }
): Promise<{ ok: boolean; data?: UpdateUserCreditsResult; error?: string }> {
  if (!isSupabaseConnected || !userId || !amount) {
    return { ok: false, error: 'supabase_not_connected_or_invalid_params' };
  }

  const { referenceId = null, notes = null, operator = 'system', bucket = null } = options || {};

  const { data, error } = await supabase.rpc('update_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_source: source,
    p_reference_id: referenceId,
    p_notes: notes,
    p_operator: operator,
    p_bucket: bucket,
  });

  if (error) {
    console.error('[credits] updateUserCredits error:', error);
    return { ok: false, error: error.message || 'update_failed' };
  }

  if (!data || !Array.isArray(data) || !data[0]) {
    return { ok: false, error: 'empty_result' };
  }

  const row = data[0] as { promo_credits: number; paid_credits: number; total_credits: number };
  return {
    ok: true,
    data: {
      promo_credits: row.promo_credits ?? 0,
      paid_credits: row.paid_credits ?? 0,
      total_credits: row.total_credits ?? 0,
    },
  };
}

/** 从后台配置读取「每张明信片消耗积分」，用于扣费计算。优先 Supabase payment_config，否则 localStorage，默认 1。 */
export async function getCreditsPerPostcard(): Promise<number> {
  if (creditsPerPostcardCache != null) return creditsPerPostcardCache;

  if (isSupabaseConnected) {
    const { data, error } = await supabase.from('payment_config').select('credits_per_postcard').eq('id', 1).single();
    if (!error && data && typeof (data as { credits_per_postcard?: number }).credits_per_postcard === 'number') {
      const v = (data as { credits_per_postcard: number }).credits_per_postcard;
      if (v >= 0) {
        creditsPerPostcardCache = v;
        return v;
      }
    }
  }
  const ls = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_credits_per_postcard') : null;
  const n = ls != null ? parseInt(ls, 10) : NaN;
  const fallback = Number.isFinite(n) && n >= 0 ? n : 1;
  creditsPerPostcardCache = fallback;
  return fallback;
}

