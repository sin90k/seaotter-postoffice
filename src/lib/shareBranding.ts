import { supabase, isSupabaseConnected } from './supabaseClient';
import type { ShareBrandingOptions } from './shareCard';

const defaults: ShareBrandingOptions = {
  enabled: true,
  text: 'seaotterpost.com',
  opacity: 0.7,
  sizeRatio: 0.02,
};

let cache: { value: ShareBrandingOptions; fetchedAt: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export async function getShareBranding(): Promise<ShareBrandingOptions> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_MS) return cache.value;
  if (!isSupabaseConnected) return defaults;
  const { data, error } = await supabase
    .from('share_branding')
    .select('branding_enabled, branding_text, branding_opacity, branding_size')
    .limit(1)
    .maybeSingle();
  if (error || !data) return defaults;
  const row = data as { branding_enabled?: boolean; branding_text?: string; branding_opacity?: number; branding_size?: number };
  const value: ShareBrandingOptions = {
    enabled: row.branding_enabled ?? defaults.enabled,
    text: (row.branding_text ?? defaults.text).trim() || defaults.text,
    opacity: Number(row.branding_opacity) || defaults.opacity,
    sizeRatio: Number(row.branding_size) || defaults.sizeRatio,
  };
  cache = { value, fetchedAt: now };
  return value;
}
