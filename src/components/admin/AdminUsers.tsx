import { useMemo, useState } from 'react';
import { Users, Gift, Ban, RotateCcw, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { User } from '../../App';
import { cn } from '../../lib/utils';

type LedgerRow = { id: string; user_id: string; credit_type: string; source: string; amount: number; created_at: string };
type PostcardRow = { id: string; user_id: string; payload: any; created_at: string };

export default function AdminUsers({
  displayUsers,
  isAdmin,
  onSaveCredits,
  onBan,
  onUnban,
  onReset,
  userLedger,
  userPostcards,
  loadUserDetail,
}: {
  displayUsers: User[];
  isAdmin: boolean;
  onSaveCredits: (u: User, promo: number, paid: number) => Promise<void>;
  onBan?: (u: User) => Promise<void>;
  onUnban?: (u: User) => Promise<void>;
  onReset?: (u: User) => Promise<void>;
  userLedger: LedgerRow[];
  userPostcards: PostcardRow[];
  loadUserDetail: (userId: string) => void;
}) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPromo, setEditPromo] = useState(0);
  const [editPaid, setEditPaid] = useState(0);
  const [saving, setSaving] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'vip' | 'free'>('all');
  const [registerFilter, setRegisterFilter] = useState<'all' | 'last7' | 'last30'>('all');
  const [creditsFilter, setCreditsFilter] = useState<'all' | 'with' | 'zero'>('all');
  const [providerFilter, setProviderFilter] = useState<'all' | 'google' | 'apple'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const now = Date.now();

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayUsers.filter((u) => {
      // search
      if (q) {
        const email = u.email?.toLowerCase() || '';
        const name = u.nickname?.toLowerCase() || '';
        const id = u.id || '';
        if (!email.includes(q) && !name.includes(q) && !id.includes(q)) return false;
      }
      // status
      if (statusFilter === 'active' && u.role === 'banned') return false;
      if (statusFilter === 'banned' && u.role !== 'banned') return false;
      // user type
      if (userTypeFilter === 'vip' && u.level !== 'vip') return false;
      if (userTypeFilter === 'free' && u.level !== 'free') return false;
      // register time
      if (registerFilter !== 'all' && u.createdAt) {
        const diff = now - u.createdAt;
        const oneDay = 24 * 60 * 60 * 1000;
        if (registerFilter === 'last7' && diff > 7 * oneDay) return false;
        if (registerFilter === 'last30' && diff > 30 * oneDay) return false;
      }
      // credits
      const credits = typeof u.credits === 'number' ? u.credits : 0;
      if (creditsFilter === 'with' && credits <= 0) return false;
      if (creditsFilter === 'zero' && credits > 0) return false;
      // provider
      const p = u.loginProvider || 'email';
      if (providerFilter !== 'all' && p !== providerFilter) return false;
      return true;
    });
  }, [displayUsers, search, statusFilter, userTypeFilter, registerFilter, creditsFilter, providerFilter, now]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openCreditModal = (u: User) => {
    setEditingUser(u);
    setEditPromo(u.promo_credits ?? (typeof u.credits === 'number' ? u.credits : 0));
    setEditPaid(u.paid_credits ?? 0);
  };

  const handleSaveCredits = async () => {
    if (!editingUser) return;
    setSaving(true);
    await onSaveCredits(editingUser, Math.max(0, Math.floor(editPromo)), Math.max(0, Math.floor(editPaid)));
    setSaving(false);
    setEditingUser(null);
  };

  const openDetail = (userId: string) => {
    setDetailUserId(userId);
    loadUserDetail(userId);
  };

  const detailUser = displayUsers.find((u) => u.id === detailUserId);
  const ledger = userLedger;
  const postcards = userPostcards;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">用户管理</h1>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-400" />
              <h2 className="text-lg font-bold text-stone-900">用户列表</h2>
            </div>
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              共 {filteredUsers.length} 个用户
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索邮箱 / 昵称 / 用户 ID"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Filter className="w-4 h-4" />
              <span>筛选：</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {/* Status */}
              {(['all', 'active', 'banned'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs',
                    statusFilter === v
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200'
                  )}
                >
                  {v === 'all' ? '全部状态' : v === 'active' ? '正常' : '已封禁'}
                </button>
              ))}
              {/* User type */}
              {(['all', 'vip', 'free'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setUserTypeFilter(v);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs',
                    userTypeFilter === v
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-stone-600 border-stone-200'
                  )}
                >
                  {v === 'all' ? '全部类型' : v === 'vip' ? 'VIP' : '免费'}
                </button>
              ))}
              {/* Register time */}
              {(['all', 'last7', 'last30'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setRegisterFilter(v);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs',
                    registerFilter === v
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-stone-600 border-stone-200'
                  )}
                >
                  {v === 'all'
                    ? '全部注册时间'
                    : v === 'last7'
                    ? '近 7 天'
                    : '近 30 天'}
                </button>
              ))}
              {/* Credits */}
              {(['all', 'with', 'zero'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setCreditsFilter(v);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs',
                    creditsFilter === v
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 border-stone-200'
                  )}
                >
                  {v === 'all' ? '全部积分' : v === 'with' ? '有积分' : '无积分'}
                </button>
              ))}
              {/* Provider */}
              {(['all', 'google', 'apple'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setProviderFilter(v);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full border text-xs',
                    providerFilter === v
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-stone-600 border-stone-200'
                  )}
                >
                  {v === 'all'
                    ? '全部渠道'
                    : v === 'google'
                    ? 'Google'
                    : 'Apple'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="text-xs text-stone-400 uppercase tracking-widest bg-stone-50/50 whitespace-nowrap">
                <th className="px-4 py-3 font-bold">用户</th>
                <th className="px-4 py-3 font-bold">邮箱</th>
                <th className="px-4 py-3 font-bold">登录方式</th>
                <th className="px-4 py-3 font-bold">状态</th>
                <th className="px-4 py-3 font-bold">用户类型</th>
                <th className="px-4 py-3 font-bold">已生成</th>
                <th className="px-4 py-3 font-bold">赠送积分</th>
                <th className="px-4 py-3 font-bold">付费积分</th>
                <th className="px-4 py-3 font-bold">总积分</th>
                <th className="px-4 py-3 font-bold">累计付费积分</th>
                <th className="px-4 py-3 font-bold">注册时间</th>
                <th className="px-4 py-3 font-bold">最近活跃</th>
                {isAdmin && <th className="px-4 py-3 font-bold">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 13 : 12} className="px-4 py-12 text-center text-stone-400 italic text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u, idx) => {
                  const promo = u.promo_credits ?? (typeof u.credits === 'number' ? u.credits : 0);
                  const paid = u.paid_credits ?? 0;
                  const total = typeof u.credits === 'number' ? u.credits : promo + paid;
                  const totalPaid = u.totalPaidCredits ?? paid;
                  const lastActive = u.lastActiveAt
                    ? new Date(u.lastActiveAt).toLocaleString()
                    : '—';
                  const providerLabel =
                    u.loginProvider === 'google'
                      ? 'Google'
                      : u.loginProvider === 'apple'
                      ? 'Apple'
                      : '邮箱';
                  return (
                  <tr key={u.id || idx} className="text-sm hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={u.nickname || u.email || 'avatar'}
                            className="w-9 h-9 rounded-xl object-cover border border-stone-200"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 font-bold text-sm">
                            {u.nickname?.[0] || u.email?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <button type="button" onClick={() => u.id && openDetail(u.id)} className="font-bold text-stone-900 hover:underline text-left">
                            {u.nickname || 'Anonymous'}
                          </button>
                          <div className="text-[10px] text-stone-400">ID: {u.id?.slice(0, 8) || idx + 1000}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-600 truncate max-w-[180px] block">{u.email || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold uppercase">
                        {providerLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          u.role === 'banned'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-600'
                        )}
                      >
                        {u.role === 'banned' ? '已封禁' : '正常'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          u.level === 'vip' ? 'bg-indigo-50 text-indigo-600' : 'bg-stone-100 text-stone-600'
                        )}
                      >
                        {u.level === 'vip' ? 'VIP' : '免费'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-stone-700">{u.generatedCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-amber-600">{promo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-600">{paid}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      <span className="font-bold text-stone-800">{total}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      <span className="font-bold text-stone-800">{totalPaid}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {lastActive}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => openCreditModal(u)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            调整积分
                          </button>
                          {onBan && (
                            <button
                              type="button"
                            onClick={() => (u.role === 'banned' ? onUnban && onUnban(u) : onBan && onBan(u))}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border',
                              u.role === 'banned'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            )}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            {u.role === 'banned' ? '解封' : '封禁'}
                            </button>
                          )}
                          {onReset && (
                            <button
                              type="button"
                              onClick={() => onReset(u)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              重置
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div>
            第 <span className="font-semibold text-stone-800">{currentPage}</span> /{' '}
            <span className="font-semibold text-stone-800">{totalPages}</span> 页 · 每页 {pageSize} 人
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-40"
            >
              <ChevronLeft className="w-3 h-3" />
              上一页
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 text-stone-600 disabled:opacity-40"
            >
              下一页
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Credit edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !saving && setEditingUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-stone-900">编辑积分 · {editingUser.nickname || editingUser.email || '用户'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">赠送积分</label>
                <input
                  type="number"
                  min={0}
                  value={editPromo}
                  onChange={(e) => setEditPromo(Number(e.target.value) || 0)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">付费积分</label>
                <input
                  type="number"
                  min={0}
                  value={editPaid}
                  onChange={(e) => setEditPaid(Number(e.target.value) || 0)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs text-stone-500 self-center">快速加赠：</span>
              {[3, 5, 10, 20].map((n) => (
                <button key={n} type="button" onClick={() => setEditPromo((p) => p + n)} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium hover:bg-amber-200">
                  +{n}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleSaveCredits} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
              <button type="button" onClick={() => !saving && setEditingUser(null)} className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User detail drawer */}
      {detailUserId && detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetailUserId(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">{detailUser.nickname || detailUser.email || 'User'}</h3>
              <button type="button" onClick={() => setDetailUserId(null)} className="text-stone-400 hover:text-stone-600">×</button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              {/* User Info */}
              <div>
                <h4 className="text-sm font-bold text-stone-700 mb-2">用户信息</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-stone-500">用户 ID</div>
                  <div className="text-stone-900 break-all">{detailUser.id}</div>
                  <div className="text-stone-500">Email</div>
                  <div className="text-stone-900">{detailUser.email || '-'}</div>
                  <div className="text-stone-500">登录方式</div>
                  <div className="text-stone-900">
                    {detailUser.loginProvider === 'google'
                      ? 'Google'
                      : detailUser.loginProvider === 'apple'
                      ? 'Apple'
                      : '邮箱'}
                  </div>
                  <div className="text-stone-500">注册时间</div>
                  <div className="text-stone-900">
                    {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString() : 'N/A'}
                  </div>
                  <div className="text-stone-500">最近活跃</div>
                  <div className="text-stone-900">
                    {detailUser.lastActiveAt ? new Date(detailUser.lastActiveAt).toLocaleString() : '—'}
                  </div>
                  <div className="text-stone-500">状态</div>
                  <div className="text-stone-900">{detailUser.role === 'banned' ? '已封禁' : '正常'}</div>
                  <div className="text-stone-500">用户类型</div>
                  <div className="text-stone-900">{detailUser.level === 'vip' ? 'VIP' : '免费'}</div>
                </div>
              </div>

              {/* Usage Statistics & Credit Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="text-sm font-bold text-stone-700 mb-2">使用统计</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">累计生成明信片</span>
                      <span className="text-stone-900 font-semibold">{detailUser.generatedCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">累计消耗积分</span>
                      <span className="text-stone-900 font-semibold">
                        {userLedger
                          .filter((r) => r.amount < 0)
                          .reduce((sum, r) => sum + Math.abs(r.amount), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">累计付费积分</span>
                      <span className="text-stone-900 font-semibold">
                        {detailUser.totalPaidCredits ?? detailUser.paid_credits ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-700 mb-2">当前积分余额</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">赠送积分</span>
                      <span className="text-amber-700 font-semibold">
                        {detailUser.promo_credits ?? (typeof detailUser.credits === 'number' ? detailUser.credits : 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">付费积分</span>
                      <span className="text-emerald-700 font-semibold">{detailUser.paid_credits ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">总积分</span>
                      <span className="text-stone-900 font-semibold">
                        {typeof detailUser.credits === 'number'
                          ? detailUser.credits
                          : (detailUser.promo_credits ?? 0) + (detailUser.paid_credits ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-700 mb-2">积分流水（最近）</h4>
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                  {ledger.length === 0 ? (
                    <li className="text-stone-400">No ledger entries.</li>
                  ) : (
                    ledger.slice(0, 20).map((r) => (
                      <li key={r.id} className="flex justify-between">
                        <span className="text-stone-500">{r.source} · {r.credit_type}</span>
                        <span className={r.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>{r.amount >= 0 ? '+' : ''}{r.amount}</span>
                        <span className="text-stone-400">{new Date(r.created_at).toLocaleString()}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-700 mb-2">最近生成记录</h4>
                <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                  {postcards.length === 0 ? (
                    <li className="text-stone-400">None.</li>
                  ) : (
                    postcards.slice(0, 10).map((r) => (
                      <li key={r.id}>
                        {new Date(r.created_at).toLocaleString()} · {r.payload?.title || '—'} · 成功
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
