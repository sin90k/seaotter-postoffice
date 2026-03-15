import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type PricingRow = {
  id: string;
  market_code: string;
  currency: string;
  price_per_postcard: number;
  credits_per_pack: number;
  pack_price: string;
};

export default function AdminPricing() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('id,market_code,currency,price_per_postcard,credits_per_pack,pack_price')
      .order('market_code', { ascending: true });
    if (error) {
      alert(`加载定价失败: ${error.message}`);
      setLoading(false);
      return;
    }
    setRows((data as PricingRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const save = async (r: PricingRow) => {
    const { error } = await supabase
      .from('pricing_plans')
      .update({
        currency: r.currency,
        price_per_postcard: Number(r.price_per_postcard || 0),
        credits_per_pack: Number(r.credits_per_pack || 10),
        pack_price: String(r.pack_price || ''),
      })
      .eq('id', r.id);
    if (error) {
      alert(`保存失败: ${error.message}`);
      return;
    }
    alert(`已保存 ${r.market_code}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Region Pricing</h1>
        <button
          onClick={() => load()}
          className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm"
        >
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>
      <p className="text-sm text-stone-500">按国家市场配置基础单价与套餐价格，前台会自动按市场加载。</p>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-3 py-2 text-left">市场</th>
              <th className="px-3 py-2 text-left">货币</th>
              <th className="px-3 py-2 text-left">单张价格</th>
              <th className="px-3 py-2 text-left">每包积分</th>
              <th className="px-3 py-2 text-left">套餐价格</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="px-3 py-2 font-semibold">{r.market_code}</td>
                <td className="px-3 py-2">
                  <input
                    value={r.currency}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, currency: e.target.value };
                      setRows(next);
                    }}
                    className="w-24 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={r.price_per_postcard}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, price_per_postcard: Number(e.target.value || 0) };
                      setRows(next);
                    }}
                    className="w-28 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={r.credits_per_pack}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, credits_per_pack: Number(e.target.value || 0) };
                      setRows(next);
                    }}
                    className="w-24 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.pack_price}
                    onChange={(e) => {
                      const next = [...rows];
                      next[i] = { ...r, pack_price: e.target.value };
                      setRows(next);
                    }}
                    className="w-24 border border-stone-200 rounded px-2 py-1"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => save(r)}
                    className="px-3 py-1 rounded bg-stone-900 text-white hover:bg-stone-800"
                  >
                    保存
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-stone-500" colSpan={6}>
                  暂无定价数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
