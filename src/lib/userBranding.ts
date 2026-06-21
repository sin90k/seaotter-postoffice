import { isSupabaseConnected, supabase } from './supabaseClient';

const STORAGE_BUCKET = 'postcards';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export type UserBrandPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type UserBrandSettings = {
  enabled: boolean;
  brandName: string;
  logoPath: string | null;
  logoUrl: string;
  qrTargetUrl: string;
  position: UserBrandPosition;
  qrScale: number;
  logoScale: number;
  opacity: number;
};

type UserBrandRow = {
  enabled?: boolean | null;
  brand_name?: string | null;
  logo_path?: string | null;
  qr_target_url?: string | null;
  position?: string | null;
  qr_scale?: number | string | null;
  logo_scale?: number | string | null;
  opacity?: number | string | null;
};

export const DEFAULT_USER_BRAND_SETTINGS: UserBrandSettings = {
  enabled: false,
  brandName: '',
  logoPath: null,
  logoUrl: '',
  qrTargetUrl: '',
  position: 'bottom-right',
  qrScale: 1,
  logoScale: 1,
  opacity: 0.8,
};

const POSITIONS = new Set<UserBrandPosition>([
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]);

const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('二维码网址必须使用 http 或 https');
  return parsed.toString();
};

const normalize = (row: UserBrandRow, logoUrl = ''): UserBrandSettings => {
  const position = String(row.position || DEFAULT_USER_BRAND_SETTINGS.position) as UserBrandPosition;
  return {
    enabled: row.enabled === true,
    brandName: String(row.brand_name || '').trim().slice(0, 48),
    logoPath: row.logo_path || null,
    logoUrl,
    qrTargetUrl: String(row.qr_target_url || '').trim(),
    position: POSITIONS.has(position) ? position : DEFAULT_USER_BRAND_SETTINGS.position,
    qrScale: clamp(Number(row.qr_scale), 0.5, 2.5, 1),
    logoScale: clamp(Number(row.logo_scale), 0.5, 2.5, 1),
    opacity: clamp(Number(row.opacity), 0.35, 1, 0.8),
  };
};

export function hasUserBrandingEntitlement(user: {
  paid_credits?: number;
  totalPaidCredits?: number;
  role?: string;
}): boolean {
  return (user.totalPaidCredits ?? 0) > 0 || (user.paid_credits ?? 0) > 0 || user.role === 'admin';
}

async function createLogoUrl(path: string | null): Promise<string> {
  if (!path || !isSupabaseConnected) return '';
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) throw error;
  return data?.signedUrl || '';
}

export async function loadUserBrandSettings(userId: string): Promise<UserBrandSettings | null> {
  if (!isSupabaseConnected || !userId) return null;
  const { data, error } = await supabase
    .from('user_brand_settings')
    .select('enabled,brand_name,logo_path,qr_target_url,position,qr_scale,logo_scale,opacity')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const logoUrl = await createLogoUrl((data as UserBrandRow).logo_path || null);
  return normalize(data as UserBrandRow, logoUrl);
}

export async function saveUserBrandSettings(
  userId: string,
  settings: UserBrandSettings,
  logoFile?: File | null
): Promise<UserBrandSettings> {
  if (!isSupabaseConnected) throw new Error('Supabase 未连接，无法保存个人品牌');
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.user || sessionData.session.user.id !== userId) {
    throw new Error('登录状态已失效，请重新登录');
  }

  let logoPath = settings.logoPath;
  if (logoFile) {
    if (!ALLOWED_LOGO_TYPES.has(logoFile.type)) throw new Error('Logo 仅支持 PNG、JPG 或 WebP');
    if (logoFile.size > MAX_LOGO_BYTES) throw new Error('Logo 文件不能超过 2MB');
    const extension = logoFile.type === 'image/png' ? 'png' : logoFile.type === 'image/webp' ? 'webp' : 'jpg';
    logoPath = `${userId}/branding/logo.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(logoPath, logoFile, { upsert: true, contentType: logoFile.type, cacheControl: '3600' });
    if (uploadError) throw uploadError;
  }

  const qrTargetUrl = normalizeUrl(settings.qrTargetUrl);
  if (settings.enabled && !qrTargetUrl) throw new Error('启用个人品牌前，请填写二维码目标网址');
  const payload = {
    user_id: userId,
    enabled: settings.enabled,
    brand_name: settings.brandName.trim().slice(0, 48),
    logo_path: logoPath,
    qr_target_url: qrTargetUrl,
    position: POSITIONS.has(settings.position) ? settings.position : DEFAULT_USER_BRAND_SETTINGS.position,
    qr_scale: clamp(settings.qrScale, 0.5, 2.5, 1),
    logo_scale: clamp(settings.logoScale, 0.5, 2.5, 1),
    opacity: clamp(settings.opacity, 0.35, 1, 0.8),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('user_brand_settings')
    .upsert(payload, { onConflict: 'user_id' })
    .select('enabled,brand_name,logo_path,qr_target_url,position,qr_scale,logo_scale,opacity')
    .single();
  if (error) throw error;
  return normalize(data as UserBrandRow, await createLogoUrl(logoPath));
}
