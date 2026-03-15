import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type MarketRow = {
  id: string;
  country_code: string;
  country_name: string;
  language_code: string;
  currency: string;
  region_tier: 'tier1' | 'tier2' | 'tier3';
  is_active: boolean;
};

export default function AdminMarkets() {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('market_config')
      .select('id,country_code,country_name,language_code,currency,region_tier,is_active')
      .order('country_code', { ascending: true });
    if (error) {
      alert(`加载市场配置失败: ${error.message}`);
      setLoading(false);
      return;
    }
    setRows((data as MarketRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const saveRow = async (row: MarketRow) => {
    const { error } = await supabase
      .from('market_config')
      .update({
        country_name: row.country_name,
        language_code: row.language_code,
        currency: row.currency,
        region_tier: row.region_tier,
        is_active: row.is_active,
      })
      .eq('id', row.id);
    if (error) {
      alert(`保存失败: ${error.message}`);
      return;
    }
    alert(`已保存 ${row.country_code}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Markets</h1>
        <button
          onClick={() => load()}
          className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>
      <p className="text-sm text-stone-500">管理国家、默认语言、货币与市场档位。关闭后该国家将不参与自动识别。</p>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-3 py-2 text-left">国家</th>
              <th className="px-3 py-2 text-left">名称</th>
              <th className="px-3 py-2 text-left">语言</th>
              <th className="px-3 py-2 text-left">货币</th>
              <th className="px-3 py-2 text-left">Tier</th>
              <th className="px-3 py-2 text-left">启用</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-3 py-2 font-semibold">{r.country_code}</td>
                <td className="px-3 py-2">
                  <input
                    value={r.country_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, country_name: e.target.value };
                      setRows(next);
                    }}
                    className="w-44 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.language_code}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, language_code: e.target.value };
                      setRows(next);
                    }}
                    className="w-24 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.currency}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, currency: e.target.value };
                      setRows(next);
                    }}
                    className="w-20 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.region_tier}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, region_tier: e.target.value as MarketRow['region_tier'] };
                      setRows(next);
                    }}
                    className="border border-stone-200 rounded px-2 py-1"
                  >
                    <option value="tier1">tier1</option>
                    <option value="tier2">tier2</option>
                    <option value="tier3">tier3</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={r.is_active}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, is_active: e.target.checked };
                      setRows(next);
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => saveRow(r)}
                    className="px-3 py-1 rounded bg-stone-900 text-white hover:bg-stone-800"
                  >
                    保存
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-stone-500" colSpan={7}>
                  暂无市场数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
