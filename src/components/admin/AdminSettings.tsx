import { useState, useEffect } from 'react';
import { Database, RefreshCw, Save } from 'lucide-react';
import { supabase, isSupabaseConnected } from '../../lib/supabaseClient';

export default function AdminSettings() {
  const [creditsDefaultPromo, setCreditsDefaultPromo] = useState('5');
  const [creditsPerPostcard, setCreditsPerPostcard] = useState('1');
  const [freeRetentionDays, setFreeRetentionDays] = useState('7');
  const [vipRetentionDays, setVipRetentionDays] = useState('0'); // 0 = 永久
  const [storageStats, setStorageStats] = useState({
    totalRows: 0,
    storageRows: 0,
    expiringRows: 0,
    cleanupLogs: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const refreshStorageStats = async () => {
    if (!isSupabaseConnected) return;
    setStatsLoading(true);
    const [allRes, storageRes, expRes, logRes] = await Promise.all([
      supabase.from('postcards').select('id', { count: 'exact', head: true }),
      supabase.from('postcards').select('id', { count: 'exact', head: true }).not('front_path', 'is', null),
      supabase.from('postcards').select('id', { count: 'exact', head: true }).not('expires_at', 'is', null).is('deleted_at', null),
      supabase.from('postcard_cleanup_logs').select('id', { count: 'exact', head: true }),
    ]);
    setStorageStats({
      totalRows: allRes.count || 0,
      storageRows: storageRes.count || 0,
      expiringRows: expRes.count || 0,
      cleanupLogs: logRes.count || 0,
    });
    setStatsLoading(false);
  };

  useEffect(() => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (isSupabaseConnected) {
      supabase.from('payment_config').select('signup_bonus_credits, credits_per_postcard, free_retention_days, vip_retention_days').eq('id', 1).single().then((res: { data: unknown; error: { code?: string } | null }) => {
        const { data, error } = res;
        if (!error && data) {
          const d = data as { signup_bonus_credits?: number; credits_per_postcard?: number; free_retention_days?: number; vip_retention_days?: number };
          if (typeof d.signup_bonus_credits === 'number') setCreditsDefaultPromo(String(d.signup_bonus_credits));
          else setCreditsDefaultPromo(ls?.getItem('admin_credits_default_promo') ?? '5');
          if (typeof d.credits_per_postcard === 'number' && d.credits_per_postcard >= 0) setCreditsPerPostcard(String(d.credits_per_postcard));
          else setCreditsPerPostcard(ls?.getItem('admin_credits_per_postcard') ?? '1');
          if (typeof d.free_retention_days === 'number' && d.free_retention_days > 0) setFreeRetentionDays(String(d.free_retention_days));
          else setFreeRetentionDays(ls?.getItem('admin_history_retention_free_days') ?? '7');
          if (typeof d.vip_retention_days === 'number' && d.vip_retention_days >= 0) setVipRetentionDays(String(d.vip_retention_days));
          else setVipRetentionDays(ls?.getItem('admin_history_retention_vip_days') ?? '0');
        } else {
          setCreditsDefaultPromo(ls?.getItem('admin_credits_default_promo') ?? '5');
          setCreditsPerPostcard(ls?.getItem('admin_credits_per_postcard') ?? '1');
          setFreeRetentionDays(ls?.getItem('admin_history_retention_free_days') ?? '7');
          setVipRetentionDays(ls?.getItem('admin_history_retention_vip_days') ?? '0');
        }
      });
      refreshStorageStats().catch(() => {});
    } else {
      setCreditsDefaultPromo(ls?.getItem('admin_credits_default_promo') ?? '5');
      setCreditsPerPostcard(ls?.getItem('admin_credits_per_postcard') ?? '1');
      setFreeRetentionDays(ls?.getItem('admin_history_retention_free_days') ?? '7');
      setVipRetentionDays(ls?.getItem('admin_history_retention_vip_days') ?? '0');
    }
  }, []);

  const handleRunCleanup = async () => {
    if (!isSupabaseConnected) return;
    setCleanupLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setCleanupLoading(false);
      alert('请先使用管理员账号登录后再执行清理。');
      return;
    }
    try {
      const response = await fetch('/api/admin/storage/cleanup-expired', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ limit: 500 }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert('清理执行失败：' + (result.error || response.statusText));
        return;
      }
      await refreshStorageStats();
      alert(`清理完成：${result.pathsDeleted ?? 0} 个存储文件已删除（${result.cleaned ?? 0} 条路径）`);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleRunBackfill = async () => {
    if (!isSupabaseConnected) return;
    setBackfillLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setBackfillLoading(false);
      alert('请先使用管理员账号重新登录。');
      return;
    }
    try {
      const response = await fetch('/api/admin/storage/backfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ limit: 200 }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error || 'backfill failed');
      }
      await refreshStorageStats();
      alert(`回填完成：扫描 ${body.scanned ?? 0}，迁移 ${body.migrated ?? 0}，失败 ${body.failed ?? 0}`);
    } catch (e: any) {
      alert('回填失败：' + (e?.message || 'unknown error'));
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleSave = async () => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    const n = parseInt(creditsDefaultPromo, 10);
    const promoNum = Number.isFinite(n) && n >= 0 ? n : 0;
    const perCard = parseInt(creditsPerPostcard, 10);
    const perPostcardNum = Number.isFinite(perCard) && perCard >= 0 ? perCard : 1;
    const freeDaysRaw = parseInt(freeRetentionDays, 10);
    const freeDays = Number.isFinite(freeDaysRaw) && freeDaysRaw > 0 ? freeDaysRaw : 7;
    const vipDaysRaw = parseInt(vipRetentionDays, 10);
    const vipDays = Number.isFinite(vipDaysRaw) && vipDaysRaw >= 0 ? vipDaysRaw : 0;
    if (ls) {
      ls.setItem('admin_credits_default_promo', String(promoNum));
      ls.setItem('admin_credits_per_postcard', String(perPostcardNum));
      ls.setItem('admin_history_retention_free_days', String(freeDays));
      ls.setItem('admin_history_retention_vip_days', String(vipDays));
    }
    if (isSupabaseConnected) {
      const { error } = await supabase.from('payment_config').update({
        signup_bonus_credits: promoNum,
        credits_per_postcard: perPostcardNum,
        free_retention_days: freeDays,
        vip_retention_days: vipDays,
        updated_at: new Date().toISOString(),
      }).eq('id', 1);
      if (error) {
        alert('保存失败：' + (error.message || '请检查权限。若提示列不存在，请先执行 retention 字段升级 SQL。'));
        return;
      }
    }
    alert(isSupabaseConnected ? '系统配置已保存到 Supabase。' : '系统配置只保存到当前浏览器，因为 Supabase 尚未连接。');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">系统配置</h1>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
        <p className="text-sm text-stone-500">
          <strong>OpenAI</strong>: 主流程、编辑页改写、AI 背面重绘都通过 Supabase Edge Function 调用。请在 Supabase Secrets 配置 OPENAI_API_KEY；OPENAI_BASE_URL 仅在使用代理时需要。
        </p>
        {!isSupabaseConnected && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            当前未连接 Supabase，本页保存只会写入当前浏览器，不会影响线上用户。
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              新用户赠送积分
            </label>
            <input
              type="number"
              min="0"
              max="999"
              value={creditsDefaultPromo}
              onChange={(e) => setCreditsDefaultPromo(e.target.value)}
              placeholder="0"
              className="w-32 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <p className="text-xs text-stone-500">保存到后台配置，新注册用户将按此数量获得赠送积分；设为 0 即不送。邮箱注册由数据库触发器读取本配置。</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              每张明信片消耗积分
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={creditsPerPostcard}
              onChange={(e) => setCreditsPerPostcard(e.target.value)}
              placeholder="1"
              className="w-32 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <p className="text-xs text-stone-500">营销活动时可设为 0 实现免费生成。</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              免费会员历史保存天数
            </label>
            <input
              type="number"
              min="1"
              max="3650"
              value={freeRetentionDays}
              onChange={(e) => setFreeRetentionDays(e.target.value)}
              placeholder="7"
              className="w-32 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">
              VIP历史保存天数（0=永久）
            </label>
            <input
              type="number"
              min="0"
              max="3650"
              value={vipRetentionDays}
              onChange={(e) => setVipRetentionDays(e.target.value)}
              placeholder="0"
              className="w-32 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50/50"
            />
            <p className="text-xs text-stone-500">按你的要求：默认免费 7 天，VIP 设为 0 表示永久保存。</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          <Save className="w-4 h-4" /> 保存系统配置
        </button>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-5 h-5" /> Storage 生命周期状态
          </h2>
          <button
            onClick={() => refreshStorageStats()}
            disabled={statsLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 p-3">
            <div className="text-xs text-stone-500">总明信片记录</div>
            <div className="text-xl font-bold text-stone-900">{storageStats.totalRows}</div>
          </div>
          <div className="rounded-xl border border-stone-200 p-3">
            <div className="text-xs text-stone-500">已迁移到 Storage</div>
            <div className="text-xl font-bold text-emerald-700">{storageStats.storageRows}</div>
            <div className="text-xs text-stone-500 mt-1">
              {storageStats.totalRows > 0 ? `进度 ${(storageStats.storageRows / storageStats.totalRows * 100).toFixed(1)}%` : '进度 0%'}
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 p-3">
            <div className="text-xs text-stone-500">受有效期控制</div>
            <div className="text-xl font-bold text-amber-700">{storageStats.expiringRows}</div>
          </div>
          <div className="rounded-xl border border-stone-200 p-3">
            <div className="text-xs text-stone-500">清理日志条数</div>
            <div className="text-xl font-bold text-stone-900">{storageStats.cleanupLogs}</div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
          <p className="text-sm text-stone-600">将旧 payload(base64) 图片回填到 Storage（推荐先执行 1-3 次）</p>
          <button
            onClick={handleRunBackfill}
            disabled={backfillLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {backfillLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            立即回填
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-stone-200 p-3">
          <p className="text-sm text-stone-600">手动执行一次过期清理（用于测试定时任务前验证）</p>
          <button
            onClick={handleRunCleanup}
            disabled={cleanupLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {cleanupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            立即清理
          </button>
        </div>
      </div>
      <p className="text-sm text-stone-500">
        Logo 与本机水印预览请使用左侧「品牌设置」；分享图底部 branding 使用「分享图设置」，该项保存到 Supabase。
      </p>
    </div>
  );
}
