import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

export type PostcardRow = {
  id: string;
  user_id: string;
  payload: {
    frontUrl?: string;
    backUrl?: string;
    title?: string;
    location?: string;
    timestamp?: number;
    createdAt?: number;
  };
  created_at: string;
  user_email?: string;
};

export default function AdminPostcards({
  rows,
  userMap,
}: {
  rows: PostcardRow[];
  userMap: Record<string, { email?: string; nickname?: string }>;
}) {
  const [detail, setDetail] = useState<PostcardRow | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Postcards</h1>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-stone-400" />
          <h2 className="text-lg font-bold text-stone-900">Records</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-stone-400 uppercase tracking-widest bg-stone-50/50">
                <th className="px-4 py-3 font-bold">Time</th>
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Preview</th>
                <th className="px-4 py-3 font-bold">Title</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-stone-400 italic text-sm">
                    No postcards yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="text-sm hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-stone-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-stone-600 truncate max-w-[140px] block">
                        {userMap[r.user_id]?.email || userMap[r.user_id]?.nickname || r.user_id?.slice(0, 8) || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.payload?.frontUrl ? (
                        <img src={r.payload.frontUrl} alt="" className="w-12 h-12 object-cover rounded-lg border border-stone-200" />
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-700 max-w-[120px] truncate">{r.payload?.title || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">success</span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => setDetail(r)} className="text-stone-600 hover:text-stone-900 text-xs font-medium underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">Postcard detail</h3>
              <button type="button" onClick={() => setDetail(null)} className="text-stone-400 hover:text-stone-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase mb-1">Front</div>
                  {detail.payload?.frontUrl ? (
                    <img src={detail.payload.frontUrl} alt="Front" className="w-full rounded-xl border border-stone-200" />
                  ) : (
                    <div className="w-full aspect-[3/2] rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">No image</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-500 uppercase mb-1">Back</div>
                  {detail.payload?.backUrl ? (
                    <img src={detail.payload.backUrl} alt="Back" className="w-full rounded-xl border border-stone-200" />
                  ) : (
                    <div className="w-full aspect-[3/2] rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">No image</div>
                  )}
                </div>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-stone-500">Title:</span> {detail.payload?.title || '—'}</p>
                <p><span className="text-stone-500">Location:</span> {detail.payload?.location || '—'}</p>
                <p><span className="text-stone-500">Created:</span> {detail.payload?.createdAt || detail.created_at ? new Date((detail.payload?.createdAt as number) || detail.created_at).toLocaleString() : '—'}</p>
                <p><span className="text-stone-500">User:</span> {userMap[detail.user_id]?.email || detail.user_id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
