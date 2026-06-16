import { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Save } from 'lucide-react';
import { SeaOtterLogo } from '../SeaOtterLogo';
import { isSupabaseConnected } from '../../lib/supabaseClient';
import {
  DEFAULT_BRAND_SETTINGS,
  applyBrandSettingsToLocalCache,
  loadBrandSettings,
  readLocalBrandSettings,
  saveBrandSettings,
  type BrandSettings,
} from '../../lib/brandSettings';

const DEFAULT_LOGO_URL = '/seaotter-logo.svg';

const POSITIONS = [
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
];

export default function AdminBrand() {
  const [brandName, setBrandName] = useState('');
  const [brandNameZh, setBrandNameZh] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-center');
  const [watermarkOpacity, setWatermarkOpacity] = useState('0.62');
  const [watermarkSize, setWatermarkSize] = useState('1');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyToForm = (settings: BrandSettings) => {
    setBrandName(settings.brandName);
    setBrandNameZh(settings.brandNameZh);
    setBrandDomain(settings.brandDomain);
    setLogoUrl(settings.logoUrl);
    setLogoPreview(settings.logoUrl);
    setWatermarkPosition(settings.watermarkPosition);
    setWatermarkOpacity(String(settings.watermarkOpacity));
    setWatermarkSize(String(settings.watermarkSize));
  };

  useEffect(() => {
    applyToForm(readLocalBrandSettings());
    setLoading(true);
    loadBrandSettings()
      .then(applyToForm)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!logoFile) return;
    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/\.(png|svg|webp)$/i.test(f.name)) {
      alert('Supported formats: PNG, SVG, WebP');
      return;
    }
    setLogoFile(f);
    setLogoUrl('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalLogoUrl = logoUrl.trim() || DEFAULT_LOGO_URL;
      if (logoFile) {
        finalLogoUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(logoFile);
        });
      }
      const saved = await saveBrandSettings({
        brandName,
        brandNameZh,
        brandDomain,
        logoUrl: finalLogoUrl,
        watermarkPosition,
        watermarkOpacity: Number(watermarkOpacity),
        watermarkSize: Number(watermarkSize),
      });
      applyToForm(saved);
      setLogoFile(null);
      alert(isSupabaseConnected ? '品牌设置已保存到 Supabase，线上用户会读取这份配置。' : '品牌设置已保存到当前浏览器。连接 Supabase 后可保存到云端。');
    } catch (e: any) {
      alert('品牌设置保存失败：' + (e?.message || '请检查 Supabase 权限或是否已执行 brand_settings 迁移。'));
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaultLogo = () => {
    setLogoFile(null);
    const next = { ...readLocalBrandSettings(), logoUrl: DEFAULT_BRAND_SETTINGS.logoUrl };
    applyBrandSettingsToLocalCache(next);
    applyToForm(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SeaOtterLogo className="h-11 w-11 shrink-0" />
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">品牌设置</h1>
      </div>
      <p className="text-sm text-stone-500">
        配置品牌名称、域名和 Logo（水印）。连接 Supabase 后会保存为线上正式配置；未连接时仅保存到当前浏览器。
      </p>
      <div className={`rounded-xl border px-4 py-3 text-sm ${isSupabaseConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        {isSupabaseConnected
          ? '当前页面保存到 Supabase 的 brand_settings。背面水印会读取这份配置；分享图底部文字仍由「分享图设置」控制。'
          : '当前未连接 Supabase，本页只能保存到当前浏览器，不会影响线上用户。'}
      </div>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">服务名称（英文）</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Sea Otter Post Office"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">服务名称（中文）</label>
            <input
              type="text"
              value={brandNameZh}
              onChange={(e) => setBrandNameZh(e.target.value)}
              placeholder="海獭邮局"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">站点域名</label>
            <input
              type="text"
              value={brandDomain}
              onChange={(e) => setBrandDomain(e.target.value)}
              placeholder="seaotter-postoffice.vercel.app"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Logo 图片 URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => {
                setLogoUrl(e.target.value);
                setLogoFile(null);
                setLogoPreview(e.target.value.trim());
              }}
              placeholder="https://..."
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">上传 Logo（随品牌设置保存）</label>
            <input
              type="file"
              accept=".png,.svg,.webp"
              onChange={handleFileChange}
              className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700"
            />
            {logoFile && <span className="text-xs text-stone-500">{logoFile.name}</span>}
            {!logoFile && logoPreview && (
              <span className="text-xs text-emerald-600">{isSupabaseConnected ? '当前线上 Logo' : '当前浏览器已保存 Logo'}</span>
            )}
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Logo 预览</div>
              <button
                type="button"
                onClick={restoreDefaultLogo}
                className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                恢复默认海獭 Logo
              </button>
            </div>
            <div className="h-20 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Brand logo preview" className="max-h-16 object-contain" />
              ) : (
                <span className="text-xs text-stone-400">未配置 Logo</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">水印位置</label>
            <select
              value={watermarkPosition}
              onChange={(e) => setWatermarkPosition(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
            >
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">水印透明度（0–1）</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">水印尺寸（相对值，例如 1）</label>
            <input
              type="number"
              min="0.1"
              max="2"
              step="0.05"
              value={watermarkSize}
              onChange={(e) => setWatermarkSize(e.target.value)}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-60"
        >
          {saving || loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '保存中...' : isSupabaseConnected ? '保存到 Supabase' : '保存到当前浏览器'}
        </button>
      </div>
    </div>
  );
}
