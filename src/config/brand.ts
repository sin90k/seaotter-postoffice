/**
 * Brand configuration for watermark and display.
 * 优先从管理员后台配置（localStorage）读取，否则使用环境变量。
 */

const env = import.meta.env as Record<string, unknown>;

const getAdmin = (key: string): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;

export const brandConfig = {
  /** Localized brand name by locale (en, zh, ja, ko). */
  brandName: (locale: string): string => {
    const adminZh = getAdmin('admin_brand_name_zh');
    const adminEn = getAdmin('admin_brand_name');
    const map: Record<string, string | undefined> = {
      zh: adminZh ?? (env.VITE_BRAND_NAME_ZH as string | undefined),
      ja: getAdmin('admin_brand_name_ja') ?? (env.VITE_BRAND_NAME_JA as string | undefined),
      ko: getAdmin('admin_brand_name_ko') ?? (env.VITE_BRAND_NAME_KO as string | undefined),
      en: adminEn ?? (env.VITE_BRAND_NAME as string | undefined),
    };
    const val = map[locale] ?? adminEn ?? env.VITE_BRAND_NAME as string | undefined;
    return (typeof val === 'string' && val.trim()) ? val.trim() : 'Sea Otter Post Office';
  },
  /** Canonical domain (e.g. seaotterpostoffice.com). */
  domain: (): string => {
    const d = getAdmin('admin_brand_domain') ?? (env.VITE_BRAND_DOMAIN as string | undefined);
    return (typeof d === 'string' && d.trim()) ? d.trim() : 'seaotter-postoffice.vercel.app';
  },
  /** Logo URL or data URL for watermark (optional). Admin can set URL or upload → data URL. */
  logoUrl: (): string | undefined => {
    const dataUrl = getAdmin('admin_brand_logo_data');
    if (typeof dataUrl === 'string' && dataUrl.trim()) return dataUrl.trim();
    const u = getAdmin('admin_brand_logo_url') ?? (env.VITE_BRAND_LOGO_URL as string | undefined);
    return (typeof u === 'string' && u.trim()) ? u.trim() : undefined;
  },
  /** Watermark position: bottom-left | bottom-right | bottom-center | top-left | top-right | top-center */
  watermarkPosition: (): string => {
    const p = getAdmin('admin_watermark_position');
    return (typeof p === 'string' && p.trim()) ? p.trim() : 'bottom-center';
  },
  /** 0–1 */
  watermarkOpacity: (): number => {
    const v = getAdmin('admin_watermark_opacity');
    if (v == null || v === '') return 0.25;
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.25;
  },
  /** Relative size (e.g. 0.5 = 50% of stamp area). */
  watermarkSize: (): number => {
    const v = getAdmin('admin_watermark_size');
    if (v == null || v === '') return 0.35;
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.max(0.1, Math.min(2, n)) : 0.35;
  },
};
