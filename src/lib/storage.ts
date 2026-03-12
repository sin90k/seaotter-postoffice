import { get, set } from 'idb-keyval';
import { ProcessedPostcard } from '../App';
import { supabase, isSupabaseConnected } from './supabaseClient';

const isTableMissing = (err: { code?: string; message?: string }) =>
  err?.code === 'PGRST205' || (err?.message ?? '').includes('Could not find the table');

/**
 * 登录用户：优先从 Supabase postcards 表读取历史；
 * 游客或 Supabase 未连接：使用浏览器本地 IndexedDB。
 */
export const loadHistory = async (userId?: string | null): Promise<ProcessedPostcard[]> => {
  if (userId && isSupabaseConnected) {
    const { data, error } = await supabase
      .from('postcards')
      .select('payload')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      if (isTableMissing(error)) {
        // 表不存在时返回空数组，但不再永久跳过；建表后下次会自动生效
        return [];
      }
      console.error('[storage] loadHistory Supabase error:', error);
      return (await get('postcard_history')) || [];
    }
    return (data || []).map((r: { payload: ProcessedPostcard }) => r.payload);
  }
  return ((await get('postcard_history')) as ProcessedPostcard[] | undefined) || [];
};

/**
 * 同步历史到 Supabase：
 * - 登录用户：postcards 表作为权威数据源，本地 IndexedDB 仅作缓存；
 * - 游客：只写 IndexedDB。
 */
export const saveHistory = async (history: ProcessedPostcard[], userId?: string | null): Promise<void> => {
  if (userId && isSupabaseConnected) {
    const { error: delErr } = await supabase.from('postcards').delete().eq('user_id', userId);
    if (delErr && !isTableMissing(delErr)) {
      console.error('[storage] saveHistory delete error:', delErr);
    }
    if (history.length > 0) {
      const rows = history.map((p) => ({ user_id: userId, payload: p }));
      const { error: insErr } = await supabase.from('postcards').insert(rows);
      if (insErr && !isTableMissing(insErr)) {
        console.error('[storage] saveHistory insert error:', insErr);
      }
    }
    await set('postcard_history', history);
    return;
  }
  await set('postcard_history', history);
};
