import { useState, useEffect, useMemo } from 'react';
import { Settings, Users, Image as ImageIcon, ArrowLeft, Save, TrendingUp, CreditCard, Activity, Calendar, Zap } from 'lucide-react';
import { User } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function AdminPanel({ onBack, users }: { onBack: () => void, users: User[] }) {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [stats, setStats] = useState({ users: 0, generated: 0 });

  useEffect(() => {
    setApiKey(localStorage.getItem('admin_openai_key') || '');
    setBaseUrl(localStorage.getItem('admin_openai_base_url') || 'https://api.chatanywhere.tech/v1');
    setStats({
      users: users.length,
      generated: users.reduce((acc, u) => acc + (u.generatedCount || 0), 0)
    });
  }, [users]);

  const handleSave = () => {
    localStorage.setItem('admin_openai_key', apiKey.trim());
    localStorage.setItem('admin_openai_base_url', baseUrl.trim());
    alert('Admin settings saved successfully!');
  };

  // Operational Intelligence Calculations
  const operationalIntel = useMemo(() => {
    const totalCredits = users.reduce((acc, u) => acc + (u.credits || 0), 0);
    const vipCount = users.filter(u => u.level === 'vip').length;
    const freeCount = users.length - vipCount;
    
    // Group users by join date (last 7 days)
    const now = Date.now();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = users.filter(u => {
        if (!u.createdAt) return false;
        const joinDate = new Date(u.createdAt);
        return joinDate.toDateString() === date.toDateString();
      }).length;
      return { name: dateStr, users: count };
    });

    const levelData = [
      { name: 'VIP', value: vipCount, color: '#6366f1' },
      { name: 'Free', value: freeCount, color: '#94a3b8' }
    ];

    return {
      totalCredits,
      vipCount,
      freeCount,
      last7Days,
      levelData
    };
  }, [users]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300 bg-stone-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
            <ArrowLeft className="w-6 h-6 text-stone-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Operational Intelligence</h1>
            <p className="text-sm text-stone-500">Real-time metrics and system configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-stone-200 shadow-sm">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">System Live</span>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-sm text-stone-500 font-medium">Total Users</div>
            <div className="text-3xl font-bold text-stone-900">{stats.users}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ImageIcon className="w-6 h-6" />
            </div>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-sm text-stone-500 font-medium">Postcards Generated</div>
            <div className="text-3xl font-bold text-stone-900">{stats.generated}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <TrendingUp className="w-4 h-4 text-stone-300" />
          </div>
          <div>
            <div className="text-sm text-stone-500 font-medium">Circulating Credits</div>
            <div className="text-3xl font-bold text-stone-900">{operationalIntel.totalCredits}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
              {((operationalIntel.vipCount / (stats.users || 1)) * 100).toFixed(1)}% Conv.
            </span>
          </div>
          <div>
            <div className="text-sm text-stone-500 font-medium">VIP Members</div>
            <div className="text-3xl font-bold text-stone-900">{operationalIntel.vipCount}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-stone-400" />
              <h2 className="text-lg font-bold text-stone-900">User Growth (Last 7 Days)</h2>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationalIntel.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="users" radius={[6, 6, 0, 0]}>
                  {operationalIntel.last7Days.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#0f172a' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-bold text-stone-900 mb-8">User Distribution</h2>
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={operationalIntel.levelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {operationalIntel.levelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-2xl font-bold text-stone-900">{stats.users}</div>
              <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Total</div>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {operationalIntel.levelData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-stone-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-stone-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-900">User Directory</h2>
          </div>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{users.length} Registered</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-stone-400 uppercase tracking-widest bg-stone-50/50">
                <th className="px-6 py-4 font-bold">Identity</th>
                <th className="px-6 py-4 font-bold">Contact</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Generated</th>
                <th className="px-6 py-4 font-bold">Balance</th>
                <th className="px-6 py-4 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">No users found in the system.</td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <tr key={idx} className="text-sm hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600 font-bold">
                          {u.nickname?.[0] || u.email?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{u.nickname || 'Anonymous'}</div>
                          <div className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">ID: {idx + 1000}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-stone-600 font-medium">{u.email || u.phoneNumber}</span>
                        {u.email && u.phoneNumber && <span className="text-[10px] text-stone-400">{u.phoneNumber}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.level === 'vip' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                        'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        {u.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3 h-3 text-stone-400" />
                        <span className="font-bold text-stone-700">{u.generatedCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-stone-700">{u.credits}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-400 font-medium">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Config Section */}
      <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
          <Settings className="w-5 h-5 text-stone-400" />
          <h2 className="text-lg font-bold text-stone-900">System Configuration</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">OpenAI API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full border border-stone-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all bg-stone-50/50"
            />
            <p className="text-[10px] text-stone-400 font-medium italic">Overrides the environment variable if set. Leave blank to use .env key.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">OpenAI Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.chatanywhere.tech/v1"
              className="w-full border border-stone-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-stone-900/5 focus:border-stone-900 transition-all bg-stone-50/50"
            />
            <p className="text-[10px] text-stone-400 font-medium italic">Default is https://api.chatanywhere.tech/v1</p>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-stone-900/10"
          >
            <Save className="w-5 h-5" /> Save System Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
