import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type ShareBrandingRow = {
  id: string;
  branding_enabled: boolean;
  branding_text: string;
  branding_opacity: number;
  branding_size: number;
};

export default function AdminShareSettings() {
  const [row, setRow] = useState<ShareBrandingRow | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('share_branding')
      .select('id,branding_enabled,branding_text,branding_opacity,branding_size')
      .limit(1)
      .maybeSingle();
    if (error) {
      alert(`读取分享品牌配置失败: ${error.message}`);
      setLoading(false);
      return;
    }
    if (data) setRow(data as ShareBrandingRow);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const save = async () => {
    if (!row) return;
    const { error } = await supabase
      .from('share_branding')
      .update({
        branding_enabled: row.branding_enabled,
        branding_text: row.branding_text,
        branding_opacity: Number(row.branding_opacity),
        branding_size: Number(row.branding_size),
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (error) {
      alert(`保存失败: ${error.message}`);
      return;
    }
    alert('分享品牌设置已保存');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Share Settings</h1>
        <button
          onClick={() => load()}
          className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>
      <p className="text-sm text-stone-500">仅对 Front Only 且免费积分生成的分享图生效。</p>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 max-w-xl">
        {!row && <div className="text-sm text-stone-500">暂无配置</div>}
        {row && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.branding_enabled}
                onChange={(e) => setRow({ ...row, branding_enabled: e.target.checked })}
              />
              启用分享图底部 branding
            </label>
            <div className="space-y-1">
              <div className="text-xs text-stone-500 uppercase tracking-wider">Branding Text</div>
              <input
                value={row.branding_text}
                onChange={(e) => setRow({ ...row, branding_text: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-stone-500 uppercase tracking-wider">Opacity (0-1)</div>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={row.branding_opacity}
                  onChange={(e) => setRow({ ...row, branding_opacity: Number(e.target.value || 0) })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-stone-500 uppercase tracking-wider">Size Ratio</div>
                <input
                  type="number"
                  step="0.001"
                  min="0.005"
                  max="0.1"
                  value={row.branding_size}
                  onChange={(e) => setRow({ ...row, branding_size: Number(e.target.value || 0.02) })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800"
            >
              保存
            </button>
          </>
        )}
      </div>
    </div>
  );
}
