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
  type BrandSignatureLayout,
  type BrandSignatureProfiles,
} from '../../lib/brandSettings';

const DEFAULT_LOGO_URL = '/seaotter-logo.svg';

const POSITIONS = [
  { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-right', label: '右下角' },
  { value: 'top-center', label: '顶部居中' },
  { value: 'top-left', label: '左上角' },
  { value: 'top-right', label: '右上角' },
];

const LAYOUTS: Array<{ value: BrandSignatureLayout; label: string }> = [
  { value: 'landscape', label: '横版' },
  { value: 'portrait', label: '竖版' },
  { value: 'square', label: '方形' },
];

export default function AdminBrand() {
  const [brandName, setBrandName] = useState('');
  const [brandNameZh, setBrandNameZh] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState('0.62');
  const [signatureProfiles, setSignatureProfiles] = useState<BrandSignatureProfiles>(DEFAULT_BRAND_SETTINGS.signatureProfiles);
  const [activeLayout, setActiveLayout] = useState<BrandSignatureLayout>('landscape');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const applyToForm = (settings: BrandSettings) => {
    setBrandName(settings.brandName);
    setBrandNameZh(settings.brandNameZh);
    setBrandDomain(settings.brandDomain);
    setLogoUrl(settings.logoUrl);
    setLogoPreview(settings.logoUrl);
    setWatermarkOpacity(String(settings.watermarkOpacity));
    setSignatureProfiles(settings.signatureProfiles);
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
        watermarkPosition: signatureProfiles.landscape.position,
        watermarkOpacity: Number(watermarkOpacity),
        watermarkSize: signatureProfiles.landscape.qrScale,
        signatureProfiles,
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

  const activeProfile = signatureProfiles[activeLayout];
  const updateActiveProfile = (patch: Partial<typeof activeProfile>) => {
    setSignatureProfiles((current) => ({
      ...current,
      [activeLayout]: { ...current[activeLayout], ...patch },
    }));
  };

  const previewAnchorStyle = () => {
    const style: Record<string, string> = {};
    if (activeProfile.position.includes('top')) style.top = '10px';
    else style.bottom = '10px';
    if (activeProfile.position.includes('left')) style.left = '10px';
    else if (activeProfile.position.includes('right')) style.right = '10px';
    else {
      style.left = '50%';
      style.transform = 'translateX(-50%)';
    }
    return style;
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
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">品牌区域透明度</label>
              <span className="text-sm font-semibold tabular-nums text-stone-700">{Number(watermarkOpacity).toFixed(2)}</span>
            </div>
            <input
              type="range"
              aria-label="品牌区域透明度"
              min="0"
              max="1"
              step="0.05"
              value={watermarkOpacity}
              onChange={(e) => setWatermarkOpacity(e.target.value)}
              className="w-full accent-stone-900"
            />
          </div>

          <div className="md:col-span-2 space-y-4 border-t border-stone-200 pt-6">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Logo 与二维码布局</h2>
              <p className="mt-1 text-sm text-stone-500">系统会根据最终画布自动使用横版、竖版或方形配置。</p>
            </div>

            <div className="inline-flex rounded-lg bg-stone-100 p-1" role="tablist" aria-label="品牌布局版式">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.value}
                  type="button"
                  role="tab"
                  aria-selected={activeLayout === layout.value}
                  onClick={() => setActiveLayout(layout.value)}
                  className={`min-w-20 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeLayout === layout.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  {layout.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">位置</label>
                  <select
                    aria-label={`${LAYOUTS.find((layout) => layout.value === activeLayout)?.label || ''}品牌位置`}
                    value={activeProfile.position}
                    onChange={(e) => updateActiveProfile({ position: e.target.value })}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  >
                    {POSITIONS.map((position) => (
                      <option key={position.value} value={position.value}>{position.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">二维码大小</label>
                    <span className="text-sm font-semibold tabular-nums text-stone-700">{activeProfile.qrScale.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    aria-label={`${LAYOUTS.find((layout) => layout.value === activeLayout)?.label || ''}二维码大小`}
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={activeProfile.qrScale}
                    onChange={(e) => updateActiveProfile({ qrScale: Number(e.target.value) })}
                    className="w-full accent-stone-900"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Logo 大小</label>
                    <span className="text-sm font-semibold tabular-nums text-stone-700">{activeProfile.logoScale.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range"
                    aria-label={`${LAYOUTS.find((layout) => layout.value === activeLayout)?.label || ''}Logo 大小`}
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={activeProfile.logoScale}
                    onChange={(e) => updateActiveProfile({ logoScale: Number(e.target.value) })}
                    className="w-full accent-stone-900"
                  />
                </div>
              </div>

              <div className="flex min-h-64 items-center justify-center rounded-lg border border-stone-200 bg-stone-100 p-4">
                <div
                  className={`relative overflow-hidden border border-stone-300 bg-[#f8f6f1] shadow-sm ${activeLayout === 'landscape' ? 'aspect-[3/2] w-full' : activeLayout === 'portrait' ? 'aspect-[2/3] h-56' : 'aspect-square h-52'}`}
                >
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(135deg, transparent 45%, #cbd5c0 46%, transparent 54%)' }} />
                  <div
                    className="absolute flex items-center gap-2 rounded-md border border-stone-200 bg-white/90 p-2 shadow-sm"
                    style={{ ...previewAnchorStyle(), opacity: Math.max(0.35, Number(watermarkOpacity)) }}
                  >
                    <div
                      className="shrink-0 border-2 border-stone-700 bg-white"
                      style={{ width: `${26 * activeProfile.qrScale}px`, height: `${26 * activeProfile.qrScale}px`, backgroundImage: 'repeating-conic-gradient(#444 0 25%, #fff 0 50%)', backgroundSize: '6px 6px' }}
                    />
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo layout preview"
                        className="shrink-0 object-contain"
                        style={{ width: `${24 * activeProfile.logoScale}px`, height: `${24 * activeProfile.logoScale}px` }}
                      />
                    ) : null}
                    <div className="whitespace-nowrap text-[9px] font-semibold text-stone-700">{brandNameZh || '海獭邮局'}</div>
                  </div>
                </div>
              </div>
            </div>
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
