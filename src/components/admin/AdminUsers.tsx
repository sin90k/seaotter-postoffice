import { useState } from 'react';
import { Users, Gift, Ban, RotateCcw } from 'lucide-react';
import { User } from '../../App';
import { cn } from '../../lib/utils';

type LedgerRow = { id: string; user_id: string; credit_type: string; source: string; amount: number; created_at: string };
type PostcardRow = { id: string; user_id: string; payload: any; created_at: string };

export default function AdminUsers({
  displayUsers,
  isAdmin,
  onSaveCredits,
  onBan,
  onReset,
  userLedger,
  userPostcards,
  loadUserDetail,
}: {
  displayUsers: User[];
  isAdmin: boolean;
  onSaveCredits: (u: User, promo: number, paid: number) => Promise<void>;
  onBan?: (u: User) => Promise<void>;
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
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-stone-400" />
            <h2 className="text-lg font-bold text-stone-900">用户列表</h2>
          </div>
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">共 {displayUsers.length} 个用户</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-stone-400 uppercase tracking-widest bg-stone-50/50">
                <th className="px-4 py-3 font-bold">用户</th>
                <th className="px-4 py-3 font-bold">联系方式</th>
                <th className="px-4 py-3 font-bold">状态</th>
                <th className="px-4 py-3 font-bold">已生成</th>
                <th className="px-4 py-3 font-bold">赠送积分</th>
                <th className="px-4 py-3 font-bold">付费积分</th>
                <th className="px-4 py-3 font-bold">注册时间</th>
                {isAdmin && <th className="px-4 py-3 font-bold">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-stone-400 italic text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                displayUsers.map((u, idx) => (
                  <tr key={u.id || idx} className="text-sm hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 font-bold text-sm">
                          {u.nickname?.[0] || u.email?.[0] || '?'}
                        </div>
                        <div>
                          <button type="button" onClick={() => u.id && openDetail(u.id)} className="font-bold text-stone-900 hover:underline text-left">
                            {u.nickname || 'Anonymous'}
                          </button>
                          <div className="text-[10px] text-stone-400">ID: {u.id?.slice(0, 8) || idx + 1000}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-600 truncate max-w-[140px] block">{u.email || u.phoneNumber || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          u.role === 'banned' ? 'bg-red-50 text-red-600' : u.level === 'vip' ? 'bg-indigo-50 text-indigo-600' : 'bg-stone-100 text-stone-600'
                        )}
                      >
                        {u.role === 'banned' ? '已封禁' : u.level === 'vip' ? 'VIP' : '普通'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-stone-700">{u.generatedCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-amber-600">{u.promo_credits ?? (typeof u.credits === 'number' ? u.credits : 0)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-600">{u.paid_credits ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
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
                              onClick={() => onBan(u)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              封禁
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
                ))
              )}
            </tbody>
          </table>
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-stone-500">Email</div>
                <div className="text-stone-900">{detailUser.email || '-'}</div>
                <div className="text-stone-500">Joined</div>
                <div className="text-stone-900">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString() : 'N/A'}</div>
                <div className="text-stone-500">Generated</div>
                <div className="text-stone-900">{detailUser.generatedCount ?? 0}</div>
                <div className="text-stone-500">Promo / Paid</div>
                <div className="text-stone-900">{detailUser.promo_credits ?? 0} / {detailUser.paid_credits ?? 0}</div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-700 mb-2">Credits Ledger (recent)</h4>
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
                <h4 className="text-sm font-bold text-stone-700 mb-2">Recent postcards</h4>
                <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                  {postcards.length === 0 ? (
                    <li className="text-stone-400">None.</li>
                  ) : (
                    postcards.slice(0, 10).map((r) => (
                      <li key={r.id}>
                        {new Date(r.created_at).toLocaleString()} · {r.payload?.title || '—'}
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
