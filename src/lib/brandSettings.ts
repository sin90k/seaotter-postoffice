import { isSupabaseConnected, supabase } from './supabaseClient';

export type BrandSettings = {
  brandName: string;
  brandNameZh: string;
  brandDomain: string;
  logoUrl: string;
  watermarkPosition: string;
  watermarkOpacity: number;
  watermarkSize: number;
  signatureProfiles: BrandSignatureProfiles;
};

export type BrandSignatureLayout = 'landscape' | 'portrait' | 'square';

export type BrandSignatureProfile = {
  position: string;
  qrScale: number;
  logoScale: number;
};

export type BrandSignatureProfiles = Record<BrandSignatureLayout, BrandSignatureProfile>;

type BrandSettingsInput = Omit<Partial<BrandSettings>, 'signatureProfiles'> & {
  signatureProfiles?: unknown;
};

type BrandSettingsRow = {
  brand_name?: string | null;
  brand_name_zh?: string | null;
  brand_domain?: string | null;
  logo_url?: string | null;
  watermark_position?: string | null;
  watermark_opacity?: number | string | null;
  watermark_size?: number | string | null;
  signature_profiles?: unknown;
};

const VALID_POSITIONS = new Set([
  'bottom-center', 'bottom-left', 'bottom-right',
  'top-center', 'top-left', 'top-right',
]);

export const DEFAULT_SIGNATURE_PROFILES: BrandSignatureProfiles = {
  landscape: { position: 'bottom-right', qrScale: 1, logoScale: 1 },
  portrait: { position: 'bottom-center', qrScale: 0.9, logoScale: 1 },
  square: { position: 'bottom-right', qrScale: 0.9, logoScale: 1 },
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brandName: 'Sea Otter Post Office',
  brandNameZh: '海獭邮局',
  brandDomain: 'seaotter-postoffice.vercel.app',
  logoUrl: '/seaotter-logo.svg',
  watermarkPosition: 'bottom-center',
  watermarkOpacity: 0.62,
  watermarkSize: 1,
  signatureProfiles: DEFAULT_SIGNATURE_PROFILES,
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
  signatureProfiles: 'admin_brand_signature_profiles',
};

const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

const parseProfiles = (value: unknown): Partial<BrandSignatureProfiles> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Partial<BrandSignatureProfiles>;
    } catch {
      return {};
    }
  }
  return typeof value === 'object' ? value as Partial<BrandSignatureProfiles> : {};
};

export const normalizeSignatureProfiles = (
  value: unknown,
  fallbackPosition = DEFAULT_BRAND_SETTINGS.watermarkPosition,
  fallbackSize = DEFAULT_BRAND_SETTINGS.watermarkSize
): BrandSignatureProfiles => {
  const parsed = parseProfiles(value);
  const normalizeProfile = (layout: BrandSignatureLayout): BrandSignatureProfile => {
    const fallback = DEFAULT_SIGNATURE_PROFILES[layout];
    const source = parsed[layout];
    const position = String(source?.position || fallbackPosition || fallback.position);
    return {
      position: VALID_POSITIONS.has(position) ? position : fallback.position,
      qrScale: clamp(Number(source?.qrScale), 0.5, 2.5, clamp(fallbackSize, 0.5, 2.5, fallback.qrScale)),
      logoScale: clamp(Number(source?.logoScale), 0.5, 2.5, clamp(fallbackSize, 0.5, 2.5, fallback.logoScale)),
    };
  };
  return {
    landscape: normalizeProfile('landscape'),
    portrait: normalizeProfile('portrait'),
    square: normalizeProfile('square'),
  };
};

const normalize = (settings: BrandSettingsInput): BrandSettings => {
  const watermarkPosition = settings.watermarkPosition?.trim() || DEFAULT_BRAND_SETTINGS.watermarkPosition;
  const watermarkSize = clamp(Number(settings.watermarkSize), 0.1, 2, DEFAULT_BRAND_SETTINGS.watermarkSize);
  return {
    brandName: settings.brandName?.trim() || DEFAULT_BRAND_SETTINGS.brandName,
    brandNameZh: settings.brandNameZh?.trim() || DEFAULT_BRAND_SETTINGS.brandNameZh,
    brandDomain: settings.brandDomain?.trim() || DEFAULT_BRAND_SETTINGS.brandDomain,
    logoUrl: settings.logoUrl?.trim() || DEFAULT_BRAND_SETTINGS.logoUrl,
    watermarkPosition,
    watermarkOpacity: clamp(Number(settings.watermarkOpacity), 0, 1, DEFAULT_BRAND_SETTINGS.watermarkOpacity),
    watermarkSize,
    signatureProfiles: normalizeSignatureProfiles(settings.signatureProfiles, watermarkPosition, watermarkSize),
  };
};

const fromRow = (row: BrandSettingsRow | null | undefined): BrandSettings => normalize({
  brandName: row?.brand_name || undefined,
  brandNameZh: row?.brand_name_zh || undefined,
  brandDomain: row?.brand_domain || undefined,
  logoUrl: row?.logo_url || undefined,
  watermarkPosition: row?.watermark_position || undefined,
  watermarkOpacity: Number(row?.watermark_opacity),
  watermarkSize: Number(row?.watermark_size),
  signatureProfiles: parseProfiles(row?.signature_profiles),
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
    signatureProfiles: parseProfiles(localStorage.getItem(LOCAL_KEYS.signatureProfiles)),
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
  localStorage.setItem(LOCAL_KEYS.signatureProfiles, JSON.stringify(normalized.signatureProfiles));
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
    .select('*')
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
      signature_profiles: normalized.signatureProfiles,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    }, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) {
    throw new Error(error.message || '保存品牌设置失败');
  }
  const saved = fromRow(data as BrandSettingsRow);
  applyBrandSettingsToLocalCache(saved);
  return saved;
}
