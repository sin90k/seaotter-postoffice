import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProcessedPostcard, User } from '../App';
import { Download, Clock, X, Image as ImageIcon, Trash2, CheckSquare, Square, Edit3, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { supabase, isSupabaseConnected } from '../lib/supabaseClient';


interface Props {
  history: ProcessedPostcard[];
  user: User;
  onClose: () => void;
  onDownload: (frontUrl: string, backUrl: string, title: string) => void;
  onDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onEdit: (id: string) => void;
  language: string;
}

const translations: Record<string, any> = {
  en: {
    title: 'Your Postcards',
    freeDesc: 'Free users: 7 days retention. Upgrade to keep them forever.',
    vipDesc: 'VIP users: Permanent retention.',
    groupBy: 'Group by:',
    date: 'Date',
    location: 'Location',
    theme: 'Style',
    selectAll: 'Select All',
    selected: 'Selected',
    download: 'Download',
    delete: 'Delete',
    noHistory: 'No saved postcards found.',
    permanent: 'Permanent',
    daysLeft: 'days left',
    hoursLeft: 'hours left',
    confirmDelete: 'Are you sure you want to delete {count} postcards?',
    cannotUndo: 'This action cannot be undone.',
    cancelBtn: 'Cancel',
    deleteBtn: 'Delete',
    other: 'Other',
    unknownLocation: 'Unknown Location',
    edit: 'Edit',
  },
  zh: {
    title: '您的明信片',
    freeDesc: '免费用户：7天保存期限。升级以永久保存。',
    vipDesc: 'VIP用户：永久保存。',
    groupBy: '分组方式：',
    date: '日期',
    location: '地点',
    theme: '样式',
    selectAll: '全选',
    selected: '已选择',
    download: '下载',
    delete: '删除',
    noHistory: '未发现已保存的明信片。',
    permanent: '永久',
    daysLeft: '天后过期',
    hoursLeft: '小时后过期',
    confirmDelete: '您确定要删除这 {count} 张明信片吗？',
    cannotUndo: '此操作无法撤销。',
    cancelBtn: '取消',
    deleteBtn: '删除',
    other: '其他',
    unknownLocation: '未知地点',
    edit: '编辑',
    downloadGroup: '下载该组',
  },
  ja: {
    title: 'あなたのポストカード',
    freeDesc: '無料ユーザー：1日間の保存期間。アップグレードで延長可能です。',
    proDesc: 'Proユーザー：3ヶ月の保存期間。',
    supremeDesc: 'Supremeユーザー：永久保存。',
    groupBy: 'グループ化：',
    date: '日付',
    location: '場所',
    theme: 'スタイル',
    selectAll: 'すべて選択',
    selected: '選択済み',
    download: 'ダウンロード',
    delete: '削除',
    noHistory: '保存されたポストカードが見つかりません。',
    permanent: '無期限',
    daysLeft: '日後に期限切れ',
    hoursLeft: '時間後に期限切れ',
    confirmDelete: '{count} 枚のポストカードを削除してもよろしいですか？',
    cannotUndo: 'この操作は元に戻せません。',
    cancelBtn: 'キャンセル',
    deleteBtn: '削除',
    other: 'その他',
    unknownLocation: '不明な場所',
    edit: '編集',
  },
  ko: {
    title: '나의 엽서',
    freeDesc: '무료 사용자: 1일 보관. 더 오래 보관하려면 업그레이드하세요.',
    proDesc: 'Pro 사용자: 3개월 보관.',
    supremeDesc: 'Supreme 사용자: 영구 보관.',
    groupBy: '그룹화 기준:',
    date: '날짜',
    location: '위치',
    theme: '스타일',
    selectAll: '전체 선택',
    selected: '선택됨',
    download: '다운로드',
    delete: '삭제',
    noHistory: '저장된 엽서가 없습니다.',
    permanent: '영구',
    daysLeft: '일 남음',
    hoursLeft: '시간 남음',
    confirmDelete: '{count}개의 엽서를 삭제하시겠습니까?',
    cannotUndo: '이 작업은 실행 취소할 수 없습니다.',
    cancelBtn: '취소',
    deleteBtn: '삭제',
    other: '기타',
    unknownLocation: '알 수 없는 위치',
    edit: '편집',
  }
};

export default function HistoryView({ history, user, onClose, onDownload, onDelete, onBatchDelete, onEdit, language }: Props) {
  const t = { ...translations.en, ...(translations[language] || {}) };
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'date' | 'location' | 'theme'>('date');
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single', id: string } | { type: 'batch' } | null>(null);
  const [freeRetentionDays, setFreeRetentionDays] = useState(7);
  const [vipRetentionDays, setVipRetentionDays] = useState(0); // 0 表示永久

  useEffect(() => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    const free = parseInt(ls?.getItem('admin_history_retention_free_days') || '7', 10);
    const vip = parseInt(ls?.getItem('admin_history_retention_vip_days') || '0', 10);
    if (Number.isFinite(free) && free > 0) setFreeRetentionDays(free);
    if (Number.isFinite(vip) && vip >= 0) setVipRetentionDays(vip);

    if (isSupabaseConnected) {
      supabase
        .from('payment_config')
        .select('*')
        .eq('id', 1)
        .single()
        .then((res: { data: unknown; error: { message?: string } | null }) => {
          if (res.error || !res.data) return;
          const d = res.data as { free_retention_days?: number; vip_retention_days?: number };
          if (typeof d.free_retention_days === 'number' && d.free_retention_days > 0) {
            setFreeRetentionDays(d.free_retention_days);
          }
          if (typeof d.vip_retention_days === 'number' && d.vip_retention_days >= 0) {
            setVipRetentionDays(d.vip_retention_days);
          }
        })
        .catch(() => {});
    }
  }, []);
  
  const getExpirationDate = (createdAt: number | undefined, timestamp: number) => {
    if (user.level === 'vip') {
      if (vipRetentionDays === 0) return null;
      return (createdAt || timestamp) + vipRetentionDays * 24 * 60 * 60 * 1000;
    }
    const days = freeRetentionDays;
    return (createdAt || timestamp) + days * 24 * 60 * 60 * 1000;
  };

  const now = Date.now();
  
  // Filter out expired items
  const validHistory = history.filter(p => {
    const exp = getExpirationDate(p.createdAt, p.timestamp);
    if (exp === null) return true;
    if (isNaN(exp)) return true; // Keep if date is broken
    return exp > now;
  }).sort((a, b) => {
    const timeA = a.createdAt || a.timestamp || 0;
    const timeB = b.createdAt || b.timestamp || 0;
    return timeB - timeA;
  });

  const formatTimeLeft = (exp: number | null) => {
    if (exp === null) return t.permanent;
    const diff = exp - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} ${t.daysLeft}`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} ${t.hoursLeft}`;
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === validHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(validHistory.map(h => h.id)));
    }
  };

  const toggleGroup = (ids: string[]) => {
    const next = new Set(selectedIds);
    const allSelected = ids.every(id => next.has(id));
    
    if (allSelected) {
      ids.forEach(id => next.delete(id));
    } else {
      ids.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleBatchDownload = async (idsToDownload?: string[]) => {
    const targetIds = idsToDownload || Array.from(selectedIds);
    if (targetIds.length === 0) return;
    
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const selected = validHistory.filter(h => targetIds.includes(h.id));
      
      for (let i = 0; i < selected.length; i++) {
        const item = selected[i];
        try {
          const safeTitle = (item.draftTitle || item.title || `postcard_${i+1}`).replace(/[<>:"/\\|?*]/g, '_');
          
          const frontBase64 = (item.frontDataUrl || item.frontUrl).split(',')[1];
          const backBase64 = (item.backDataUrl || item.backUrl).split(',')[1];
          
          zip.file(`${safeTitle}_front.jpg`, frontBase64, { base64: true });
          zip.file(`${safeTitle}_back.jpg`, backBase64, { base64: true });
        } catch (e) {
          console.error("Failed to add to history batch", e);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `postcards_history_${Date.now()}.zip`;
      link.click();
      setSelectedIds(new Set());
    } catch (e) {
      console.error("Batch download failed", e);
      alert("Batch download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({ type: 'batch' });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'batch') {
      onBatchDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } else if (deleteConfirm.type === 'single') {
      onDelete(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const groupedHistory = validHistory.reduce((acc, item) => {
    let key = t.other;
    if (groupBy === 'date') {
      key = new Date(item.createdAt || item.timestamp).toLocaleDateString();
    } else if (groupBy === 'location') {
      const loc = item.draftLocation || item.location;
      if (loc) {
        const parts = loc.split(/[,，]/);
        key = parts[parts.length - 1].trim();
      } else {
        key = t.unknownLocation;
      }
    } else if (groupBy === 'theme') {
      const theme = item.theme || 'standard';
      key = theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ProcessedPostcard[]>);

  const groupKeys = Object.keys(groupedHistory);
  if (groupBy === 'date') {
    groupKeys.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  } else {
    groupKeys.sort();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <div>
            <h2 className="text-[clamp(1.25rem,4vw,1.5rem)] font-bold text-stone-900">{t.title}</h2>
            <p className="text-[clamp(0.75rem,2vw,0.875rem)] text-stone-500 mt-1">
              {user.level === 'free' && (language === 'zh' ? `免费用户：${freeRetentionDays}天保存期限。升级以永久保存。` : `Free users: ${freeRetentionDays} days retention. Upgrade to keep them forever.`)}
              {user.level === 'vip' && (vipRetentionDays === 0
                ? (language === 'zh' ? 'VIP用户：永久保存。' : 'VIP users: Permanent retention.')
                : (language === 'zh' ? `VIP用户：${vipRetentionDays}天保存期限。` : `VIP users: ${vipRetentionDays} days retention.`))}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {validHistory.length > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <span className="text-sm text-stone-500">{t.groupBy}</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="text-sm font-medium text-stone-700 bg-stone-100 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
                >
                  <option value="date">{t.date}</option>
                  <option value="location">{t.location}</option>
                  <option value="theme">{t.theme}</option>
                </select>
              </div>
            )}
            {validHistory.length > 0 && (
              <div className="flex items-center gap-3 mr-4 border-l border-stone-200 pl-4">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  {selectedIds.size === validHistory.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedIds.size > 0 ? `${selectedIds.size} ${t.selected}` : t.selectAll}
                </button>
                
                {selectedIds.size > 0 && (
                  <>
                    <button
                      onClick={() => handleBatchDownload()}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 text-sm font-medium text-white bg-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {t.download}
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="flex items-center gap-1.5 text-sm font-medium text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t.delete}
                    </button>
                  </>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {validHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400">
              <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
              <p>{t.noHistory}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupKeys.map(key => {
                const groupItems = groupedHistory[key];
                const groupIds = groupItems.map(i => i.id);
                const isGroupAllSelected = groupIds.every(id => selectedIds.has(id));
                const isGroupSomeSelected = groupIds.some(id => selectedIds.has(id)) && !isGroupAllSelected;

                return (
                  <div key={key} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleGroup(groupIds)}
                          className="flex items-center gap-2 text-sm font-semibold text-stone-500 uppercase tracking-wider hover:text-stone-900 transition-colors"
                        >
                          {isGroupAllSelected ? (
                            <CheckSquare className="w-4 h-4 text-stone-900" />
                          ) : isGroupSomeSelected ? (
                            <div className="w-4 h-4 border border-stone-400 rounded flex items-center justify-center">
                              <div className="w-2 h-0.5 bg-stone-400"></div>
                            </div>
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                          {key}
                        </button>
                        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                          {groupItems.length}
                        </span>
                      </div>
                      <button
                        onClick={() => handleBatchDownload(groupIds)}
                        className="text-xs font-medium text-stone-400 hover:text-stone-900 flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t.downloadGroup}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {groupedHistory[key].map((item) => {
                      const exp = getExpirationDate(item.createdAt, item.timestamp);
                      const isSelected = selectedIds.has(item.id);
                      return (
                        <div 
                          key={item.id} 
                          className={`bg-white rounded-2xl border ${isSelected ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-200'} overflow-hidden shadow-sm group relative`}
                        >
                          <button
                            onClick={() => toggleSelection(item.id)}
                            className="absolute top-2 left-2 z-10 p-1 bg-white/80 backdrop-blur-sm rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-stone-900" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400" />
                            )}
                          </button>
                          {isSelected && (
                            <div className="absolute top-2 left-2 z-10 p-1 bg-white rounded-md shadow-sm">
                              <CheckSquare className="w-4 h-4 text-stone-900" />
                            </div>
                          )}
                          <div className="aspect-[4/3] relative bg-stone-100 cursor-pointer" onClick={() => toggleSelection(item.id)}>
                            <img src={item.frontDataUrl || item.frontUrl} alt={item.draftTitle || item.title || 'Postcard'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); onEdit(item.id); }}
                                className="p-2 bg-white text-stone-900 rounded-full hover:scale-105 transition-transform"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDownload(item.frontDataUrl || item.frontUrl, item.backDataUrl || item.backUrl, item.draftTitle || item.title || 'postcard'); }}
                                className="p-2 bg-white text-stone-900 rounded-full hover:scale-105 transition-transform"
                                title={t.download}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (isSelected) {
                                    handleBatchDelete();
                                  } else {
                                    setDeleteConfirm({ type: 'single', id: item.id });
                                  }
                                }}
                                className="p-2 bg-red-500 text-white rounded-full hover:scale-105 transition-transform"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-bold text-sm text-stone-900 truncate">{item.draftTitle || item.title || 'Untitled'}</h3>
                            <p className="text-xs text-stone-500 truncate mb-2">{item.draftLocation || item.location || 'Unknown Location'}</p>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 w-fit px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              {formatTimeLeft(exp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                {deleteConfirm.type === 'batch' 
                  ? t.confirmDelete.replace('{count}', selectedIds.size.toString())
                  : t.confirmDelete.replace('{count}', '1')}
              </h3>
              <p className="text-stone-500 text-sm mb-6">
                {t.cannotUndo}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                >
                  {t.deleteBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
