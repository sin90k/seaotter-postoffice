import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clipboard,
  CreditCard,
  Edit2,
  Gift,
  ImageUp,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Address, User } from '../App';
import { SeaOtterLogo } from './SeaOtterLogo';
import { isSupabaseConnected, supabase } from '../lib/supabaseClient';
import { getCreditsPerPostcard } from '../lib/credits';
import {
  DEFAULT_USER_BRAND_SETTINGS,
  hasUserBrandingEntitlement,
  saveUserBrandSettings,
  type UserBrandSettings,
} from '../lib/userBranding';
import { APP_VERSION } from '../version';

interface Props {
  user: User;
  setUser: (user: User) => void;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onAdminEnter: () => void;
  language: string;
}

type DashboardTab = 'overview' | 'credits' | 'orders' | 'rewards' | 'settings';

type LedgerEntry = {
  id: string;
  credit_type: string | null;
  source: string;
  amount: number;
  type: string | null;
  balance_after: number | null;
  notes: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  amount: number;
  status: string;
  provider: string | null;
  note: string | null;
  created_at: string;
  paid_at: string | null;
};

const sourceLabels: Record<string, { zh: string; en: string }> = {
  generation_cost: { zh: '明信片生成', en: 'Postcard generation' },
  postcard: { zh: '明信片生成', en: 'Postcard generation' },
  purchase: { zh: '充值到账', en: 'Credit purchase' },
  signup_bonus: { zh: '注册赠送', en: 'Signup bonus' },
  promo_reward: { zh: '引流奖励', en: 'Referral reward' },
  admin_adjustment: { zh: '人工调整', en: 'Manual adjustment' },
  refund: { zh: '积分退回', en: 'Credit refund' },
};

const statusLabels: Record<string, { zh: string; en: string }> = {
  pending: { zh: '待确认', en: 'Pending' },
  paid: { zh: '已到账', en: 'Paid' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
  failed: { zh: '失败', en: 'Failed' },
};

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat(locale.startsWith('zh') ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
};

export default function UserProfileModal({
  user,
  setUser,
  onClose,
  onLogout,
  onUpgrade,
  onAdminEnter,
  language,
}: Props) {
  const isZh = language.startsWith('zh');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditsPerCard, setCreditsPerCard] = useState(1);
  const [copied, setCopied] = useState(false);
  const [nickname, setNickname] = useState(user.nickname || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({});
  const [brandSettings, setBrandSettings] = useState<UserBrandSettings>(() => ({
    ...DEFAULT_USER_BRAND_SETTINGS,
    qrTargetUrl: typeof window !== 'undefined' ? window.location.origin : '',
    ...(user.personalBranding || {}),
  }));
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState(user.personalBranding?.logoUrl || '');
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandMessage, setBrandMessage] = useState('');
  const canUsePersonalBrand = hasUserBrandingEntitlement(user);

  const displayName = user.nickname || user.name || user.email?.split('@')[0] || user.phoneNumber || (isZh ? '用户' : 'User');
  const localeKey = isZh ? 'zh' : 'en';
  const inviteUrl = typeof window !== 'undefined' && user.id
    ? `${window.location.origin}/?ref=${user.id.slice(0, 8)}`
    : '';

  const rewardEntries = useMemo(() => ledger.filter(item => item.source === 'promo_reward'), [ledger]);
  const rewardCredits = useMemo(
    () => rewardEntries.reduce((sum, item) => sum + Math.max(0, item.amount), 0),
    [rewardEntries]
  );
  const consumedCredits = useMemo(
    () => ledger.reduce((sum, item) => sum + (item.amount < 0 ? Math.abs(item.amount) : 0), 0),
    [ledger]
  );
  const paidOrders = useMemo(() => payments.filter(item => item.status === 'paid'), [payments]);
  const purchasedCredits = useMemo(
    () => paidOrders.reduce((sum, item) => sum + Math.max(0, item.amount), 0),
    [paidOrders]
  );

  const loadDashboard = useCallback(async () => {
    if (!isSupabaseConnected || !user.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [ledgerResult, paymentResult, cost] = await Promise.all([
      supabase
        .from('credits_ledger')
        .select('id,credit_type,source,amount,type,balance_after,notes,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('payments')
        .select('id,amount,status,provider,note,created_at,paid_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      getCreditsPerPostcard(),
    ]);
    if (!ledgerResult.error) setLedger((ledgerResult.data || []) as LedgerEntry[]);
    else console.error('[UserDashboard] load ledger:', ledgerResult.error);
    if (!paymentResult.error) setPayments((paymentResult.data || []) as PaymentRow[]);
    else console.error('[UserDashboard] load payments:', paymentResult.error);
    setCreditsPerCard(cost);
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSaveProfile = async () => {
    if (!user.id || !nickname.trim()) return;
    setProfileSaving(true);
    setProfileMessage('');
    const nextNickname = nickname.trim().slice(0, 40);
    const { error } = await supabase.from('profiles').update({ nickname: nextNickname }).eq('id', user.id);
    if (error) setProfileMessage(isZh ? `保存失败：${error.message}` : `Save failed: ${error.message}`);
    else {
      setUser({ ...user, nickname: nextNickname });
      setProfileMessage(isZh ? '已保存' : 'Saved');
    }
    setProfileSaving(false);
  };

  const handleSaveBrand = async () => {
    if (!user.id || !canUsePersonalBrand) return;
    setBrandSaving(true);
    setBrandMessage('');
    try {
      const saved = await saveUserBrandSettings(user.id, brandSettings, brandLogoFile);
      setBrandSettings(saved);
      setBrandLogoPreview(saved.logoUrl);
      setBrandLogoFile(null);
      setUser({ ...user, personalBranding: saved });
      setBrandMessage(isZh ? '个人品牌已保存' : 'Personal brand saved');
    } catch (error) {
      setBrandMessage(`${isZh ? '保存失败：' : 'Save failed: '}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBrandSaving(false);
    }
  };

  const handleBrandLogo = (file: File | null) => {
    setBrandLogoFile(file);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBrandLogoPreview(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  const handleSaveAddress = () => {
    if (!addressForm.name?.trim() || !addressForm.phone?.trim() || !addressForm.address?.trim()) return;
    const addresses = [...(user.addresses || [])];
    const entry: Address = {
      id: addressForm.id || crypto.randomUUID(),
      name: addressForm.name.trim(),
      phone: addressForm.phone.trim(),
      address: addressForm.address.trim(),
      isDefault: addresses.length === 0 || addressForm.isDefault === true,
    };
    let next = addressForm.id ? addresses.map(item => item.id === entry.id ? entry : item) : [...addresses, entry];
    if (entry.isDefault) next = next.map(item => ({ ...item, isDefault: item.id === entry.id }));
    setUser({ ...user, addresses: next });
    setAddressForm({});
    setAddressFormOpen(false);
  };

  const navItems: Array<{ id: DashboardTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: isZh ? '概览' : 'Overview', icon: LayoutDashboard },
    { id: 'credits', label: isZh ? '积分与权益' : 'Credits & benefits', icon: WalletCards },
    { id: 'orders', label: isZh ? '充值订单' : 'Orders', icon: ReceiptText },
    { id: 'rewards', label: isZh ? '引流奖励' : 'Rewards', icon: Gift },
    { id: 'settings', label: isZh ? '账户设置' : 'Settings', icon: Settings },
  ];
  const overviewStats: Array<{ label: string; value: number; icon: LucideIcon; color: string }> = [
    { label: isZh ? '可用积分' : 'Available credits', value: user.credits, icon: Zap, color: 'text-amber-600' },
    { label: isZh ? '已生成明信片' : 'Postcards created', value: user.generatedCount ?? 0, icon: Sparkles, color: 'text-indigo-600' },
    { label: isZh ? '累计充值积分' : 'Purchased credits', value: purchasedCredits, icon: CreditCard, color: 'text-emerald-600' },
    { label: isZh ? '累计奖励积分' : 'Reward credits', value: rewardCredits, icon: Gift, color: 'text-rose-600' },
  ];

  const sourceName = (source: string) => sourceLabels[source]?.[localeKey] || source;
  const paymentStatus = (status: string) => statusLabels[status]?.[localeKey] || status;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-stone-50 text-stone-900 overflow-hidden"
    >
      <header className="h-16 bg-white border-b border-stone-200 flex items-center px-4 sm:px-6 gap-4">
        <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-stone-100 flex items-center justify-center" title={isZh ? '返回应用' : 'Back to app'}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <SeaOtterLogo className="w-9 h-9 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold truncate">{isZh ? '用户中心' : 'Account center'}</div>
            <div className="text-[11px] text-stone-400">v{APP_VERSION}</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={loadDashboard} className="w-9 h-9 rounded-lg hover:bg-stone-100 flex items-center justify-center" title={isZh ? '刷新' : 'Refresh'}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onUpgrade} className="h-9 px-3 rounded-lg bg-stone-900 text-white text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {isZh ? '充值' : 'Top up'}
          </button>
        </div>
      </header>

      <div className="h-[calc(100dvh-4rem)] flex">
        <aside className="hidden md:flex w-60 bg-white border-r border-stone-200 p-4 flex-col shrink-0">
          <div className="px-3 py-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-semibold">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{displayName}</div>
                <div className="text-xs text-stone-500 truncate">{user.email || user.phoneNumber}</div>
              </div>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm transition-colors ${activeTab === item.id ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto space-y-1 pt-4 border-t border-stone-100">
            {user.role === 'admin' && (
              <button onClick={onAdminEnter} className="w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm text-emerald-700 hover:bg-emerald-50">
                <ShieldCheck className="w-4 h-4" />
                {isZh ? '管理员后台' : 'Admin panel'}
              </button>
            )}
            <button onClick={onLogout} className="w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm text-stone-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="w-4 h-4" />
              {isZh ? '退出登录' : 'Log out'}
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="md:hidden sticky top-0 z-10 bg-white border-b border-stone-200 overflow-x-auto">
            <div className="flex px-3 min-w-max">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`h-12 px-3 text-sm border-b-2 ${activeTab === item.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-7 sm:py-10">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <p className="text-sm text-stone-500">{isZh ? '账户概览' : 'Account overview'}</p>
                  <h1 className="text-2xl font-semibold mt-1">{isZh ? `你好，${displayName}` : `Hello, ${displayName}`}</h1>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {overviewStats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white border border-stone-200 rounded-lg p-5 min-h-28">
                      <div className="flex items-center justify-between text-sm text-stone-500">
                        <span>{label}</span><Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="text-2xl font-semibold mt-4">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold">{isZh ? '最近积分动态' : 'Recent credit activity'}</h2>
                      <button onClick={() => setActiveTab('credits')} className="text-sm text-stone-500 hover:text-stone-900 flex items-center">{isZh ? '查看全部' : 'View all'}<ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
                      {ledger.slice(0, 5).map(item => (
                        <div key={item.id} className="px-4 py-3 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.amount >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500'}`}>
                            {item.amount >= 0 ? <Plus className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{sourceName(item.source)}</div>
                            <div className="text-xs text-stone-400">{formatDate(item.created_at, language)}</div>
                          </div>
                          <div className={`font-semibold ${item.amount >= 0 ? 'text-emerald-600' : 'text-stone-700'}`}>{item.amount > 0 ? '+' : ''}{item.amount}</div>
                        </div>
                      ))}
                      {!loading && ledger.length === 0 && <div className="p-8 text-center text-sm text-stone-400">{isZh ? '暂无积分记录' : 'No activity yet'}</div>}
                    </div>
                  </section>
                  <section>
                    <h2 className="font-semibold mb-4">{isZh ? '当前权益' : 'Current benefits'}</h2>
                    <div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">
                      <div className="p-4 flex gap-3"><CircleDollarSign className="w-5 h-5 text-stone-500" /><div><div className="text-sm font-medium">{isZh ? `每张消耗 ${creditsPerCard} 积分` : `${creditsPerCard} credit per postcard`}</div><div className="text-xs text-stone-400 mt-1">{isZh ? `已累计使用 ${consumedCredits} 积分` : `${consumedCredits} credits used`}</div></div></div>
                      <div className="p-4 flex gap-3"><BadgeCheck className="w-5 h-5 text-stone-500" /><div><div className="text-sm font-medium">{canUsePersonalBrand ? (isZh ? '个人品牌已解锁' : 'Personal branding unlocked') : (isZh ? '购买积分解锁个人品牌' : 'Purchase credits to unlock branding')}</div><div className="text-xs text-stone-400 mt-1">{isZh ? `赠送积分 ${user.promo_credits} · 付费积分 ${user.paid_credits}` : `Promo ${user.promo_credits} · Paid ${user.paid_credits}`}</div></div></div>
                      <button onClick={onUpgrade} className="w-full p-4 flex items-center justify-between text-sm font-medium hover:bg-stone-50"><span>{isZh ? '购买更多积分' : 'Buy more credits'}</span><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'credits' && (
              <div className="space-y-7">
                <div className="flex items-end justify-between gap-4"><div><p className="text-sm text-stone-500">{isZh ? '费用与权益' : 'Costs and benefits'}</p><h1 className="text-2xl font-semibold mt-1">{isZh ? '积分管理' : 'Credit management'}</h1></div><button onClick={onUpgrade} className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium">{isZh ? '立即充值' : 'Top up'}</button></div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-stone-200 rounded-lg p-5"><div className="text-sm text-stone-500">{isZh ? '总余额' : 'Total balance'}</div><div className="text-3xl font-semibold mt-3">{user.credits}</div></div>
                  <div className="bg-white border border-stone-200 rounded-lg p-5"><div className="text-sm text-stone-500">{isZh ? '付费积分' : 'Paid credits'}</div><div className="text-3xl font-semibold mt-3">{user.paid_credits}</div></div>
                  <div className="bg-white border border-stone-200 rounded-lg p-5"><div className="text-sm text-stone-500">{isZh ? '赠送积分' : 'Promo credits'}</div><div className="text-3xl font-semibold mt-3">{user.promo_credits}</div></div>
                </div>
                <section>
                  <h2 className="font-semibold mb-4">{isZh ? '积分流水' : 'Credit history'}</h2>
                  <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm min-w-[680px]"><thead className="bg-stone-50 text-stone-500"><tr><th className="text-left font-medium px-4 py-3">{isZh ? '类型' : 'Type'}</th><th className="text-left font-medium px-4 py-3">{isZh ? '时间' : 'Time'}</th><th className="text-left font-medium px-4 py-3">{isZh ? '积分账户' : 'Bucket'}</th><th className="text-right font-medium px-4 py-3">{isZh ? '变动' : 'Change'}</th><th className="text-right font-medium px-4 py-3">{isZh ? '余额' : 'Balance'}</th></tr></thead><tbody className="divide-y divide-stone-100">{ledger.map(item => <tr key={item.id}><td className="px-4 py-3 font-medium">{sourceName(item.source)}</td><td className="px-4 py-3 text-stone-500">{formatDate(item.created_at, language)}</td><td className="px-4 py-3 text-stone-500">{item.credit_type === 'paid' ? (isZh ? '付费' : 'Paid') : (isZh ? '赠送' : 'Promo')}</td><td className={`px-4 py-3 text-right font-semibold ${item.amount >= 0 ? 'text-emerald-600' : ''}`}>{item.amount > 0 ? '+' : ''}{item.amount}</td><td className="px-4 py-3 text-right text-stone-500">{item.balance_after ?? '-'}</td></tr>)}</tbody></table>
                    {!loading && ledger.length === 0 && <div className="p-10 text-center text-sm text-stone-400">{isZh ? '暂无积分流水' : 'No credit history'}</div>}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-7">
                <div className="flex items-end justify-between gap-4"><div><p className="text-sm text-stone-500">{isZh ? '充值与到账' : 'Top-ups and settlement'}</p><h1 className="text-2xl font-semibold mt-1">{isZh ? '充值订单' : 'Orders'}</h1></div><button onClick={onUpgrade} className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium">{isZh ? '新建充值' : 'New top-up'}</button></div>
                <div className="bg-white border border-stone-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]"><thead className="bg-stone-50 text-stone-500"><tr><th className="text-left font-medium px-4 py-3">{isZh ? '订单号' : 'Order'}</th><th className="text-left font-medium px-4 py-3">{isZh ? '创建时间' : 'Created'}</th><th className="text-left font-medium px-4 py-3">{isZh ? '支付方式' : 'Provider'}</th><th className="text-right font-medium px-4 py-3">{isZh ? '积分' : 'Credits'}</th><th className="text-right font-medium px-4 py-3">{isZh ? '状态' : 'Status'}</th></tr></thead><tbody className="divide-y divide-stone-100">{payments.map(item => <tr key={item.id}><td className="px-4 py-3 font-mono text-xs">{item.id.slice(0, 8).toUpperCase()}</td><td className="px-4 py-3 text-stone-500">{formatDate(item.created_at, language)}</td><td className="px-4 py-3 capitalize">{item.provider || '-'}</td><td className="px-4 py-3 text-right font-semibold">{item.amount}</td><td className="px-4 py-3 text-right"><span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${item.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : item.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>{paymentStatus(item.status)}</span></td></tr>)}</tbody></table>
                  {!loading && payments.length === 0 && <div className="p-12 text-center"><ReceiptText className="w-8 h-8 mx-auto text-stone-300 mb-3" /><div className="text-sm text-stone-400">{isZh ? '暂无充值订单' : 'No orders yet'}</div></div>}
                </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-8">
                <div><p className="text-sm text-stone-500">{isZh ? '分享与增长' : 'Sharing and growth'}</p><h1 className="text-2xl font-semibold mt-1">{isZh ? '引流奖励' : 'Referral rewards'}</h1></div>
                <div className="grid sm:grid-cols-2 gap-3 max-w-2xl"><div className="bg-white border border-stone-200 rounded-lg p-5"><div className="text-sm text-stone-500">{isZh ? '累计奖励积分' : 'Reward credits'}</div><div className="text-3xl font-semibold mt-3">{rewardCredits}</div></div><div className="bg-white border border-stone-200 rounded-lg p-5"><div className="text-sm text-stone-500">{isZh ? '奖励记录' : 'Reward records'}</div><div className="text-3xl font-semibold mt-3">{rewardEntries.length}</div></div></div>
                <section className="max-w-3xl border-t border-stone-200 pt-7">
                  <h2 className="font-semibold">{isZh ? '专属邀请链接' : 'Your referral link'}</h2>
                  <div className="mt-4 flex gap-2"><div className="h-11 px-3 bg-white border border-stone-200 rounded-lg flex items-center text-sm text-stone-600 min-w-0 flex-1 truncate">{inviteUrl}</div><button onClick={async () => { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 1600); }} className="w-11 h-11 rounded-lg bg-stone-900 text-white flex items-center justify-center" title={isZh ? '复制链接' : 'Copy link'}>{copied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}</button></div>
                  <div className="mt-6 grid sm:grid-cols-3 gap-5 text-sm"><div><Users className="w-5 h-5 mb-2 text-stone-500" /><div className="font-medium">{isZh ? '分享链接' : 'Share'}</div></div><div><CreditCard className="w-5 h-5 mb-2 text-stone-500" /><div className="font-medium">{isZh ? '好友完成有效充值' : 'Friend tops up'}</div></div><div><Gift className="w-5 h-5 mb-2 text-stone-500" /><div className="font-medium">{isZh ? '奖励进入赠送积分' : 'Receive promo credits'}</div></div></div>
                </section>
                <section className="max-w-3xl"><h2 className="font-semibold mb-4">{isZh ? '奖励明细' : 'Reward history'}</h2><div className="bg-white border border-stone-200 rounded-lg divide-y divide-stone-100">{rewardEntries.map(item => <div key={item.id} className="p-4 flex justify-between gap-4"><div><div className="text-sm font-medium">{sourceName(item.source)}</div><div className="text-xs text-stone-400 mt-1">{formatDate(item.created_at, language)}</div></div><div className="font-semibold text-emerald-600">+{item.amount}</div></div>)}{rewardEntries.length === 0 && <div className="p-10 text-center text-sm text-stone-400">{isZh ? '暂无奖励记录' : 'No rewards yet'}</div>}</div></section>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-10">
                <div><p className="text-sm text-stone-500">{isZh ? '资料与偏好' : 'Profile and preferences'}</p><h1 className="text-2xl font-semibold mt-1">{isZh ? '账户设置' : 'Account settings'}</h1></div>
                <section className="max-w-3xl border-b border-stone-200 pb-8">
                  <div className="flex items-center gap-2 mb-5"><UserRound className="w-5 h-5" /><h2 className="font-semibold">{isZh ? '个人资料' : 'Profile'}</h2></div>
                  <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end"><label><span className="block text-xs font-medium text-stone-500 mb-1.5">{isZh ? '昵称' : 'Nickname'}</span><input value={nickname} maxLength={40} onChange={event => setNickname(event.target.value)} className="w-full h-10 px-3 rounded-lg border border-stone-200 bg-white outline-none focus:border-stone-700" /></label><button onClick={handleSaveProfile} disabled={profileSaving} className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium disabled:opacity-50">{profileSaving ? '...' : (isZh ? '保存资料' : 'Save')}</button></div>
                  <div className="text-xs mt-2 text-stone-500">{profileMessage || user.email || user.phoneNumber}</div>
                </section>

                <section className="max-w-3xl border-b border-stone-200 pb-8">
                  <div className="flex items-start justify-between gap-4 mb-5"><div className="flex gap-2"><QrCode className="w-5 h-5 mt-0.5" /><div><h2 className="font-semibold">{isZh ? '个人品牌' : 'Personal brand'}</h2><p className="text-xs text-stone-500 mt-1">{canUsePersonalBrand ? (isZh ? '用于明信片背面的 Logo 与二维码' : 'Logo and QR code for postcard backs') : (isZh ? '购买过积分后解锁' : 'Unlock after purchasing credits')}</p></div></div>{canUsePersonalBrand && <button role="switch" aria-checked={brandSettings.enabled} onClick={() => setBrandSettings(current => ({ ...current, enabled: !current.enabled }))} className={`relative w-11 h-6 rounded-full shrink-0 ${brandSettings.enabled ? 'bg-stone-900' : 'bg-stone-300'}`}><span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${brandSettings.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} /></button>}</div>
                  {canUsePersonalBrand ? <div className="space-y-4"><div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end"><label><span className="block text-xs font-medium text-stone-500 mb-1.5">{isZh ? '品牌名称' : 'Brand name'}</span><input value={brandSettings.brandName} onChange={event => setBrandSettings(current => ({ ...current, brandName: event.target.value }))} className="w-full h-10 px-3 rounded-lg border border-stone-200 outline-none focus:border-stone-700" /></label><div className="flex items-center gap-2">{brandLogoPreview && <img src={brandLogoPreview} alt="" className="w-10 h-10 object-contain" />}<label className="h-10 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center gap-2 text-sm font-medium cursor-pointer"><ImageUp className="w-4 h-4" />{isZh ? '上传 Logo' : 'Upload logo'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={event => handleBrandLogo(event.target.files?.[0] || null)} /></label></div></div><div className="grid sm:grid-cols-[1fr_160px] gap-3"><label><span className="block text-xs font-medium text-stone-500 mb-1.5">{isZh ? '二维码网址' : 'QR destination'}</span><input value={brandSettings.qrTargetUrl} onChange={event => setBrandSettings(current => ({ ...current, qrTargetUrl: event.target.value }))} className="w-full h-10 px-3 rounded-lg border border-stone-200 outline-none focus:border-stone-700" /></label><label><span className="block text-xs font-medium text-stone-500 mb-1.5">{isZh ? '位置' : 'Position'}</span><select value={brandSettings.position} onChange={event => setBrandSettings(current => ({ ...current, position: event.target.value as UserBrandSettings['position'] }))} className="w-full h-10 px-3 rounded-lg border border-stone-200 bg-white"><option value="bottom-right">{isZh ? '右下' : 'Bottom right'}</option><option value="bottom-center">{isZh ? '底部居中' : 'Bottom center'}</option><option value="bottom-left">{isZh ? '左下' : 'Bottom left'}</option><option value="top-right">{isZh ? '右上' : 'Top right'}</option><option value="top-center">{isZh ? '顶部居中' : 'Top center'}</option><option value="top-left">{isZh ? '左上' : 'Top left'}</option></select></label></div><div className="grid sm:grid-cols-3 gap-4">{([['qrScale', isZh ? '二维码大小' : 'QR size', 0.5, 2.5], ['logoScale', isZh ? 'Logo 大小' : 'Logo size', 0.5, 2.5], ['opacity', isZh ? '透明度' : 'Opacity', 0.35, 1]] as const).map(([key, label, min, max]) => <label key={key}><span className="flex justify-between text-xs text-stone-500 mb-1"><span>{label}</span><span>{Math.round(brandSettings[key] * 100)}%</span></span><input type="range" min={min} max={max} step="0.05" value={brandSettings[key]} onChange={event => setBrandSettings(current => ({ ...current, [key]: Number(event.target.value) }))} className="w-full accent-stone-900" /></label>)}</div><div className="flex justify-between items-center gap-3"><span className="text-xs text-stone-500">{brandMessage}</span><button onClick={handleSaveBrand} disabled={brandSaving} className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4" />{brandSaving ? '...' : (isZh ? '保存个人品牌' : 'Save brand')}</button></div></div> : <button onClick={onUpgrade} className="h-10 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium">{isZh ? '购买积分解锁' : 'Buy credits to unlock'}</button>}
                </section>

                <section className="max-w-3xl pb-8">
                  <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2"><MapPin className="w-5 h-5" /><h2 className="font-semibold">{isZh ? '收货地址' : 'Shipping addresses'}</h2></div><button onClick={() => { setAddressForm({}); setAddressFormOpen(true); }} className="w-9 h-9 rounded-lg hover:bg-stone-100 flex items-center justify-center" title={isZh ? '添加地址' : 'Add address'}><Plus className="w-5 h-5" /></button></div>
                  {addressFormOpen && <div className="grid sm:grid-cols-2 gap-3 mb-5 bg-white border border-stone-200 rounded-lg p-4"><input aria-label={isZh ? '收货人' : 'Name'} placeholder={isZh ? '收货人' : 'Name'} value={addressForm.name || ''} onChange={event => setAddressForm(current => ({ ...current, name: event.target.value }))} className="h-10 px-3 rounded-lg border border-stone-200" /><input aria-label={isZh ? '手机号' : 'Phone'} placeholder={isZh ? '手机号' : 'Phone'} value={addressForm.phone || ''} onChange={event => setAddressForm(current => ({ ...current, phone: event.target.value }))} className="h-10 px-3 rounded-lg border border-stone-200" /><input aria-label={isZh ? '详细地址' : 'Address'} placeholder={isZh ? '详细地址' : 'Address'} value={addressForm.address || ''} onChange={event => setAddressForm(current => ({ ...current, address: event.target.value }))} className="sm:col-span-2 h-10 px-3 rounded-lg border border-stone-200" /><label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" checked={addressForm.isDefault || false} onChange={event => setAddressForm(current => ({ ...current, isDefault: event.target.checked }))} />{isZh ? '设为默认地址' : 'Set as default'}</label><div className="flex justify-end gap-2"><button onClick={() => setAddressFormOpen(false)} className="h-9 px-3 rounded-lg text-sm hover:bg-stone-100">{isZh ? '取消' : 'Cancel'}</button><button onClick={handleSaveAddress} className="h-9 px-3 rounded-lg bg-stone-900 text-white text-sm">{isZh ? '保存地址' : 'Save address'}</button></div></div>}
                  <div className="space-y-2">{(user.addresses || []).map(address => <div key={address.id} className="bg-white border border-stone-200 rounded-lg p-4 flex items-start gap-4"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-medium">{address.name}</span><span className="text-sm text-stone-500">{address.phone}</span>{address.isDefault && <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">{isZh ? '默认' : 'Default'}</span>}</div><div className="text-sm text-stone-500 mt-1">{address.address}</div></div><button onClick={() => { setAddressForm(address); setAddressFormOpen(true); }} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center" title={isZh ? '编辑' : 'Edit'}><Edit2 className="w-4 h-4" /></button><button onClick={() => setUser({ ...user, addresses: (user.addresses || []).filter(item => item.id !== address.id) })} className="w-8 h-8 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 flex items-center justify-center" title={isZh ? '删除' : 'Delete'}><Trash2 className="w-4 h-4" /></button></div>)}{(user.addresses || []).length === 0 && !addressFormOpen && <div className="py-8 text-center text-sm text-stone-400">{isZh ? '暂无收货地址' : 'No addresses saved'}</div>}</div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>
    </motion.div>
  );
}
