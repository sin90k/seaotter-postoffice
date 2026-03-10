import { get, set } from 'idb-keyval';
import { ProcessedPostcard } from '../App';
import { supabase, isSupabaseConnected } from './supabaseClient';

const POSTCARDS_SKIP_KEY = 'seaotter_postcards_table_skip';

const isTableMissing = (err: { code?: string; message?: string }) =>
  err?.code === 'PGRST205' || (err?.message ?? '').includes("Could not find the table");

const shouldSkipPostcards = () => typeof sessionStorage !== 'undefined' && sessionStorage.getItem(POSTCARDS_SKIP_KEY) === '1';

/** 登录用户用 Supabase，游客用 IndexedDB。若 postcards 表不存在则返回空数组且后续不再请求。 */
export const loadHistory = async (userId?: string | null): Promise<ProcessedPostcard[]> => {
  if (userId && isSupabaseConnected && !shouldSkipPostcards()) {
    const { data, error } = await supabase
      .from('postcards')
      .select('payload')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      if (isTableMissing(error)) {
        try { sessionStorage.setItem(POSTCARDS_SKIP_KEY, '1'); } catch { }
        return [];
      }
      console.error('[storage] loadHistory Supabase error:', error);
      return (await get('postcard_history')) || [];
    }
    return (data || []).map((r: { payload: ProcessedPostcard }) => r.payload);
  }
  if (userId && isSupabaseConnected && shouldSkipPostcards()) {
    return (await get('postcard_history')) || [];
  }
  return (await get('postcard_history')) || [];
};

/** 若 postcards 表不存在则跳过同步且后续不再请求。 */
export const saveHistory = async (history: ProcessedPostcard[], userId?: string | null): Promise<void> => {
  if (userId && isSupabaseConnected && shouldSkipPostcards()) {
    await set('postcard_history', history);
    return;
  }
  if (userId && isSupabaseConnected) {
    const { error: delErr } = await supabase.from('postcards').delete().eq('user_id', userId);
    if (delErr) {
      if (isTableMissing(delErr)) {
        try { sessionStorage.setItem(POSTCARDS_SKIP_KEY, '1'); } catch { }
      } else {
        console.error('[storage] saveHistory delete error:', delErr);
      }
    }
    if (history.length > 0 && !shouldSkipPostcards()) {
      const rows = history.map((p) => ({ user_id: userId, payload: p }));
      const { error: insErr } = await supabase.from('postcards').insert(rows);
      if (insErr) {
        if (isTableMissing(insErr)) try { sessionStorage.setItem(POSTCARDS_SKIP_KEY, '1'); } catch { }
        else console.error('[storage] saveHistory insert error:', insErr);
      }
    }
    await set('postcard_history', history);
    return;
  }
  await set('postcard_history', history);
};
