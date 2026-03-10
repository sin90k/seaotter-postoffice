import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [creditsDefaultPromo, setCreditsDefaultPromo] = useState('3');
  const [creditsPerPostcard, setCreditsPerPostcard] = useState('1');

  useEffect(() => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    setApiKey(ls?.getItem('admin_openai_key') || '');
    setBaseUrl(ls?.getItem('admin_openai_base_url') || 'https://api.chatanywhere.tech/v1');
    setGeminiKey(ls?.getItem('admin_gemini_key') || '');
    setCreditsDefaultPromo(ls?.getItem('admin_credits_default_promo') ?? '3');
    setCreditsPerPostcard(ls?.getItem('admin_credits_per_postcard') ?? '1');
  }, []);

  const handleSave = () => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (ls) {
      ls.setItem('admin_openai_key', apiKey.trim());
      ls.setItem('admin_openai_base_url', baseUrl.trim());
      ls.setItem('admin_gemini_key', geminiKey.trim());
      const n = parseInt(creditsDefaultPromo, 10);
      ls.setItem('admin_credits_default_promo', String(Number.isFinite(n) && n >= 0 ? n : 3));
      const perCard = parseInt(creditsPerPostcard, 10);
      ls.setItem('admin_credits_per_postcard', String(Number.isFinite(perCard) && perCard >= 0 ? perCard : 1));
    }
    alert('System configuration saved.');
  };

  const openAiOk = !!apiKey.trim();
  const geminiOk = !!geminiKey.trim();

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">System Configuration</h1>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <p className="text-sm text-stone-500">
          <strong>OpenAI</strong>: 主流程生成（标题、正文、背面图）。<strong>Gemini</strong>: 编辑时「改写」单字段。未填写时使用 .env 中的 VITE_OPENAI_API_KEY / VITE_GEMINI_API_KEY。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              OpenAI API Key {openAiOk ? <span className="text-emerald-600 font-normal">(set)</span> : <span className="text-amber-600 font-normal">(optional, uses .env)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">OpenAI Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.chatanywhere.tech/v1"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              Gemini API Key {geminiOk ? <span className="text-emerald-600 font-normal">(set)</span> : <span className="text-amber-600 font-normal">(optional)</span>}
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full max-w-md border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              新用户赠送积分 (默认)
            </label>
            <input
              type="number"
              min="0"
              max="999"
              value={creditsDefaultPromo}
              onChange={(e) => setCreditsDefaultPromo(e.target.value)}
              placeholder="3"
              className="w-32 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <p className="text-xs text-stone-500">用于手机号登录新用户、以及 profile 无 promo_credits 时的回退。Supabase 邮箱注册由数据库触发器控制。</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              每张明信片消耗积分
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={creditsPerPostcard}
              onChange={(e) => setCreditsPerPostcard(e.target.value)}
              placeholder="1"
              className="w-32 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <p className="text-xs text-stone-500">营销活动时可设为 0 实现免费生成。</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
      <p className="text-sm text-stone-500">Logo and brand: use <strong>Brand Settings</strong> in the sidebar.</p>
    </div>
  );
}
