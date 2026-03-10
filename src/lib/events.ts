import { supabase, isSupabaseConnected } from './supabaseClient';

const EVENTS_SKIP_KEY = 'seaotter_events_table_skip';

export type EventType =
  | 'sign_up'
  | 'sign_in'
  | 'sign_out'
  | 'postcard_generated'
  | 'credits_purchased'
  | 'admin_panel_view';

/** 记录关键行为到 Supabase events 表。若表不存在则静默跳过且后续不再请求。 */
export const logEvent = async (
  eventType: EventType,
  payload?: Record<string, unknown>
): Promise<void> => {
  if (!isSupabaseConnected) return;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(EVENTS_SKIP_KEY) === '1') return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('events').insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      payload: payload ?? {},
    });
    if (error) {
      if (error.code === 'PGRST205' || (error as { status?: number }).status === 404 || (error.message || '').includes('Could not find the table')) {
        try { sessionStorage.setItem(EVENTS_SKIP_KEY, '1'); } catch { }
      } else {
        console.warn('[events] logEvent failed:', error.message);
      }
    }
  } catch (e) {
    try { sessionStorage.setItem(EVENTS_SKIP_KEY, '1'); } catch { }
  }
};
