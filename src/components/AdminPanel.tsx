import { useState, useEffect, useCallback, useMemo } from 'react';
import { logEvent } from '../lib/events';
import { supabase, isSupabaseConnected } from '../lib/supabaseClient';
import { User } from '../App';
import AdminLayout, { type AdminPage } from './admin/AdminLayout';
import AdminDashboard, { type DashboardStats, type TodayStats } from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminCreditsLedger, { type LedgerEntry } from './admin/AdminCreditsLedger';
import AdminPostcards, { type PostcardRow } from './admin/AdminPostcards';
import AdminSettings from './admin/AdminSettings';
import AdminPrompts from './admin/AdminPrompts';
import AdminBrand from './admin/AdminBrand';
import AdminFilters from './admin/AdminFilters';
import AdminPayments from './admin/AdminPayments';
import { updateUserCredits } from '../lib/credits';

const PROFILES_SELECT =
  'id, email, nickname, role, credits, promo_credits, paid_credits, generated_count, created_at, last_active_at, total_paid_credits, signup_source, avatar_url';

export default function AdminPanel({ onBack, users, currentUser }: { onBack: () => void; users: User[]; currentUser?: User }) {
  const [page, setPage] = useState<AdminPage>('dashboard');
  const [supabaseUsers, setSupabaseUsers] = useState<User[]>([]);
  const [creditsLedger, setCreditsLedger] = useState<LedgerEntry[]>([]);
  const [postcardsList, setPostcardsList] = useState<PostcardRow[]>([]);
  const [totalPostcardsCount, setTotalPostcardsCount] = useState(0);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [userDetailLedger, setUserDetailLedger] = useState<LedgerEntry[]>([]);
  const [userDetailPostcards, setUserDetailPostcards] = useState<PostcardRow[]>([]);
  const [chartsReady, setChartsReady] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const useSupabase = isSupabaseConnected && currentUser?.id && (currentUser?.role === 'admin' || currentUser?.role === 'support');
  const isAdmin = currentUser?.role === 'admin';

  const fetchProfiles = useCallback(() => {
    if (!useSupabase) return;
    supabase
      .from('profiles')
      .select(PROFILES_SELECT)
      .order('created_at', { ascending: false })
      .then((res: { data: unknown; error: { message?: string; code?: string } | null }) => {
        const { data, error } = res;
        if (error) {
          console.error('[AdminPanel] fetch profiles:', error);
          return;
        }
        setSupabaseUsers(
          (Array.isArray(data) ? data : []).map((r: {
            id?: string;
            email?: string;
            nickname?: string;
            role?: string;
            credits?: number;
            promo_credits?: number;
            paid_credits?: number;
            generated_count?: number;
            created_at?: string;
            last_active_at?: string;
            total_paid_credits?: number;
            signup_source?: string;
            avatar_url?: string;
          }) => {
            const promo = typeof r.promo_credits === 'number' ? r.promo_credits : (r.credits ?? 0);
            const paid = typeof r.paid_credits === 'number' ? r.paid_credits : 0;
            const totalPaidCredits =
              typeof r.total_paid_credits === 'number' ? r.total_paid_credits : paid;
            const signupSource = r.signup_source || 'email';
            const loginProvider: User['loginProvider'] =
              signupSource === 'google' || signupSource === 'apple'
                ? (signupSource as User['loginProvider'])
                : 'email';

            return {
              isLoggedIn: true as const,
              id: r.id,
              email: r.email,
              nickname: r.nickname,
              role: (['admin', 'user', 'support', 'banned'].includes(r.role || '') ? r.role : 'user') as User['role'],
              // Always derive from split credits to avoid stale legacy `credits` values.
              credits: promo + paid,
              promo_credits: promo,
              paid_credits: paid,
              generatedCount: r.generated_count ?? 0,
              createdAt: r.created_at ? new Date(r.created_at).getTime() : undefined,
              lastActiveAt: r.last_active_at ? new Date(r.last_active_at).getTime() : undefined,
              totalPaidCredits,
              signupSource,
              loginProvider,
              avatar: r.avatar_url || undefined,
              level: 'free' as const,
              addresses: [] as const,
            };
          })
        );
      });
  }, [useSupabase]);

  const fetchCreditsLedger = useCallback(() => {
    if (!useSupabase) return;
    setLedgerLoading(true);
    supabase
      .from('credits_ledger')
      .select('id, user_id, credit_type, source, amount, created_at, type, balance_after, reference_id, notes, operator')
      .order('created_at', { ascending: false })
      .limit(500)
      .then((res: { data: unknown; error: { message?: string; code?: string } | null }) => {
        setLedgerLoading(false);
        const { data, error } = res;
        if (error) {
          if (error.code === 'PGRST205' || (error.message || '').includes('Could not find the table')) {
            setCreditsLedger([]);
            return;
          }
          console.error('[AdminPanel] fetch credits_ledger:', error);
          return;
        }
        setCreditsLedger((data as LedgerEntry[]) || []);
      });
  }, [useSupabase]);

  const fetchPostcards = useCallback(() => {
    if (!useSupabase) return;
    Promise.all([
      supabase
        .from('postcards')
        .select('id, user_id, payload, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('postcards')
        .select('id', { count: 'exact', head: true }),
    ]).then(([listRes, countRes]: [{ data: unknown; error: { message?: string } | null }, { count?: number; error: { message?: string } | null }]) => {
      const { data, error } = listRes;
      if (error) {
        console.error('[AdminPanel] fetch postcards:', error);
        return;
      }
      if (countRes.error) {
        console.error('[AdminPanel] count postcards:', countRes.error);
      }
      setPostcardsList((data as PostcardRow[]) || []);
      setTotalPostcardsCount(typeof countRes.count === 'number' ? countRes.count : 0);
    });
  }, [useSupabase]);

  const fetchTodayStats = useCallback(() => {
    if (!useSupabase) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    Promise.all([
      // 成功生成（按 postcards 记录）
      supabase.from('postcards').select('id').gte('created_at', todayIso),
      // 新用户
      supabase.from('profiles').select('id').gte('created_at', todayIso),
      // 今日积分消耗
      supabase
        .from('credits_ledger')
        .select('credit_type, amount, source, created_at')
        .gte('created_at', todayIso)
        .eq('source', 'postcard'),
      // 生成事件（完成 + 失败），用于耗时和失败次数
      supabase
        .from('events')
        .select('event_type, payload, created_at')
        .gte('created_at', todayIso)
        .in('event_type', ['generation_completed', 'generation_failed']),
    ]).then(
      ([
        postcardsRes,
        profilesRes,
        ledgerRes,
        eventsRes,
      ]: [
        { data: unknown; error?: { message?: string } | null },
        { data: unknown; error?: { message?: string } | null },
        { data: unknown; error?: { message?: string } | null },
        { data: unknown; error?: { message?: string } | null },
      ]) => {
        if (postcardsRes.error) console.error('[AdminPanel] fetchTodayStats postcards:', postcardsRes.error);
        if (profilesRes.error) console.error('[AdminPanel] fetchTodayStats profiles:', profilesRes.error);
        if (ledgerRes.error) console.error('[AdminPanel] fetchTodayStats ledger:', ledgerRes.error);
        if (eventsRes.error) console.error('[AdminPanel] fetchTodayStats events:', eventsRes.error);

        const postcardsToday = Array.isArray(postcardsRes.data) ? postcardsRes.data.length : 0;
        const newUsersToday = Array.isArray(profilesRes.data) ? profilesRes.data.length : 0;

        const ledgerData = ledgerRes.data;
        const ledger = (ledgerData != null && Array.isArray(ledgerData) ? ledgerData : []) as {
          credit_type: string;
          amount: number;
        }[];
        let promoConsumedToday = 0;
        let paidConsumedToday = 0;
        ledger.forEach((r) => {
          if (r.amount < 0) {
            if (r.credit_type === 'promo') promoConsumedToday += Math.abs(r.amount);
            else if (r.credit_type === 'paid') paidConsumedToday += Math.abs(r.amount);
          }
        });

        // 事件统计：失败次数 + 平均耗时
        const events = (eventsRes.data != null && Array.isArray(eventsRes.data)
          ? eventsRes.data
          : []) as { event_type: string; payload: { duration_ms?: number } }[];
        let failedToday = 0;
        let durationSum = 0;
        let durationCount = 0;
        events.forEach((e) => {
          if (e.event_type === 'generation_failed') {
            failedToday += 1;
          } else if (e.event_type === 'generation_completed') {
            const d = e.payload?.duration_ms;
            if (typeof d === 'number' && d > 0) {
              durationSum += d;
              durationCount += 1;
            }
          }
        });
        const avgDurationMs = durationCount > 0 ? durationSum / durationCount : null;
        const totalAttempts = postcardsToday + failedToday;
        const successRate = totalAttempts === 0 ? 1 : postcardsToday / totalAttempts;

        setTodayStats({
          postcardsToday,
          failedToday,
          successRate,
          avgDurationMs,
          newUsersToday,
          promoConsumedToday,
          paidConsumedToday,
        });
      }
    ).catch((e: unknown) => {
      console.error('[AdminPanel] fetchTodayStats failed:', e);
      setTodayStats({
        postcardsToday: 0,
        failedToday: 0,
        successRate: 1,
        avgDurationMs: null,
        newUsersToday: 0,
        promoConsumedToday: 0,
        paidConsumedToday: 0,
      });
    });
  }, [useSupabase]);

  useEffect(() => {
    const t = setTimeout(() => setChartsReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (useSupabase) {
      logEvent('admin_panel_view');
      fetchProfiles();
      fetchCreditsLedger();
      fetchPostcards();
      fetchTodayStats();
    }
  }, [useSupabase, fetchProfiles, fetchCreditsLedger, fetchPostcards, fetchTodayStats]);

  // Keep admin stats fresh even without navigation.
  useEffect(() => {
    if (!useSupabase) return;
    const timer = window.setInterval(() => {
      fetchProfiles();
      fetchCreditsLedger();
      fetchPostcards();
      fetchTodayStats();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [useSupabase, fetchProfiles, fetchCreditsLedger, fetchPostcards, fetchTodayStats]);

  const displayUsers = useSupabase ? supabaseUsers : users;

  const dashboardStats: DashboardStats = useMemo(() => {
    const totalPromo = displayUsers.reduce(
      (acc, u) => acc + (u.promo_credits ?? (typeof u.credits === 'number' ? u.credits : 0)),
      0
    );
    const totalPaid = displayUsers.reduce((acc, u) => acc + (u.paid_credits ?? 0), 0);
    const now = Date.now();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const count = displayUsers.filter(
        (u) => u.createdAt && new Date(u.createdAt).toDateString() === date.toDateString()
      ).length;
      return { name: dateStr, users: count };
    });
    const vipCount = displayUsers.filter((u) => u.level === 'vip').length;
    const generatedTotal = useSupabase
      ? totalPostcardsCount
      : displayUsers.reduce((acc, u) => acc + (u.generatedCount || 0), 0);
    const postcardsPerUser =
      displayUsers.length > 0 ? generatedTotal / displayUsers.length : 0;

    return {
      users: displayUsers.length,
      generated: generatedTotal,
      totalCredits: totalPromo + totalPaid,
      totalPromo,
      totalPaid,
      vipCount,
      postcardsPerUser,
      last7Days,
      levelData: [
        { name: 'VIP', value: vipCount, color: '#6366f1' },
        { name: 'Free', value: displayUsers.length - vipCount, color: '#94a3b8' },
      ],
    };
  }, [displayUsers, useSupabase, totalPostcardsCount]);

  const userMap = useMemo(() => {
    const m: Record<string, { email?: string; nickname?: string }> = {};
    displayUsers.forEach((u) => {
      if (u.id) m[u.id] = { email: u.email, nickname: u.nickname };
    });
    return m;
  }, [displayUsers]);

  const loadUserDetail = useCallback(
    (userId: string) => {
      if (!useSupabase) return;
      supabase
        .from('credits_ledger')
        .select('id, user_id, credit_type, source, amount, created_at, balance_after, reference_id, notes, operator, type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
        .then((res: { data: LedgerEntry[] | null }) => setUserDetailLedger(res.data || []));
      supabase
        .from('postcards')
        .select('id, user_id, payload, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
        .then((res: { data: PostcardRow[] | null }) => setUserDetailPostcards(res.data || []));
    },
    [useSupabase]
  );

  const handleSaveCredits = useCallback(
    async (u: User, promo: number, paid: number) => {
      if (!u.id || !useSupabase || !isAdmin) return;
      const oldPromo = u.promo_credits ?? (typeof u.credits === 'number' ? u.credits : 0);
      const oldPaid = u.paid_credits ?? 0;
      const deltaPromo = promo - oldPromo;
      const deltaPaid = paid - oldPaid;

      // 通过统一函数做两次调整，分别针对 promo 和 paid，保证都有流水
      if (deltaPromo !== 0) {
        const res = await updateUserCredits(u.id, deltaPromo, 'admin_adjustment', {
          operator: 'admin',
          notes: 'Admin edit promo credits in Users tab',
          bucket: 'promo',
        });
        if (!res.ok) {
          alert('Update promo credits failed: ' + (res.error || 'unknown error'));
          return;
        }
      }

      if (deltaPaid !== 0) {
        const res = await updateUserCredits(u.id, deltaPaid, 'admin_adjustment', {
          operator: 'admin',
          notes: 'Admin edit paid credits in Users tab',
          bucket: 'paid',
        });
        if (!res.ok) {
          alert('Update paid credits failed: ' + (res.error || 'unknown error'));
          return;
        }
      }

      fetchProfiles();
      fetchCreditsLedger();
      fetchTodayStats();
    },
    [useSupabase, isAdmin, fetchProfiles, fetchCreditsLedger, fetchTodayStats]
  );

  const handleBan = useCallback(
    async (u: User) => {
      if (!u.id || !useSupabase || !isAdmin) return;
      if (!confirm(`Ban user ${u.email || u.id}? They will not be able to use the app.`)) return;
      const { error } = await supabase.from('profiles').update({ role: 'banned' }).eq('id', u.id);
      if (error) {
        console.error('[AdminPanel] ban:', error);
        alert('Ban failed: ' + error.message);
        return;
      }
      fetchProfiles();
    },
    [useSupabase, isAdmin, fetchProfiles]
  );

  const handleUnban = useCallback(
    async (u: User) => {
      if (!u.id || !useSupabase || !isAdmin) return;
      if (!confirm(`Unban user ${u.email || u.id}? They will be able to use the app again.`)) return;
      const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', u.id);
      if (error) {
        console.error('[AdminPanel] unban:', error);
        alert('Unban failed: ' + error.message);
        return;
      }
      fetchProfiles();
    },
    [useSupabase, isAdmin, fetchProfiles]
  );

  const handleReset = useCallback(
    async (u: User) => {
      if (!u.id || !useSupabase || !isAdmin) return;
      if (!confirm(`Reset all credits for ${u.email || u.id} to 0?`)) return;
      const total = (u.promo_credits ?? 0) + (u.paid_credits ?? 0);
      if (total !== 0) {
        const res = await updateUserCredits(u.id, -total, 'admin_adjustment', {
          operator: 'admin',
          notes: 'Admin reset all credits to zero',
          bucket: null,
        });
        if (!res.ok) {
          alert('Reset failed: ' + (res.error || 'unknown error'));
          return;
        }
      }
      fetchProfiles();
      fetchCreditsLedger();
      fetchTodayStats();
    },
    [useSupabase, isAdmin, fetchProfiles, fetchCreditsLedger, fetchTodayStats]
  );

  const handleManualCompensate = useCallback(
    async (userId: string, creditType: 'promo' | 'paid', amount: number, notes?: string) => {
      if (!useSupabase || !isAdmin || amount === 0) return;
      const res = await updateUserCredits(userId, amount, 'admin_adjustment', {
        operator: 'admin',
        notes: notes || (amount > 0 ? `Manual add ${creditType}` : 'Manual deduct'),
        bucket: amount > 0 ? creditType : null,
      });
      if (!res.ok) {
        alert('Update failed: ' + (res.error || 'unknown error'));
        return;
      }
      fetchProfiles();
      fetchCreditsLedger();
      fetchTodayStats();
    },
    [useSupabase, isAdmin, fetchProfiles, fetchCreditsLedger, fetchTodayStats]
  );

  return (
    <AdminLayout
      currentPage={page}
      onPageChange={setPage}
      onBack={onBack}
    >
      {!useSupabase && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          当前为本地模式（未连接 Supabase 或管理员账号未完成云端登录），积分流水与统计将不完整。请确认 `VITE_SUPABASE_*` 已配置且当前账号为云端 `admin/support`。
        </div>
      )}
      {page === 'dashboard' && (
        <AdminDashboard stats={dashboardStats} todayStats={todayStats} chartsReady={chartsReady} />
      )}
      {page === 'users' && (
        <AdminUsers
          displayUsers={displayUsers}
          isAdmin={!!isAdmin}
          onSaveCredits={handleSaveCredits}
        onBan={isAdmin ? handleBan : undefined}
        onUnban={isAdmin ? handleUnban : undefined}
          onReset={isAdmin ? handleReset : undefined}
          userLedger={userDetailLedger}
          userPostcards={userDetailPostcards}
          loadUserDetail={loadUserDetail}
        />
      )}
      {page === 'credits' && (
        <AdminCreditsLedger
          entries={creditsLedger}
          userMap={userMap}
          isAdmin={!!isAdmin}
          onManualCompensate={handleManualCompensate}
          loading={ledgerLoading}
        />
      )}
      {page === 'postcards' && <AdminPostcards rows={postcardsList} userMap={userMap} />}
      {page === 'payments' && <AdminPayments />}
      {page === 'prompts' && <AdminPrompts />}
      {page === 'brand' && <AdminBrand />}
      {page === 'filters' && <AdminFilters />}
      {page === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
}
