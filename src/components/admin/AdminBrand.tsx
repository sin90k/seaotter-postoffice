import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

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
  const [watermarkPosition, setWatermarkPosition] = useState('bottom-center');
  const [watermarkOpacity, setWatermarkOpacity] = useState('0.25');
  const [watermarkSize, setWatermarkSize] = useState('0.35');

  useEffect(() => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    setBrandName(ls.getItem('admin_brand_name') || '');
    setBrandNameZh(ls.getItem('admin_brand_name_zh') || '');
    setBrandDomain(ls.getItem('admin_brand_domain') || '');
    setLogoUrl(ls.getItem('admin_brand_logo_url') || '');
    setWatermarkPosition(ls.getItem('admin_watermark_position') || 'bottom-center');
    setWatermarkOpacity(ls.getItem('admin_watermark_opacity') ?? '0.25');
    setWatermarkSize(ls.getItem('admin_watermark_size') ?? '0.35');
  }, []);

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
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    ls.setItem('admin_brand_name', brandName.trim());
    ls.setItem('admin_brand_name_zh', brandNameZh.trim());
    ls.setItem('admin_brand_domain', brandDomain.trim());
    ls.setItem('admin_watermark_position', watermarkPosition);
    ls.setItem('admin_watermark_opacity', String(watermarkOpacity));
    ls.setItem('admin_watermark_size', String(watermarkSize));
    if (logoFile) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(logoFile);
      });
      ls.setItem('admin_brand_logo_data', dataUrl);
      ls.removeItem('admin_brand_logo_url');
    } else if (logoUrl.trim()) {
      ls.setItem('admin_brand_logo_url', logoUrl.trim());
      ls.removeItem('admin_brand_logo_data');
    }
    setLogoFile(null);
    alert('Brand settings saved.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Brand Settings</h1>
      <p className="text-sm text-stone-500">
        Logo (PNG/SVG/WebP), service name, domain. Watermark position, opacity, and size apply to postcard back when using promo credits.
      </p>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Service name (EN)</label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Sea Otter Post Office"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Service name (ZH)</label>
            <input
              type="text"
              value={brandNameZh}
              onChange={(e) => setBrandNameZh(e.target.value)}
              placeholder="海獭邮局"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Website domain</label>
            <input
              type="text"
              value={brandDomain}
              onChange={(e) => setBrandDomain(e.target.value)}
              placeholder="seaotter-postoffice.vercel.app"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => { setLogoUrl(e.target.value); setLogoFile(null); }}
              placeholder="https://..."
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Logo upload (PNG, SVG, WebP)</label>
            <input
              type="file"
              accept=".png,.svg,.webp"
              onChange={handleFileChange}
              className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700"
            />
            {logoFile && <span className="text-xs text-stone-500">{logoFile.name}</span>}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Watermark position</label>
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
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Watermark opacity (0–1)</label>
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
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Watermark size (relative, e.g. 0.35)</label>
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
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  );
}
