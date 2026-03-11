import { Users, ImageIcon, CreditCard, TrendingUp, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useState, useEffect } from 'react';

export type TodayStats = {
  postcardsToday: number;
  newUsersToday: number;
  promoConsumedToday: number;
  paidConsumedToday: number;
};

export type DashboardStats = {
  users: number;
  generated: number;
  totalCredits: number;
  totalPromo: number;
  totalPaid: number;
  vipCount: number;
  last7Days: { name: string; users: number }[];
  levelData: { name: string; value: number; color: string }[];
};

export default function AdminDashboard({
  stats,
  todayStats,
  chartsReady,
}: {
  stats: DashboardStats;
  todayStats: TodayStats | null;
  chartsReady: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">数据总览</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-stone-200 shadow-sm">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">LIVE</span>
        </div>
      </div>

      {/* Today's metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-stone-500 font-medium mb-1">今日生成明信片</div>
          <div className="text-2xl font-bold text-stone-900">{todayStats?.postcardsToday ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-stone-500 font-medium mb-1">今日新用户</div>
          <div className="text-2xl font-bold text-stone-900">{todayStats?.newUsersToday ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-stone-500 font-medium mb-1">今日赠送积分消耗</div>
          <div className="text-2xl font-bold text-amber-600">{todayStats?.promoConsumedToday ?? '-'}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="text-xs text-stone-500 font-medium mb-1">今日付费积分消耗</div>
          <div className="text-2xl font-bold text-emerald-600">{todayStats?.paidConsumedToday ?? '-'}</div>
        </div>
      </div>

      {/* Total stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-500 font-medium">用户总数</div>
          <div className="text-xl sm:text-3xl font-bold text-stone-900">{stats.users}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-500 font-medium">累计生成明信片</div>
          <div className="text-xl sm:text-3xl font-bold text-stone-900">{stats.generated}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-500 font-medium">当前流通积分</div>
          <div className="text-xl sm:text-3xl font-bold text-stone-900">{stats.totalCredits}</div>
          <div className="text-xs text-stone-400 mt-0.5">Promo {stats.totalPromo} · Paid {stats.totalPaid}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div className="text-xs sm:text-sm text-stone-500 font-medium">VIP 用户数</div>
          <div className="text-xl sm:text-3xl font-bold text-stone-900">{stats.vipCount}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-900">近 7 天新增用户</h2>
          </div>
          <div className="w-full" style={{ height: 280 }}>
            {chartsReady && mounted && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="users" radius={[6, 6, 0, 0]}>
                    {stats.last7Days.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === stats.last7Days.length - 1 ? '#0f172a' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-4">用户分布</h2>
          <div className="w-full relative" style={{ height: 220 }}>
            {chartsReady && mounted && (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.levelData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                    {stats.levelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-stone-900">{stats.users}</div>
              <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">TOTAL</div>
            </div>
          </div>
          <div className="space-y-2 mt-3">
            {stats.levelData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-stone-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-stone-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
