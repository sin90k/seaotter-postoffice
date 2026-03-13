import { supabase, isSupabaseConnected } from './supabaseClient';

/** 仅同步 generated_count（及可选 last_active_at）到 profiles，不修改积分。积分变更请使用 credits.updateUserCredits。 */
export async function syncGeneratedCount(
  userId: string,
  generatedCount: number,
  options?: { lastActiveAt?: Date }
): Promise<void> {
  if (!isSupabaseConnected || !userId) return;
  const payload: { generated_count: number; last_active_at?: string } = { generated_count: generatedCount };
  if (options?.lastActiveAt) payload.last_active_at = options.lastActiveAt.toISOString();
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) console.error('[profileSync] syncGeneratedCount error:', error);
}
