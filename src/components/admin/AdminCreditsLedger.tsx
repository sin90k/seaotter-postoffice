import { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export type LedgerEntry = {
  id: string;
  user_id: string;
  credit_type: string;
  source: string;
  amount: number;
  created_at: string;
  user_email?: string;
};

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
  onManualCompensate: (userId: string, creditType: 'promo' | 'paid', amount: number) => Promise<void>;
  loading?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [compUserId, setCompUserId] = useState('');
  const [compType, setCompType] = useState<'promo' | 'paid'>('promo');
  const [compAmount, setCompAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!compUserId || compAmount === 0) return;
    setSaving(true);
    await onManualCompensate(compUserId, compType, compAmount);
    setSaving(false);
    setShowModal(false);
    setCompUserId('');
    setCompAmount(0);
  };

  const sourceLabel: Record<string, string> = {
    registration: 'Registration',
    purchase: 'Purchase',
    postcard: 'Postcard',
    admin_adjust: 'Admin',
    event: 'Event',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Credits Ledger</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            <Plus className="w-4 h-4" />
            Manual compensate
          </button>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-stone-400" />
          <h2 className="text-lg font-bold text-stone-900">All entries</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-stone-500">Loading…</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-stone-400 uppercase tracking-widest bg-stone-50/50">
                  <th className="px-4 py-3 font-bold">Time</th>
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Source</th>
                  <th className="px-4 py-3 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-stone-400 italic text-sm">
                      No ledger entries. Run Supabase migration for credits_ledger table.
                    </td>
                  </tr>
                ) : (
                  entries.map((r) => (
                    <tr key={r.id} className="text-sm hover:bg-stone-50/50">
                      <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-stone-600 truncate max-w-[160px] block">
                          {userMap[r.user_id]?.email || userMap[r.user_id]?.nickname || r.user_id?.slice(0, 8) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', r.credit_type === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                          {r.credit_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{sourceLabel[r.source] || r.source}</td>
                      <td className="px-4 py-3">
                        <span className={r.amount >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                          {r.amount >= 0 ? '+' : ''}{r.amount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-stone-900">Manual compensate</h3>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">User ID</label>
              <input
                type="text"
                value={compUserId}
                onChange={(e) => setCompUserId(e.target.value)}
                placeholder="uuid"
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Credit type</label>
              <select value={compType} onChange={(e) => setCompType(e.target.value as 'promo' | 'paid')} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900">
                <option value="promo">Promo</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Amount (+ to grant)</label>
              <input
                type="number"
                value={compAmount || ''}
                onChange={(e) => setCompAmount(Number(e.target.value) || 0)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleSubmit} disabled={saving || !compUserId || compAmount <= 0} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50">
                {saving ? 'Saving…' : 'Submit'}
              </button>
              <button type="button" onClick={() => !saving && setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
