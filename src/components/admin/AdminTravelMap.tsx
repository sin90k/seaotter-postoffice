import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Row = {
  user_id: string;
  countries_count: number;
  cities_count: number;
  postcards_count: number;
  updated_at: string;
};

type CountryHot = {
  country: string;
  postcards: number;
  users: number;
};

export default function AdminTravelMap() {
  const [rows, setRows] = useState<Row[]>([]);
  const [countryHot, setCountryHot] = useState<CountryHot[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [statsRes, metaRes] = await Promise.all([
      supabase
        .from('user_travel_stats')
        .select('user_id,countries_count,cities_count,postcards_count,updated_at')
        .order('postcards_count', { ascending: false })
        .limit(200),
      supabase
        .from('postcard_metadata')
        .select('country,user_id')
        .limit(5000),
    ]);
    if (statsRes.error) {
      alert(`读取旅行统计失败: ${statsRes.error.message}`);
      setLoading(false);
      return;
    }
    setRows((statsRes.data as Row[]) || []);
    if (!metaRes.error && Array.isArray(metaRes.data)) {
      const map = new Map<string, { postcards: number; users: Set<string> }>();
      for (const m of metaRes.data as { country?: string | null; user_id?: string }[]) {
        const c = String(m.country || '').trim();
        if (!c) continue;
        const row = map.get(c) || { postcards: 0, users: new Set<string>() };
        row.postcards += 1;
        if (m.user_id) row.users.add(m.user_id);
        map.set(c, row);
      }
      const list: CountryHot[] = Array.from(map.entries())
        .map(([country, v]) => ({ country, postcards: v.postcards, users: v.users.size }))
        .sort((a, b) => b.postcards - a.postcards)
        .slice(0, 20);
      setCountryHot(list);
    } else {
      setCountryHot([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const triggerRefresh = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      alert('请先使用管理员账号登录。');
      return;
    }
    const res = await fetch('/api/admin/travel-stats-refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ limit: 20000 }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(`刷新失败: ${body.error || res.statusText}`);
      return;
    }
    alert(`刷新完成，更新用户数: ${body.refreshedUsers ?? 0}`);
    await load();
  };

  const exportUserStatsCsv = () => {
    const header = ['user_id', 'countries_count', 'cities_count', 'postcards_count', 'updated_at'];
    const lines = [header.join(',')].concat(
      rows.map((r) =>
        [r.user_id, r.countries_count, r.cities_count, r.postcards_count, r.updated_at || '']
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_user_stats_${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const exportCountryHotCsv = () => {
    const header = ['country', 'postcards', 'users'];
    const lines = [header.join(',')].concat(
      countryHot.map((r) =>
        [r.country, r.postcards, r.users].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel_country_hot_${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Travel Map</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerRefresh()}
            className="px-3 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-sm"
          >
            刷新统计
          </button>
          <button
            onClick={() => load()}
            className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm"
          >
            {loading ? '加载中...' : '刷新列表'}
          </button>
          <button
            onClick={exportUserStatsCsv}
            className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm"
          >
            导出用户CSV
          </button>
          <button
            onClick={exportCountryHotCsv}
            className="px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-50 text-sm"
          >
            导出国家CSV
          </button>
        </div>
      </div>
      <p className="text-sm text-stone-500">按用户聚合旅行范围（国家/城市）和明信片数量，来自 `postcard_metadata`。</p>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
        <div className="text-sm font-semibold mb-2">国家热度 Top 20</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {countryHot.map((r) => (
            <div key={r.country} className="rounded-lg border border-stone-200 px-3 py-2 text-sm bg-stone-50">
              <div className="font-semibold">{r.country}</div>
              <div className="text-xs text-stone-500">Postcards: {r.postcards} | Users: {r.users}</div>
            </div>
          ))}
          {countryHot.length === 0 && <div className="text-sm text-stone-500">暂无国家热度数据</div>}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Countries</th>
              <th className="px-3 py-2 text-left">Cities</th>
              <th className="px-3 py-2 text-left">Postcards</th>
              <th className="px-3 py-2 text-left">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id} className="border-t border-stone-100">
                <td className="px-3 py-2 font-mono text-xs">{r.user_id}</td>
                <td className="px-3 py-2">{r.countries_count}</td>
                <td className="px-3 py-2">{r.cities_count}</td>
                <td className="px-3 py-2">{r.postcards_count}</td>
                <td className="px-3 py-2">{r.updated_at ? new Date(r.updated_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-stone-500" colSpan={5}>
                  暂无旅行统计数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
