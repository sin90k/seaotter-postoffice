import { isSupabaseConnected, supabase } from './supabaseClient';

export type BrandSettings = {
  brandName: string;
  brandNameZh: string;
  brandDomain: string;
  logoUrl: string;
  watermarkPosition: string;
  watermarkOpacity: number;
  watermarkSize: number;
};

type BrandSettingsRow = {
  brand_name?: string | null;
  brand_name_zh?: string | null;
  brand_domain?: string | null;
  logo_url?: string | null;
  watermark_position?: string | null;
  watermark_opacity?: number | string | null;
  watermark_size?: number | string | null;
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: 'Sea Otter Post Office',
  brandNameZh: '海獭邮局',
  brandDomain: 'seaotter-postoffice.vercel.app',
  logoUrl: '/seaotter-logo.svg',
  watermarkPosition: 'bottom-center',
  watermarkOpacity: 0.62,
  watermarkSize: 1,
};

const LOCAL_KEYS = {
  brandName: 'admin_brand_name',
  brandNameZh: 'admin_brand_name_zh',
  brandDomain: 'admin_brand_domain',
  logoUrl: 'admin_brand_logo_url',
  logoData: 'admin_brand_logo_data',
  watermarkPosition: 'admin_watermark_position',
  watermarkOpacity: 'admin_watermark_opacity',
  watermarkSize: 'admin_watermark_size',
};

const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

const normalize = (settings: Partial<BrandSettings>): BrandSettings => ({
  brandName: settings.brandName?.trim() || DEFAULT_BRAND_SETTINGS.brandName,
  brandNameZh: settings.brandNameZh?.trim() || DEFAULT_BRAND_SETTINGS.brandNameZh,
  brandDomain: settings.brandDomain?.trim() || DEFAULT_BRAND_SETTINGS.brandDomain,
  logoUrl: settings.logoUrl?.trim() || DEFAULT_BRAND_SETTINGS.logoUrl,
  watermarkPosition: settings.watermarkPosition?.trim() || DEFAULT_BRAND_SETTINGS.watermarkPosition,
  watermarkOpacity: clamp(Number(settings.watermarkOpacity), 0, 1, DEFAULT_BRAND_SETTINGS.watermarkOpacity),
  watermarkSize: clamp(Number(settings.watermarkSize), 0.1, 2, DEFAULT_BRAND_SETTINGS.watermarkSize),
});

const fromRow = (row: BrandSettingsRow | null | undefined): BrandSettings => normalize({
  brandName: row?.brand_name || undefined,
  brandNameZh: row?.brand_name_zh || undefined,
  brandDomain: row?.brand_domain || undefined,
  logoUrl: row?.logo_url || undefined,
  watermarkPosition: row?.watermark_position || undefined,
  watermarkOpacity: Number(row?.watermark_opacity),
  watermarkSize: Number(row?.watermark_size),
});

export function readLocalBrandSettings(): BrandSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_BRAND_SETTINGS;
  const logoData = localStorage.getItem(LOCAL_KEYS.logoData) || '';
  return normalize({
    brandName: localStorage.getItem(LOCAL_KEYS.brandName) || undefined,
    brandNameZh: localStorage.getItem(LOCAL_KEYS.brandNameZh) || undefined,
    brandDomain: localStorage.getItem(LOCAL_KEYS.brandDomain) || undefined,
    logoUrl: logoData || localStorage.getItem(LOCAL_KEYS.logoUrl) || undefined,
    watermarkPosition: localStorage.getItem(LOCAL_KEYS.watermarkPosition) || undefined,
    watermarkOpacity: Number(localStorage.getItem(LOCAL_KEYS.watermarkOpacity)),
    watermarkSize: Number(localStorage.getItem(LOCAL_KEYS.watermarkSize)),
  });
}

export function applyBrandSettingsToLocalCache(settings: BrandSettings): void {
  if (typeof localStorage === 'undefined') return;
  const normalized = normalize(settings);
  localStorage.setItem(LOCAL_KEYS.brandName, normalized.brandName);
  localStorage.setItem(LOCAL_KEYS.brandNameZh, normalized.brandNameZh);
  localStorage.setItem(LOCAL_KEYS.brandDomain, normalized.brandDomain);
  localStorage.setItem(LOCAL_KEYS.watermarkPosition, normalized.watermarkPosition);
  localStorage.setItem(LOCAL_KEYS.watermarkOpacity, String(normalized.watermarkOpacity));
  localStorage.setItem(LOCAL_KEYS.watermarkSize, String(normalized.watermarkSize));
  if (normalized.logoUrl.startsWith('data:image/')) {
    localStorage.setItem(LOCAL_KEYS.logoData, normalized.logoUrl);
    localStorage.removeItem(LOCAL_KEYS.logoUrl);
  } else {
    localStorage.setItem(LOCAL_KEYS.logoUrl, normalized.logoUrl);
    localStorage.removeItem(LOCAL_KEYS.logoData);
  }
}

export async function loadBrandSettings(): Promise<BrandSettings> {
  if (!isSupabaseConnected) return readLocalBrandSettings();
  const { data, error } = await supabase
    .from('brand_settings')
    .select('brand_name, brand_name_zh, brand_domain, logo_url, watermark_position, watermark_opacity, watermark_size')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) {
    return readLocalBrandSettings();
  }
  const settings = fromRow(data as BrandSettingsRow);
  applyBrandSettingsToLocalCache(settings);
  return settings;
}

export async function saveBrandSettings(settings: BrandSettings): Promise<BrandSettings> {
  const normalized = normalize(settings);
  applyBrandSettingsToLocalCache(normalized);
  if (!isSupabaseConnected) return normalized;
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id || null;
  const { data, error } = await supabase
    .from('brand_settings')
    .upsert({
      id: 1,
      brand_name: normalized.brandName,
      brand_name_zh: normalized.brandNameZh,
      brand_domain: normalized.brandDomain,
      logo_url: normalized.logoUrl,
      watermark_position: normalized.watermarkPosition,
      watermark_opacity: normalized.watermarkOpacity,
      watermark_size: normalized.watermarkSize,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }, { onConflict: 'id' })
    .select('brand_name, brand_name_zh, brand_domain, logo_url, watermark_position, watermark_opacity, watermark_size')
    .single();
  if (error) {
    throw new Error(error.message || '保存品牌设置失败');
  }
  const saved = fromRow(data as BrandSettingsRow);
  applyBrandSettingsToLocalCache(saved);
  return saved;
}
