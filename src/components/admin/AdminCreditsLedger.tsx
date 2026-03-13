import { useMemo, useState } from 'react';
import { CreditCard, Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export type LedgerEntry = {
  id: string;
  user_id: string;
  credit_type: string;
  source: string;
  amount: number;
  created_at: string;
  balance_after?: number | null;
  reference_id?: string | null;
  notes?: string | null;
  operator?: string | null;
  type?: string | null;
  user_email?: string;
};

const PAGE_SIZE = 20;
const SOURCE_OPTIONS = [
  'generation_cost',
  'purchase',
  'signup_bonus',
  'promo_reward',
  'admin_adjustment',
  'refund',
  'registration',
  'postcard',
  'admin_adjust',
  'event',
] as const;

export default function AdminCreditsLedger({
  entries,
  userMap,
  isAdmin,
  onManualCompensate,
  loading,
}: {
  entries: LedgerEntry[];
  userMap: Record<string, { email?: string; nickname?: string }>;
  isAdmin: boolean;
  onManualCompensate: (userId: string, creditType: 'promo' | 'paid', amount: number, notes?: string) => Promise<void>;
  loading?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [compUserId, setCompUserId] = useState('');
  const [compType, setCompType] = useState<'promo' | 'paid'>('promo');
  const [compAmount, setCompAmount] = useState(0);
  const [compNotes, setCompNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit_add' | 'credit_deduct'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'last7' | 'last30'>('all');
  const [page, setPage] = useState(1);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return entries.filter((r) => {
      if (q) {
        const email = userMap[r.user_id]?.email?.toLowerCase() || '';
        const id = r.user_id?.toLowerCase() || '';
        const ref = (r.reference_id || '').toLowerCase();
        if (!email.includes(q) && !id.includes(q) && !ref.includes(q)) return false;
      }
      if (typeFilter !== 'all') {
        const txType = r.type || (r.amount >= 0 ? 'credit_add' : 'credit_deduct');
        if (txType !== typeFilter) return false;
      }
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (timeFilter !== 'all') {
        const t = new Date(r.created_at).getTime();
        const day = 24 * 60 * 60 * 1000;
        if (timeFilter === 'today' && now - t > day) return false;
        if (timeFilter === 'last7' && now - t > 7 * day) return false;
        if (timeFilter === 'last30' && now - t > 30 * day) return false;
      }
      return true;
    });
  }, [entries, userMap, search, typeFilter, sourceFilter, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleEntries = filteredEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async () => {
    if (!compUserId || compAmount === 0) return;
    setSaving(true);
    await onManualCompensate(compUserId, compType, compAmount, compNotes.trim() || undefined);
    setSaving(false);
    setShowModal(false);
    setCompUserId('');
    setCompAmount(0);
    setCompNotes('');
  };

  const sourceLabel: Record<string, string> = {
    generation_cost: '生成消耗',
    purchase: '购买',
    signup_bonus: '注册赠送',
    promo_reward: '活动奖励',
    admin_adjustment: '管理员调整',
    refund: '退款',
    registration: '注册赠送',
    postcard: '明信片消耗',
    admin_adjust: '管理员调整',
    event: '活动',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">积分流水</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            <Plus className="w-4 h-4" />
            手动补偿
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CreditCard className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-900">全部流水</h2>
            <span className="text-xs text-stone-400">共 {filteredEntries.length} 条</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索邮箱 / 用户 ID / 引用 ID"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-200 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-stone-500">
              <Filter className="w-4 h-4" />
              <span>类型</span>
            </div>
            {(['all', 'credit_add', 'credit_deduct'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setTypeFilter(v); setPage(1); }}
                className={cn('px-2.5 py-1 rounded-full border text-xs', typeFilter === v ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600')}
              >
                {v === 'all' ? '全部' : v === 'credit_add' ? '增加' : '扣减'}
              </button>
            ))}
            <span className="text-xs text-stone-500 ml-1">来源</span>
            <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className="rounded-lg border border-stone-200 text-xs px-2 py-1.5">
              <option value="all">全部</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>{sourceLabel[s] || s}</option>
              ))}
            </select>
            <span className="text-xs text-stone-500 ml-1">时间</span>
            {(['all', 'today', 'last7', 'last30'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setTimeFilter(v); setPage(1); }}
                className={cn('px-2.5 py-1 rounded-full border text-xs', timeFilter === v ? 'bg-emerald-600 text-white border-emerald-600' : 'border-stone-200 text-stone-600')}
              >
                {v === 'all' ? '全部' : v === 'today' ? '今日' : v === 'last7' ? '近7天' : '近30天'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center text-stone-500">Loading…</div>
          ) : (
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="text-xs text-stone-400 uppercase tracking-widest bg-stone-50/50 whitespace-nowrap">
                  <th className="px-4 py-3 font-bold">时间</th>
                  <th className="px-4 py-3 font-bold">用户</th>
                  <th className="px-4 py-3 font-bold">类型</th>
                  <th className="px-4 py-3 font-bold">来源</th>
                  <th className="px-4 py-3 font-bold">数量</th>
                  <th className="px-4 py-3 font-bold">变更后余额</th>
                  <th className="px-4 py-3 font-bold">引用</th>
                  <th className="px-4 py-3 font-bold">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-stone-400 italic text-sm">
                      暂无积分流水。请确认已执行 Supabase 中的 credits_ledger 建表脚本。
                    </td>
                  </tr>
                ) : (
                  visibleEntries.map((r) => (
                    <tr key={r.id} className="text-sm hover:bg-stone-50/50">
                      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-stone-600 truncate max-w-[160px] block">
                          {userMap[r.user_id]?.email || userMap[r.user_id]?.nickname || r.user_id?.slice(0, 8) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', (r.type || (r.amount >= 0 ? 'credit_add' : 'credit_deduct')) === 'credit_add' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                          {r.type === 'credit_add' ? '增加' : r.type === 'credit_deduct' ? '扣减' : r.amount >= 0 ? '增加' : '扣减'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{sourceLabel[r.source] || r.source}</td>
                      <td className="px-4 py-3">
                        <span className={r.amount >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                          {r.amount >= 0 ? '+' : ''}{r.amount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {typeof r.balance_after === 'number' ? r.balance_after : '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {r.reference_id || '—'}
                      </td>
                      <td className="px-4 py-3 text-stone-600 max-w-[220px] truncate" title={r.notes || undefined}>
                        {r.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filteredEntries.length > 0 && (
          <div className="px-4 py-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>第 {currentPage} / {totalPages} 页 · 每页 {PAGE_SIZE} 条</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 disabled:opacity-40"> <ChevronLeft className="w-3 h-3" /> 上一页 </button>
              <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 disabled:opacity-40"> 下一页 <ChevronRight className="w-3 h-3" /> </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-stone-900">手动补偿积分</h3>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">用户 ID（auth.users）</label>
              <input
                type="text"
                value={compUserId}
                onChange={(e) => setCompUserId(e.target.value)}
                placeholder="uuid"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">积分类型</label>
              <select value={compType} onChange={(e) => setCompType(e.target.value as 'promo' | 'paid')} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900">
                <option value="promo">赠送 (promo)</option>
                <option value="paid">付费 (paid)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">数量（正数加积分，负数扣积分）</label>
              <input
                type="number"
                value={compAmount || ''}
                onChange={(e) => setCompAmount(Number(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">备注（可选）</label>
              <input
                type="text"
                value={compNotes}
                onChange={(e) => setCompNotes(e.target.value)}
                placeholder="例如：手动补偿活动奖励"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleSubmit} disabled={saving || !compUserId || compAmount === 0} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50">
                {saving ? '保存中…' : '提交'}
              </button>
              <button type="button" onClick={() => !saving && setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
