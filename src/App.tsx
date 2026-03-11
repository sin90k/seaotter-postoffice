import { useState, useEffect, useRef } from 'react';
import { Zap, Crown, History, LogIn, Globe2, ChevronDown } from 'lucide-react';
import { SeaOtterLogo } from './components/SeaOtterLogo';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Step1Upload from './components/Step1Upload';
import Step3Configure from './components/Step3Configure';
import Step5Process from './components/Step5Process';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import PricingModal from './components/PricingModal';
import FeedbackModal from './components/FeedbackModal';
import HistoryView from './components/HistoryView';
import UserProfileModal from './components/UserProfileModal';
import { CountryConfig, countriesConfig } from './config/countries';
import LandingPage from './components/LandingPage';
import { loadHistory, saveHistory } from './lib/storage';
import { supabase, isSupabaseConnected } from './lib/supabaseClient';
import { syncCreditsToSupabase } from './lib/profileSync';
import { logEvent } from './lib/events';


export type UserLevel = 'free' | 'vip';

export type Address = {
  id: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
};

export type User = {
  isLoggedIn: boolean;
  id?: string; // Supabase auth user id（邮箱登录时）
  email?: string;
  phoneNumber?: string;
  name?: string; // Real name for shipping
  nickname?: string; // Display name
  avatar?: string;
  level: UserLevel;
  /** Total display credits = promo_credits + paid_credits */
  credits: number;
  /** System-granted credits (e.g. registration bonus); consumption adds watermark on back */
  promo_credits: number;
  /** Purchased credits; consumption does not add watermark */
  paid_credits: number;
  password?: string;
  createdAt?: number;
  addresses: Address[];
  role?: 'admin' | 'user' | 'support' | 'banned';
  generatedCount?: number;
};

export type SettingsType = {
  layout: 'classic' | 'modern' | 'minimal';
  font: 'handwritten' | 'serif' | 'sans';
  showDate: boolean;
  showLocation: boolean;
  showWeather: boolean;
  /** 旅行照片滤镜类型（前端 + Admin 可配置） */
  filter:
    | 'original'
    | 'summer'
    | 'film'
    | 'goldenSunset'
    | 'tropical'
    | 'cinematic'
    | 'polaroid'
    | 'vintagePostcard'
    | 'nordic'
    | 'tokyoNight'
    | 'moody'
    | 'underwaterRestore';
  /** 滤镜强度（0–1），0 表示关闭效果但仍保留类型选择 */
  filterIntensity?: number;
  paperType: 'standard' | 'premium' | 'textured';
  stampStyle: 'classic' | 'modern' | 'none';
  message: string;
  recipientName: string;
  recipientAddress: string;
  senderName: string;
  authorName?: string;
  aiGenerated: boolean;
  aiPrompt: string;
  aiStyle: 'realistic' | 'artistic' | 'abstract';
  aiTitle: boolean;
  aiBackTemplate: boolean;
  aiLanguage: string;
  copywritingStyle: 'auto' | 'poetic' | 'modern' | 'witty' | 'nostalgic' | 'minimalist';
  cardStory?: string;
  date: string;
  location: string;
  weather: string;
  size: '4x6' | '5x7' | 'square' | 'polaroid' | 'custom';
  customWidth?: number;
  customHeight?: number;
  fill: 'fill' | 'border' | 'bottom-border';
  /** Output size category: postcard (4×6), square, portrait, landscape, poster. When set, used for dimensions and back layout default. */
  postcardSize?: 'postcard' | 'square' | 'portrait' | 'landscape' | 'poster';
  /** Back layout: postcard_back (address/stamp/message) or blank_back. Default: postcard when postcardSize is postcard, else blank_back. */
  backLayout?: 'postcard_back' | 'blank_back';
};

export type ConfigGroup = {
  id: string;
  name: string;
  settings: SettingsType;
  photoIds: string[];
};

export type Photo = {
  id: string;
  url: string;
  file: File;
  groupId?: string; // Added
  exif?: {
    date?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
};

export type ProcessedPostcard = {
  id: string;
  frontUrl: string;
  frontDataUrl?: string; 
  backDataUrl?: string;
  backUrl: string;
  timestamp: number;
  createdAt: number; // Made required
  settings: SettingsType;
  originalPhotoId: string;
  title?: string;
  location?: string;
  theme?: string;
  frontStyle?: any;
  backStyle?: any;
  draftTitle?: string;
  draftLocation?: string;
  draftMessage?: string;
  draftAuthor?: string;
  draftDate?: string;
  draftFrontStyle?: any;
  draftBackStyle?: any;
  imgUrl?: string;
  selected?: boolean;
  postmark?: any;
  decorativeIcons?: any[];
  generatedBackImage?: string;
  message?: string;
  author?: string;
  date?: string;
  iconEmoji?: string; // Added
  /** True when this postcard was generated using promo_credits (watermark on back) */
  watermark?: boolean;
  /** Generation record fields (for storage/analytics) */
  user_id?: string;
  original_image_url?: string;
  styled_image_url?: string;
  style_type?: string;
  postcard_size?: string;
  back_layout_type?: 'postcard_back' | 'blank_back';
  prompt_version?: string;
};

export const defaultSettings: SettingsType = { // Exported
  layout: 'classic',
  font: 'handwritten',
  showDate: true,
  showLocation: true,
  showWeather: true,
  filter: 'original',
  filterIntensity: 0.8,
  paperType: 'standard',
  stampStyle: 'classic',
  message: '',
  recipientName: '',
  recipientAddress: '',
  senderName: '',
  authorName: '',
  aiGenerated: false,
  aiPrompt: '',
  aiStyle: 'artistic',
  aiTitle: true,
  aiBackTemplate: true,
  aiLanguage: 'Chinese',
  copywritingStyle: 'auto',
  cardStory: '',
  date: '',
  location: '',
  weather: '',
  size: '4x6',
  fill: 'border'
};

const steps = [
  { id: 1, titleKey: 'step1Title' },
  { id: 2, titleKey: 'step2Title' },
  { id: 3, titleKey: 'step3Title' }
];

const translations: Record<string, any> = {
  en: {
    badge: 'Sea Otter Post Office',
    credits: 'Credits',
    upgrade: 'Upgrade',
    history: 'History',
    login: 'Log In',
    admin: 'Admin',
    step1Title: 'Upload',
    step2Title: 'Configure',
    step3Title: 'Process',
    cloudLoaded: 'Cloud postcards loaded',
    pleaseEnterEmailPassword: 'Please enter email and password',
    signUpSuccess: 'Registration successful! Please log in.',
    tryAgainLater: 'Please try again later.',
    phoneAlreadyRegistered: 'This phone number is already registered.',
    wrongPassword: 'Incorrect password.',
    userNotFoundSignUp: 'User not found. Please sign up first.',
    headerHistoryHint: 'View postcard history',
    headerLoginHint: 'Log in or sign up',
    headerUpgradeHint: 'Upgrade plan',
    headerProfileHint: 'Account & profile',
    loginGetCredits: 'Log in to get 3 free credits',
  },
  zh: {
    badge: '海獭邮局',
    credits: '积分',
    upgrade: '升级',
    history: '历史',
    login: '登录',
    admin: '管理',
    step1Title: '上传',
    step2Title: '配置',
    step3Title: '生成',
    cloudLoaded: '已加载云端明信片',
    pleaseEnterEmailPassword: '请输入邮箱和密码',
    signUpSuccess: '注册成功！请直接登录。',
    tryAgainLater: '请稍后重试。',
    phoneAlreadyRegistered: '该手机号已注册',
    wrongPassword: '密码错误',
    userNotFoundSignUp: '用户不存在，请先注册。',
    headerHistoryHint: '查看明信片历史',
    headerLoginHint: '登录 / 注册',
    headerUpgradeHint: '升级方案',
    headerProfileHint: '账户与资料',
    loginGetCredits: '登录领 3 积分',
  },
  ja: {
    badge: 'ラッコ郵便局',
    credits: 'クレジット',
    upgrade: 'アップグレード',
    history: '履歴',
    login: 'ログイン',
    admin: '管理',
    step1Title: 'アップロード',
    step2Title: '設定',
    step3Title: '生成',
    cloudLoaded: 'クラウドのポストカードを読み込みました',
    pleaseEnterEmailPassword: 'メールアドレスとパスワードを入力してください',
    signUpSuccess: '登録完了。ログインしてください。',
    tryAgainLater: 'しばらくしてから再試行してください。',
    phoneAlreadyRegistered: 'この電話番号は既に登録されています。',
    wrongPassword: 'パスワードが正しくありません。',
    userNotFoundSignUp: 'ユーザーが見つかりません。先に登録してください。',
    headerHistoryHint: 'ポストカード履歴を見る',
    headerLoginHint: 'ログイン / 新規登録',
    headerUpgradeHint: 'プランアップグレード',
    headerProfileHint: 'アカウント・プロフィール',
    loginGetCredits: 'ログインで3クレジット',
  },
  ko: {
    badge: '해달 우체국',
    credits: '크레딧',
    upgrade: '업그레이드',
    history: '기록',
    login: '로그인',
    admin: '관리',
    step1Title: '업로드',
    step2Title: '설정',
    step3Title: '생성',
    cloudLoaded: '클라우드 엽서를 불러왔습니다',
    pleaseEnterEmailPassword: '이메일과 비밀번호를 입력하세요.',
    signUpSuccess: '가입 완료. 로그인해 주세요.',
    tryAgainLater: '잠시 후 다시 시도해 주세요.',
    phoneAlreadyRegistered: '이 번호는 이미 등록되어 있습니다.',
    wrongPassword: '비밀번호가 올바르지 않습니다.',
    userNotFoundSignUp: '사용자를 찾을 수 없습니다. 먼저 가입해 주세요.',
    headerHistoryHint: '엽서 기록 보기',
    headerLoginHint: '로그인 / 가입',
    headerUpgradeHint: '플랜 업그레이드',
    headerProfileHint: '계정 및 프로필',
    loginGetCredits: '로그인 시 3 크레딧',
  },
  fr: {
    badge: 'La Poste des Loutres',
    credits: 'Crédits',
    upgrade: 'Améliorer',
    history: 'Historique',
    login: 'Connexion',
    admin: 'Admin',
    step1Title: 'Télécharger',
    step2Title: 'Configurer',
    step3Title: 'Générer',
    cloudLoaded: 'Cartes postales cloud chargées',
    pleaseEnterEmailPassword: 'Veuillez entrer email et mot de passe',
    signUpSuccess: 'Inscription réussie ! Connectez-vous.',
    tryAgainLater: 'Veuillez réessayer plus tard.',
    phoneAlreadyRegistered: 'Ce numéro est déjà enregistré.',
    wrongPassword: 'Mot de passe incorrect.',
    userNotFoundSignUp: 'Utilisateur introuvable. Inscrivez-vous d\'abord.',
    headerHistoryHint: 'Voir l\'historique des cartes',
    headerLoginHint: 'Connexion / Inscription',
    headerUpgradeHint: 'Améliorer l\'offre',
    headerProfileHint: 'Compte et profil',
    loginGetCredits: 'Connectez-vous pour 3 crédits gratuits',
  },
  de: {
    badge: 'Otter-Post',
    credits: 'Credits',
    upgrade: 'Upgrade',
    history: 'Verlauf',
    login: 'Anmelden',
    admin: 'Admin',
    step1Title: 'Hochladen',
    step2Title: 'Konfigurieren',
    step3Title: 'Verarbeiten',
    cloudLoaded: 'Cloud-Postkarten geladen',
    pleaseEnterEmailPassword: 'E-Mail und Passwort eingeben',
    signUpSuccess: 'Registrierung erfolgreich! Bitte anmelden.',
    tryAgainLater: 'Bitte später erneut versuchen.',
    phoneAlreadyRegistered: 'Diese Nummer ist bereits registriert.',
    wrongPassword: 'Falsches Passwort.',
    userNotFoundSignUp: 'Benutzer nicht gefunden. Bitte zuerst registrieren.',
    headerHistoryHint: 'Postkarten-Verlauf',
    headerLoginHint: 'Anmelden / Registrieren',
    headerUpgradeHint: 'Upgrade',
    headerProfileHint: 'Konto & Profil',
    loginGetCredits: 'Anmelden für 3 Gratis-Credits',
  },
  es: {
    badge: 'Correos de la Nutria',
    credits: 'Créditos',
    upgrade: 'Mejorar',
    history: 'Historial',
    login: 'Iniciar sesión',
    admin: 'Admin',
    step1Title: 'Subir',
    step2Title: 'Configurar',
    step3Title: 'Procesar',
    cloudLoaded: 'Postales en la nube cargadas',
    pleaseEnterEmailPassword: 'Introduce email y contraseña',
    signUpSuccess: '¡Registro correcto! Inicia sesión.',
    tryAgainLater: 'Inténtalo de nuevo más tarde.',
    phoneAlreadyRegistered: 'Este número ya está registrado.',
    wrongPassword: 'Contraseña incorrecta.',
    userNotFoundSignUp: 'Usuario no encontrado. Regístrate primero.',
    headerHistoryHint: 'Ver historial de postales',
    headerLoginHint: 'Iniciar sesión / Registrarse',
    headerUpgradeHint: 'Mejorar plan',
    headerProfileHint: 'Cuenta y perfil',
    loginGetCredits: 'Inicia sesión para 3 créditos gratis',
  },
  it: {
    badge: 'Posta della Lontra',
    credits: 'Crediti',
    upgrade: 'Upgrade',
    history: 'Cronologia',
    login: 'Accedi',
    admin: 'Admin',
    step1Title: 'Carica',
    step2Title: 'Configura',
    step3Title: 'Elabora',
    cloudLoaded: 'Cartoline cloud caricate',
    pleaseEnterEmailPassword: 'Inserisci email e password',
    signUpSuccess: 'Registrazione completata! Accedi.',
    tryAgainLater: 'Riprova più tardi.',
    phoneAlreadyRegistered: 'Questo numero è già registrato.',
    wrongPassword: 'Password errata.',
    userNotFoundSignUp: 'Utente non trovato. Registrati prima.',
    headerHistoryHint: 'Vedi cronologia cartoline',
    headerLoginHint: 'Accedi / Registrati',
    headerUpgradeHint: 'Upgrade piano',
    headerProfileHint: 'Account e profilo',
    loginGetCredits: 'Accedi per 3 crediti gratis',
  },
  th: {
    badge: 'ไปรษณีย์ตัวนาก',
    credits: 'เครดิต',
    upgrade: 'อัปเกรด',
    history: 'ประวัติ',
    login: 'เข้าสู่ระบบ',
    admin: 'แอดมิน',
    step1Title: 'อัปโหลด',
    step2Title: 'ตั้งค่า',
    step3Title: 'สร้าง',
    cloudLoaded: 'โหลดโปสการ์ดจากคลาวด์แล้ว',
    pleaseEnterEmailPassword: 'กรอกอีเมลและรหัสผ่าน',
    signUpSuccess: 'ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ',
    tryAgainLater: 'กรุณาลองใหม่ในภายหลัง',
    phoneAlreadyRegistered: 'หมายเลขนี้ลงทะเบียนแล้ว',
    wrongPassword: 'รหัสผ่านไม่ถูกต้อง',
    userNotFoundSignUp: 'ไม่พบผู้ใช้ กรุณาลงทะเบียนก่อน',
    headerHistoryHint: 'ดูประวัติโปสการ์ด',
    headerLoginHint: 'เข้าสู่ระบบ / ลงทะเบียน',
    headerUpgradeHint: 'อัปเกรดแผน',
    headerProfileHint: 'บัญชีและโปรไฟล์',
    loginGetCredits: 'เข้าสู่ระบบรับ 3 เครดิตฟรี',
  },
  vi: {
    badge: 'Bưu điện Rái cá',
    credits: 'Tín dụng',
    upgrade: 'Nâng cấp',
    history: 'Lịch sử',
    login: 'Đăng nhập',
    admin: 'Quản trị',
    step1Title: 'Tải lên',
    step2Title: 'Cấu hình',
    step3Title: 'Xử lý',
    cloudLoaded: 'Đã tải bưu thiếp từ cloud',
    pleaseEnterEmailPassword: 'Vui lòng nhập email và mật khẩu',
    signUpSuccess: 'Đăng ký thành công! Vui lòng đăng nhập.',
    tryAgainLater: 'Vui lòng thử lại sau.',
    phoneAlreadyRegistered: 'Số này đã được đăng ký.',
    wrongPassword: 'Sai mật khẩu.',
    userNotFoundSignUp: 'Không tìm thấy người dùng. Vui lòng đăng ký trước.',
    headerHistoryHint: 'Xem lịch sử bưu thiếp',
    headerLoginHint: 'Đăng nhập / Đăng ký',
    headerUpgradeHint: 'Nâng cấp gói',
    headerProfileHint: 'Tài khoản và hồ sơ',
    loginGetCredits: 'Đăng nhập nhận 3 tín dụng miễn phí',
  },
  id: {
    badge: 'Kantor Pos Berang-berang',
    credits: 'Kredit',
    upgrade: 'Upgrade',
    history: 'Riwayat',
    login: 'Masuk',
    admin: 'Admin',
    step1Title: 'Unggah',
    step2Title: 'Konfigurasi',
    step3Title: 'Proses',
    cloudLoaded: 'Kartu pos cloud dimuat',
    pleaseEnterEmailPassword: 'Masukkan email dan kata sandi',
    signUpSuccess: 'Pendaftaran berhasil! Silakan masuk.',
    tryAgainLater: 'Silakan coba lagi nanti.',
    phoneAlreadyRegistered: 'Nomor ini sudah terdaftar.',
    wrongPassword: 'Kata sandi salah.',
    userNotFoundSignUp: 'Pengguna tidak ditemukan. Daftar dulu.',
    headerHistoryHint: 'Lihat riwayat kartu pos',
    headerLoginHint: 'Masuk / Daftar',
    headerUpgradeHint: 'Upgrade paket',
    headerProfileHint: 'Akun & profil',
    loginGetCredits: 'Masuk dapat 3 kredit gratis',
  },
  ms: {
    badge: 'Pejabat Pos Memerang',
    credits: 'Kredit',
    upgrade: 'Naik taraf',
    history: 'Sejarah',
    login: 'Log masuk',
    admin: 'Admin',
    step1Title: 'Muat naik',
    step2Title: 'Konfigurasi',
    step3Title: 'Proses',
    cloudLoaded: 'Poskad awan dimuat',
    pleaseEnterEmailPassword: 'Sila masukkan e-mel dan kata laluan',
    signUpSuccess: 'Pendaftaran berjaya! Sila log masuk.',
    tryAgainLater: 'Sila cuba lagi nanti.',
    phoneAlreadyRegistered: 'Nombor ini sudah berdaftar.',
    wrongPassword: 'Kata laluan salah.',
    userNotFoundSignUp: 'Pengguna tidak dijumpai. Daftar dahulu.',
    headerHistoryHint: 'Lihat sejarah poskad',
    headerLoginHint: 'Log masuk / Daftar',
    headerUpgradeHint: 'Naik taraf pelan',
    headerProfileHint: 'Akaun & profil',
    loginGetCredits: 'Log masuk dapat 3 kredit percuma',
  }
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [history, setHistory] = useState<ProcessedPostcard[]>([]);
  const [configGroups, setConfigGroups] = useState<ConfigGroup[]>([
    { id: 'default', name: 'Default Group', settings: defaultSettings, photoIds: [] }
  ]);
  
  // User & Commercialization State
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('postcard_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Force 0 credits if not logged in to clear stale data from previous versions
      if (!parsed.isLoggedIn) {
        return { ...parsed, credits: 0, promo_credits: 0, paid_credits: 0 };
      }
      const promo = typeof parsed.promo_credits === 'number' ? parsed.promo_credits : (typeof parsed.credits === 'number' ? parsed.credits : 0);
      const paid = typeof parsed.paid_credits === 'number' ? parsed.paid_credits : 0;
      return { ...parsed, credits: promo + paid, promo_credits: promo, paid_credits: paid };
    }
    return { isLoggedIn: false, level: 'free', credits: 0, promo_credits: 0, paid_credits: 0, addresses: [] };
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('postcard_all_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [showPricing, setShowPricing] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'question'>('suggestion');
  const [showLanding, setShowLanding] = useState(true);
  
  const [language, setLanguage] = useState('zh');
  const [countryConfig, setCountryConfig] = useState<CountryConfig>(countriesConfig[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevSupabaseUserIdRef = useRef<string | null>(null);
  const hasInitialLoadRef = useRef(false);
  const loadHistoryRequestIdRef = useRef<string | null>(null);
  const creditsDeductedAtRef = useRef<number>(0);
  // 从 Supabase 会话同步用户信息
  const syncUserFromSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser({ isLoggedIn: false, level: 'free', credits: 0, promo_credits: 0, paid_credits: 0, addresses: [] });
      return;
    }
    const sUser = session.user;
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits, promo_credits, paid_credits, nickname, role')
      .eq('id', sUser.id)
      .single();
    const defaultPromo = (() => {
      const v = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_credits_default_promo') : null;
      const n = v != null ? parseInt(v, 10) : NaN;
      return Number.isFinite(n) && n >= 0 ? n : 3;
    })();
    const promo = typeof (profile as { promo_credits?: number })?.promo_credits === 'number'
      ? (profile as { promo_credits: number }).promo_credits
      : (typeof profile?.credits === 'number' ? profile.credits : defaultPromo);
    const paid = typeof (profile as { paid_credits?: number })?.paid_credits === 'number'
      ? (profile as { paid_credits: number }).paid_credits
      : 0;
    const total = promo + paid;
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string)?.trim().toLowerCase();
    const emailMatchesAdmin = adminEmail && (sUser.email?.toLowerCase() === adminEmail);
    const skipCreditsOverwrite = Date.now() - creditsDeductedAtRef.current < 5000;
    setUser(prev => {
      let effectiveRole: User['role'] = prev.role || 'user';
      if (profile != null) {
        const profileRole = (profile.role as User['role']) || 'user';
        effectiveRole = profileRole === 'admin' || emailMatchesAdmin ? 'admin' : profileRole === 'banned' ? 'banned' : profileRole === 'support' ? 'support' : profileRole;
      } else if (emailMatchesAdmin) {
        effectiveRole = 'admin';
      }
      const finalCredits = skipCreditsOverwrite ? prev.credits : total;
      const finalPromo = skipCreditsOverwrite ? (prev.promo_credits ?? 0) : promo;
      const finalPaid = skipCreditsOverwrite ? (prev.paid_credits ?? 0) : paid;
      return {
        ...prev,
        isLoggedIn: true,
        id: sUser.id,
        email: sUser.email || prev.email,
        phoneNumber: (sUser as { phone?: string }).phone || prev.phoneNumber,
        nickname: profile?.nickname || prev.nickname || (sUser.email ? sUser.email.split('@')[0] : (sUser as { phone?: string }).phone || undefined),
        level: prev.level || 'free',
        credits: finalCredits,
        promo_credits: finalPromo,
        paid_credits: finalPaid,
        addresses: prev.addresses || [],
        createdAt: prev.createdAt || Date.now(),
        role: effectiveRole,
      };
    });
  };

  // 组件挂载时，初始化 Supabase 会话 & 监听 Auth 状态变更
  useEffect(() => {
    syncUserFromSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, _session: unknown) => {
      syncUserFromSupabase();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 登录用户用 Supabase user_id 加载，游客用 IndexedDB
  const supabaseUserId = user.isLoggedIn && user.id ? user.id : null;
  useEffect(() => {
    const requestId = supabaseUserId ?? 'guest';
    loadHistoryRequestIdRef.current = requestId;
    setIsLoaded(false);
    loadHistory(supabaseUserId).then(savedHistory => {
      // 忽略过期请求（用户快速切换或 language 变更导致多次请求时只应用最新结果）
      if (loadHistoryRequestIdRef.current !== requestId) return;
      const isFirstRun = !hasInitialLoadRef.current;
      if (!hasInitialLoadRef.current) hasInitialLoadRef.current = true;
      const wasGuest = prevSupabaseUserIdRef.current === null;
      prevSupabaseUserIdRef.current = supabaseUserId;
      setHistory(savedHistory);
      setIsLoaded(true);
      if (!isFirstRun && wasGuest && supabaseUserId !== null && savedHistory.length > 0) {
        const t = translations[language] || translations.en;
        setToastMessage(t.cloudLoaded ?? 'Cloud postcards loaded');
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
  }, [supabaseUserId, language]);

  useEffect(() => {
    if (isLoaded) {
      saveHistory(history, supabaseUserId);
    }
  }, [history, isLoaded, supabaseUserId]);

  useEffect(() => {
    localStorage.setItem('postcard_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('postcard_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  // Sync current user back to allUsers
  useEffect(() => {
    if (user.isLoggedIn) {
      setAllUsers(prev => {
        const index = prev.findIndex(u => 
          (user.email && u.email === user.email) || 
          (user.phoneNumber && u.phoneNumber === user.phoneNumber)
        );
        if (index !== -1) {
          const updated = [...prev];
          // Only update if there's an actual change to avoid loops
          if (JSON.stringify(updated[index]) !== JSON.stringify(user)) {
            updated[index] = { ...user };
            return updated;
          }
        }
        return prev;
      });
    }
  }, [user]);

  // Set default country to China
  useEffect(() => {
    const chinaConfig = countriesConfig.find(c => c.country === 'China');
    if (chinaConfig) {
      setCountryConfig(chinaConfig);
      setLanguage('zh');
    }
  }, []);

  const handleLogin = async (identifier: string, password?: string, isSignUp?: boolean, name?: string, type: 'email' | 'phone' = 'email'): Promise<string | void> => {
    const t = translations[language] || translations.en;
    if (type === 'email') {
      if (!identifier || !password) {
        return t.pleaseEnterEmailPassword ?? 'Please enter email and password';
      }
      try {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email: identifier,
            password,
            options: { data: { nickname: name || identifier.split('@')[0] } },
          });
          if (error) {
            const msg = error.message || JSON.stringify(error);
            console.error('[Supabase signUp]', error);
            return language === 'zh' ? `注册失败：${msg}` : msg;
          }
          logEvent('sign_up', { email: identifier });
          alert(t.signUpSuccess ?? 'Registration successful! Please log in.');
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
          if (error) {
            return language === 'zh' ? `登录失败：${error.message}` : error.message;
          }
          logEvent('sign_in', { email: identifier });
        }
        await syncUserFromSupabase();
        setShowAuth(false);
        setShowLanding(false);
      } catch (e: unknown) {
        console.error('Supabase auth error', e);
        return e instanceof Error ? e.message : (t.tryAgainLater ?? 'Please try again later.');
      }
      return;
    }

    // 手机登录：本地模拟（不接 Supabase）
    const role = identifier === 'admin@seaotter.com' ? 'admin' : 'user';
    if (isSignUp) {
      if (allUsers.find(u => u.phoneNumber === identifier)) {
        return t.phoneAlreadyRegistered ?? 'User already exists';
      }
      const defPromo = (() => {
        const v = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_credits_default_promo') : null;
        const n = v != null ? parseInt(v, 10) : NaN;
        return Number.isFinite(n) && n >= 0 ? n : 3;
      })();
      const newUser: User = {
        isLoggedIn: true,
        phoneNumber: identifier,
        nickname: name || identifier,
        password,
        level: 'free',
        credits: defPromo,
        promo_credits: defPromo,
        paid_credits: 0,
        createdAt: Date.now(),
        addresses: [],
        role,
      };
      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
      alert('Registration successful! Welcome to 海獭邮局.');
    } else {
      const existingUser = allUsers.find(u => u.phoneNumber === identifier);
      if (existingUser) {
        if (password && existingUser.password !== password) {
          return language === 'zh' ? '密码错误' : 'Incorrect password';
        }
        const updatedRole = identifier === 'admin@seaotter.com' ? 'admin' : (existingUser.role || 'user');
        setUser({ ...existingUser, isLoggedIn: true, addresses: existingUser.addresses || [], role: updatedRole });
      } else {
        if (!password) {
          const defPromo = (() => {
            const v = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_credits_default_promo') : null;
            const n = v != null ? parseInt(v, 10) : NaN;
            return Number.isFinite(n) && n >= 0 ? n : 3;
          })();
          const newUser: User = {
            isLoggedIn: true,
            phoneNumber: identifier,
            nickname: name || identifier,
            level: 'free',
            credits: defPromo,
            promo_credits: defPromo,
            paid_credits: 0,
            createdAt: Date.now(),
            addresses: [],
            role,
          };
          setAllUsers(prev => [...prev, newUser]);
          setUser(newUser);
        } else {
          return t.userNotFoundSignUp ?? 'User not found. Please sign up first.';
        }
      }
    }
    setShowAuth(false);
    setShowLanding(false);
  };

  const handleLogout = async () => {
    logEvent('sign_out');
    await supabase.auth.signOut();
    setUser({ isLoggedIn: false, level: 'free', credits: 0, promo_credits: 0, paid_credits: 0, addresses: [] });
    setShowProfile(false);
    setShowLanding(true);
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSaveGroup = (group: ConfigGroup) => {
    // 确保 aiTitle/aiBackTemplate 不会因合并丢失，避免「设置了滤镜就不处理」的问题
    const mergedSettings = { ...defaultSettings, ...(group.settings || {}) };
    const safeGroup = { ...group, settings: mergedSettings };
    setConfigGroups(prev => {
      const index = prev.findIndex(g => g.id === safeGroup.id);
      if (index >= 0) {
        const newGroups = [...prev];
        newGroups[index] = safeGroup;
        return newGroups;
      }
      return [...prev, safeGroup];
    });
    handleNext();
  };

  const tHeader = translations[language] || translations.en;

  if (isAdmin) {
    return <AdminPanel onBack={() => setIsAdmin(false)} users={allUsers} currentUser={user} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      {!isLoaded && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-stone-200 z-[60] overflow-hidden">
          <div className="h-full w-1/3 bg-stone-500" style={{ animation: 'shimmer 1.2s ease-in-out infinite' }} />
        </div>
      )}
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }`}</style>
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => setShowLanding(true)}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
              <SeaOtterLogo className="w-full h-full" />
            </div>
            <h1 className="font-semibold text-base sm:text-lg tracking-tight whitespace-nowrap">{tHeader.badge}</h1>
          </div>
          
          {!showLanding && (
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 overflow-hidden">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isPast = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive ? 'text-stone-900' : isPast ? 'text-stone-500' : 'text-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 xl:w-6 xl:h-6 rounded-full flex items-center justify-center text-[10px] xl:text-xs shrink-0 ${
                        isActive
                          ? 'bg-stone-900 text-white'
                          : isPast
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {isPast ? '✓' : step.id}
                    </div>
                    {tHeader[step.titleKey] ?? step.titleKey}
                  </div>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Country Selection */}
            <div className="relative">
              <button
                onClick={() => setShowCountryMenu(!showCountryMenu)}
                title={countryConfig.nativeLanguage}
                aria-label={countryConfig.nativeLanguage}
                className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 text-[10px] sm:text-xs xl:text-sm font-medium hover:border-stone-300 transition-all"
              >
                <Globe2 className="w-3 h-3 sm:w-4 sm:h-4 text-stone-400" />
                <span className="hidden sm:inline">{countryConfig.nativeCountry} ({countryConfig.nativeLanguage})</span>
                <ChevronDown className={cn("w-3 h-3 sm:w-4 sm:h-4 transition-transform", showCountryMenu && "rotate-180")} />
              </button>

              {showCountryMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-100 overflow-hidden z-[110] min-w-[140px] sm:min-w-[160px]">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {countriesConfig.map((country) => (
                      <button
                        key={country.country}
                        onClick={() => {
                          setCountryConfig(country);
                          setLanguage(country.langCode);
                          setShowCountryMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors text-xs sm:text-sm",
                          countryConfig.country === country.country ? "bg-stone-50 text-stone-900 font-bold" : "text-stone-600"
                        )}
                      >
                        <span>{country.nativeCountry} ({country.nativeLanguage})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user.level !== 'vip' && (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-stone-600 bg-stone-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full whitespace-nowrap">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    {user.credits} <span className="hidden sm:inline">{tHeader.credits}</span>
                  </div>
                  {!user.isLoggedIn && (
                    <span className="text-[9px] text-indigo-500 font-bold mt-0.5 animate-pulse">{tHeader.loginGetCredits}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowPricing(true)}
                  title={tHeader.headerUpgradeHint ?? tHeader.upgrade}
                  aria-label={tHeader.headerUpgradeHint ?? tHeader.upgrade}
                  className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
                >
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                  {tHeader.upgrade}
                </button>
              </div>
            )}
            
            {user.isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-3 border-l border-stone-200 pl-2 sm:pl-4">
                <button
                  onClick={() => setShowHistory(true)}
                  title={tHeader.headerHistoryHint ?? tHeader.history}
                  aria-label={tHeader.headerHistoryHint ?? tHeader.history}
                  className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap"
                >
                  <History className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tHeader.history}</span>
                </button>
                <button
                  onClick={() => setShowProfile(true)}
                  title={tHeader.headerProfileHint ?? tHeader.history}
                  aria-label={tHeader.headerProfileHint ?? 'Profile'}
                  className="text-[10px] sm:text-xs xl:text-sm font-medium text-stone-900 bg-stone-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-stone-200 transition-colors whitespace-nowrap max-w-[80px] sm:max-w-none truncate"
                >
                  {user.nickname || user.email?.split('@')[0] || user.phoneNumber}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 border-l border-stone-200 pl-2 sm:pl-4">
                {!showLanding && (
                  <button
                    onClick={() => setShowHistory(true)}
                    title={tHeader.headerHistoryHint ?? tHeader.history}
                    aria-label={tHeader.headerHistoryHint ?? tHeader.history}
                    className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap mr-2"
                  >
                    <History className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tHeader.history}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAuth(true)}
                  title={tHeader.headerLoginHint ?? tHeader.login}
                  aria-label={tHeader.headerLoginHint ?? tHeader.login}
                  className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4" />
                  {tHeader.login}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLanding ? (
        <LandingPage 
          onStart={() => setShowLanding(false)} 
          language={language}
          countryConfig={countryConfig}
          onCountryChange={(config) => {
            setCountryConfig(config);
            setLanguage(config.langCode);
          }}
          onFeedback={() => {
            setFeedbackType('suggestion');
            setShowFeedback(true);
          }}
        />
      ) : (
        <main className="max-w-5xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 min-h-[600px] flex flex-col"
            >
              {currentStep === 1 && (
                <Step1Upload 
                  photos={photos} 
                  setPhotos={setPhotos} 
                  onNext={handleNext} 
                  language={language} 
                  onFeedback={() => {
                    setFeedbackType('question');
                    setShowFeedback(true);
                  }}
                />
              )}
              {currentStep === 2 && (
                <Step3Configure 
                  editingGroupId="default"
                  configGroups={configGroups}
                  onSave={handleSaveGroup}
                  onCancel={handleBack}
                  language={language}
                  previewImageUrl={photos[0]?.url ?? null}
                  onFeedback={() => {
                    setFeedbackType('question');
                    setShowFeedback(true);
                  }}
                />
              )}
              {currentStep === 3 && (
                <Step5Process 
                  photos={photos} 
                  setPhotos={setPhotos}
                  configGroups={configGroups} 
                  history={history}
                  setHistory={setHistory}
                  onBack={() => {
                    setPhotos([]);
                    setCurrentStep(1);
                    setEditId(null);
                  }} 
                  user={user}
                  setUser={setUser}
                  setShowPricing={setShowPricing}
                  editId={editId}
                  onClearEdit={() => {
                    if (editId) {
                      setEditId(null);
                      setCurrentStep(1);
                      setShowHistory(true);
                    } else {
                      setEditId(null);
                    }
                  }}
                  language={language}
                  onFeedback={() => {
                    setFeedbackType('question');
                    setShowFeedback(true);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      <AnimatePresence>
        {showPricing && (
          <PricingModal
            isLoggedIn={user.isLoggedIn}
            language={language}
            countryConfig={countryConfig}
            onRequireLogin={() => {
              setShowPricing(false);
              setShowAuth(true);
            }}
            onClose={() => setShowPricing(false)}
            onBuyCredits={(amount) => {
              setUser(prev => {
                const newPaid = (prev.paid_credits ?? 0) + amount;
                const newCredits = (prev.promo_credits ?? 0) + newPaid;
                if (prev.id && isSupabaseConnected) {
                  syncCreditsToSupabase(prev.id, prev.promo_credits ?? 0, newPaid, prev.generatedCount || 0).catch(console.error);
                }
                logEvent('credits_purchased', { amount });
                return { ...prev, paid_credits: newPaid, credits: newCredits };
              });
              setShowPricing(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onLogin={handleLogin}
            language={language}
            countryConfig={countryConfig}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistory && (
          <HistoryView
            history={history}
            user={user}
            onClose={() => setShowHistory(false)}
            onDownload={async (frontUrl, backUrl, title) => {
              try {
                const safeTitle = (title || 'postcard').replace(/[<>:"/\\|?*]/g, '_');
                
                const a1 = document.createElement('a');
                a1.href = frontUrl;
                a1.download = `${safeTitle}_front.jpg`;
                a1.click();

                setTimeout(() => {
                  const a2 = document.createElement('a');
                  a2.href = backUrl;
                  a2.download = `${safeTitle}_back.jpg`;
                  a2.click();
                }, 300);
              } catch (e) {
                console.error("Failed to download postcard from history", e);
                alert("Failed to download. Please try again.");
              }
            }}
            onDelete={(id) => {
              setHistory(prev => prev.filter(p => p.id !== id));
            }}
            onBatchDelete={(ids) => {
              setHistory(prev => prev.filter(p => !ids.includes(p.id)));
            }}
            onEdit={(id) => {
              setShowHistory(false);
              setEditId(id);
              setCurrentStep(3);
            }}
            language={language}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && (
          <UserProfileModal
            user={user}
            setUser={setUser}
            onClose={() => setShowProfile(false)}
            onLogout={handleLogout}
            onUpgrade={() => {
              setShowProfile(false);
              setShowPricing(true);
            }}
            onAdminEnter={() => setIsAdmin(true)}
            language={language}
          />
        )}
      </AnimatePresence>

      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
        language={language}
        initialType={feedbackType}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
