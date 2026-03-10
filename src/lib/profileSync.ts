import { supabase, isSupabaseConnected } from './supabaseClient';

/** 扣积分/购买积分后同步到 Supabase profiles。更新 credits、promo_credits、paid_credits、generated_count。 */
export const syncCreditsToSupabase = async (
  userId: string,
  promo_credits: number,
  paid_credits: number,
  generatedCount: number
): Promise<void> => {
  if (!isSupabaseConnected) return;
  const credits = promo_credits + paid_credits;
  const { error } = await supabase
    .from('profiles')
    .update({
      credits,
      promo_credits: promo_credits,
      paid_credits: paid_credits,
      generated_count: generatedCount,
    })
    .eq('id', userId);
  if (error) {
    console.error('[profileSync] syncCreditsToSupabase error:', error);
  }
};

/** 记录单次生成明信片的积分消耗到 credits_ledger，便于后台统计与追溯。 */
export const recordPostcardConsumption = async (
  userId: string,
  promoUsed: number,
  paidUsed: number
): Promise<void> => {
  if (!isSupabaseConnected || (promoUsed === 0 && paidUsed === 0)) return;
  const rows: { user_id: string; credit_type: string; source: string; amount: number }[] = [];
  if (promoUsed > 0) rows.push({ user_id: userId, credit_type: 'promo', source: 'postcard', amount: -promoUsed });
  if (paidUsed > 0) rows.push({ user_id: userId, credit_type: 'paid', source: 'postcard', amount: -paidUsed });
  if (rows.length === 0) return;
  const { error } = await supabase.from('credits_ledger').insert(rows);
  if (error) {
    if (error.code === 'PGRST205' || (error.message || '').includes('Could not find the table')) {
      return;
    }
    console.error('[profileSync] recordPostcardConsumption error:', error);
  }
};
