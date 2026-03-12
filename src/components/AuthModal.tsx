import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, X, ArrowRight, Smartphone, User as UserIcon } from 'lucide-react';
import { CountryConfig } from '../config/countries';
import { supabase, isSupabaseConnected } from '../lib/supabaseClient';
import { cn } from '../lib/utils';

interface Props {
  onClose: () => void;
  onLogin: (identifier: string, password?: string, isSignUp?: boolean, name?: string, type?: 'email' | 'phone') => Promise<string | void>;
  onOAuthLogin?: (provider: 'google') => Promise<string | void>;
  language: string;
  countryConfig: CountryConfig;
}

const translations: Record<string, any> = {
  en: {
    createAccount: 'Create an account',
    welcomeBack: 'Welcome back',
    signUpDesc: 'Sign up to save your postcards and buy credits.',
    logInDesc: 'Log in to access your saved postcards.',
    orContinue: 'Or continue with',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    verificationCode: 'Verification Code',
    getCode: 'Get Code',
    codeSent: 'Sent!',
    fullName: 'Full Name',
    nickname: 'Nickname',
    terms: 'I agree to the Terms of Service and Privacy Policy',
    signUp: 'Sign Up',
    logIn: 'Log In',
    alreadyHave: 'Already have an account?',
    dontHave: "Don't have an account?",
    socialLogin: 'Continue with {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'Email',
    tabPhone: 'Phone',
    invalidEmail: 'Please enter a valid email address',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordWeak: 'Use letters + numbers for stronger security',
    passwordMedium: 'Medium',
    passwordStrong: 'Strong',
    google: 'Google',
    invalidPhone: 'Please enter a valid phone number',
    agreeTerms: 'Please agree to the terms',
    enterPhone: 'Please enter phone number',
    enterEmail: 'Please enter email',
    enterCode: 'Please enter verification code',
    nicknameOptional: 'Optional display name',
    phoneDemoHint: 'Demo: use code 123456',
    phoneSmsHint: 'Code will be sent via SMS',
    socialDemo: 'Demo only',
    continueWithGoogle: 'Continue with Google',
    sendCodeFailed: 'Failed to send code. Please try again.',
    invalidCode: 'Invalid or expired code.',
    googleRequiresSupabase: 'Google login requires Supabase configuration.',
  },
  zh: {
    createAccount: '创建账号',
    welcomeBack: '欢迎回来',
    signUpDesc: '注册以保存您的明信片并购买积分。',
    logInDesc: '登录以访问您保存的明信片。',
    orContinue: '或使用以下方式继续',
    email: '邮箱',
    phone: '手机号',
    password: '密码',
    verificationCode: '验证码',
    getCode: '获取验证码',
    codeSent: '已发送!',
    fullName: '姓名',
    nickname: '昵称',
    terms: '我同意服务条款和隐私政策',
    signUp: '注册',
    logIn: '登录',
    alreadyHave: '已有账号？',
    dontHave: "还没有账号？",
    socialLogin: '使用 {provider} 继续',
    wechat: '微信',
    alipay: '支付宝',
    qq: 'QQ',
    tabEmail: '邮箱登录',
    tabPhone: '手机登录',
    invalidEmail: '请输入有效的邮箱地址',
    passwordTooShort: '密码至少 6 位',
    passwordWeak: '建议使用字母+数字提高安全性',
    passwordMedium: '中',
    passwordStrong: '强',
    google: 'Google',
    invalidPhone: '请输入有效的手机号',
    agreeTerms: '请同意服务条款',
    enterPhone: '请输入手机号码',
    enterEmail: '请输入邮箱',
    enterCode: '请输入验证码',
    nicknameOptional: '选填，用于显示',
    phoneDemoHint: '演示验证码：123456',
    phoneSmsHint: '验证码将发送至您的手机',
    socialDemo: '仅演示',
    continueWithGoogle: '使用 Google 继续',
    sendCodeFailed: '发送验证码失败，请稍后重试。',
    invalidCode: '验证码错误或已过期。',
    googleRequiresSupabase: 'Google 登录需要 Supabase 配置。',
  },
  fr: {
    createAccount: 'Créer un compte',
    welcomeBack: 'Bon retour',
    signUpDesc: 'Inscrivez-vous pour sauvegarder vos cartes et acheter des crédits.',
    logInDesc: 'Connectez-vous pour accéder à vos cartes sauvegardées.',
    orContinue: 'Ou continuer avec',
    email: 'E-mail',
    phone: 'Téléphone',
    password: 'Mot de passe',
    verificationCode: 'Code de vérification',
    getCode: 'Obtenir le code',
    codeSent: 'Envoyé !',
    fullName: 'Nom',
    nickname: 'Surnom',
    terms: "J'accepte les conditions et la politique de confidentialité",
    signUp: "S'inscrire",
    logIn: 'Connexion',
    alreadyHave: 'Déjà un compte ?',
    dontHave: 'Pas encore de compte ?',
    socialLogin: 'Continuer avec {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'E-mail',
    tabPhone: 'Téléphone',
    invalidEmail: 'Veuillez entrer une adresse e-mail valide',
    passwordTooShort: 'Le mot de passe doit contenir au moins 6 caractères',
    passwordWeak: 'Lettres + chiffres pour plus de sécurité',
    passwordMedium: 'Moyen',
    passwordStrong: 'Fort',
    google: 'Google',
    invalidPhone: 'Veuillez entrer un numéro valide',
    agreeTerms: 'Veuillez accepter les conditions',
    enterPhone: 'Veuillez entrer le numéro',
    enterEmail: 'Veuillez entrer l\'e-mail',
    enterCode: 'Veuillez entrer le code',
    nicknameOptional: 'Nom d\'affichage (optionnel)',
    phoneDemoHint: 'Démo : code 123456',
    phoneSmsHint: 'Le code sera envoyé par SMS',
    socialDemo: 'Démo uniquement',
    continueWithGoogle: 'Continuer avec Google',
    sendCodeFailed: 'Échec de l\'envoi. Réessayez.',
    invalidCode: 'Code invalide ou expiré.',
    googleRequiresSupabase: 'Google nécessite la configuration Supabase.',
  },
  de: {
    createAccount: 'Konto erstellen',
    welcomeBack: 'Willkommen zurück',
    signUpDesc: 'Registrieren Sie sich, um Ihre Karten zu speichern und Credits zu kaufen.',
    logInDesc: 'Melden Sie sich an, um Ihre gespeicherten Karten zu sehen.',
    orContinue: 'Oder fortfahren mit',
    email: 'E-Mail',
    phone: 'Telefon',
    password: 'Passwort',
    verificationCode: 'Bestätigungscode',
    getCode: 'Code anfordern',
    codeSent: 'Gesendet!',
    fullName: 'Name',
    nickname: 'Spitzname',
    terms: 'Ich akzeptiere die AGB und Datenschutzrichtlinie',
    signUp: 'Registrieren',
    logIn: 'Anmelden',
    alreadyHave: 'Bereits ein Konto?',
    dontHave: 'Noch kein Konto?',
    socialLogin: 'Weiter mit {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'E-Mail',
    tabPhone: 'Telefon',
    invalidEmail: 'Bitte gültige E-Mail eingeben',
    passwordTooShort: 'Mindestens 6 Zeichen',
    passwordWeak: 'Buchstaben + Zahlen für mehr Sicherheit',
    passwordMedium: 'Mittel',
    passwordStrong: 'Stark',
    google: 'Google',
    invalidPhone: 'Bitte gültige Nummer eingeben',
    agreeTerms: 'Bitte AGB akzeptieren',
    enterPhone: 'Bitte Nummer eingeben',
    enterEmail: 'Bitte E-Mail eingeben',
    enterCode: 'Bitte Code eingeben',
    nicknameOptional: 'Anzeigename (optional)',
    phoneDemoHint: 'Demo: Code 123456',
    phoneSmsHint: 'Code wird per SMS gesendet',
    socialDemo: 'Nur Demo',
    continueWithGoogle: 'Mit Google fortfahren',
    sendCodeFailed: 'Senden fehlgeschlagen. Bitte erneut versuchen.',
    invalidCode: 'Ungültiger oder abgelaufener Code.',
    googleRequiresSupabase: 'Google-Anmeldung erfordert Supabase.',
  },
  es: {
    createAccount: 'Crear cuenta',
    welcomeBack: 'Bienvenido de nuevo',
    signUpDesc: 'Regístrate para guardar tus postales y comprar créditos.',
    logInDesc: 'Inicia sesión para ver tus postales guardadas.',
    orContinue: 'O continuar con',
    email: 'Correo',
    phone: 'Teléfono',
    password: 'Contraseña',
    verificationCode: 'Código de verificación',
    getCode: 'Obtener código',
    codeSent: '¡Enviado!',
    fullName: 'Nombre',
    nickname: 'Apodo',
    terms: 'Acepto los términos y la política de privacidad',
    signUp: 'Registrarse',
    logIn: 'Iniciar sesión',
    alreadyHave: '¿Ya tienes cuenta?',
    dontHave: '¿No tienes cuenta?',
    socialLogin: 'Continuar con {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'Correo',
    tabPhone: 'Teléfono',
    invalidEmail: 'Introduce un correo válido',
    passwordTooShort: 'Mínimo 6 caracteres',
    passwordWeak: 'Letras y números para más seguridad',
    passwordMedium: 'Medio',
    passwordStrong: 'Fuerte',
    google: 'Google',
    invalidPhone: 'Introduce un número válido',
    agreeTerms: 'Acepta los términos',
    enterPhone: 'Introduce el número',
    enterEmail: 'Introduce el correo',
    enterCode: 'Introduce el código',
    nicknameOptional: 'Nombre para mostrar (opcional)',
    phoneDemoHint: 'Demo: código 123456',
    phoneSmsHint: 'El código se enviará por SMS',
    socialDemo: 'Solo demo',
    continueWithGoogle: 'Continuar con Google',
    sendCodeFailed: 'Error al enviar. Inténtalo de nuevo.',
    invalidCode: 'Código invalido o caducado.',
    googleRequiresSupabase: 'Google requiere configuración Supabase.',
  },
  it: {
    createAccount: 'Crea account',
    welcomeBack: 'Bentornato',
    signUpDesc: 'Registrati per salvare le cartoline e acquistare crediti.',
    logInDesc: 'Accedi per vedere le tue cartoline salvate.',
    orContinue: 'Oppure continua con',
    email: 'Email',
    phone: 'Telefono',
    password: 'Password',
    verificationCode: 'Codice di verifica',
    getCode: 'Ottieni codice',
    codeSent: 'Inviato!',
    fullName: 'Nome',
    nickname: 'Soprannome',
    terms: 'Accetto i termini e la privacy',
    signUp: 'Registrati',
    logIn: 'Accedi',
    alreadyHave: 'Hai già un account?',
    dontHave: 'Non hai un account?',
    socialLogin: 'Continua con {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'Email',
    tabPhone: 'Telefono',
    invalidEmail: 'Inserisci un\'email valida',
    passwordTooShort: 'Almeno 6 caratteri',
    passwordWeak: 'Lettere e numeri per più sicurezza',
    passwordMedium: 'Medio',
    passwordStrong: 'Forte',
    google: 'Google',
    invalidPhone: 'Inserisci un numero valido',
    agreeTerms: 'Accetta i termini',
    enterPhone: 'Inserisci il numero',
    enterEmail: 'Inserisci l\'email',
    enterCode: 'Inserisci il codice',
    nicknameOptional: 'Nome visualizzato (opzionale)',
    phoneDemoHint: 'Demo: codice 123456',
    phoneSmsHint: 'Il codice verrà inviato via SMS',
    socialDemo: 'Solo demo',
    continueWithGoogle: 'Continua con Google',
    sendCodeFailed: 'Invio fallito. Riprova.',
    invalidCode: 'Codice non valido o scaduto.',
    googleRequiresSupabase: 'Google richiede Supabase.',
  },
  th: {
    createAccount: 'สร้างบัญชี',
    welcomeBack: 'ยินดีต้อนรับกลับ',
    signUpDesc: 'ลงทะเบียนเพื่อบันทึกโปสการ์ดและซื้อเครดิต',
    logInDesc: 'เข้าสู่ระบบเพื่อดูโปสการ์ดที่บันทึก',
    orContinue: 'หรือดำเนินการต่อด้วย',
    email: 'อีเมล',
    phone: 'โทรศัพท์',
    password: 'รหัสผ่าน',
    verificationCode: 'รหัสยืนยัน',
    getCode: 'รับรหัส',
    codeSent: 'ส่งแล้ว!',
    fullName: 'ชื่อ',
    nickname: 'ชื่อเล่น',
    terms: 'ยอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว',
    signUp: 'ลงทะเบียน',
    logIn: 'เข้าสู่ระบบ',
    alreadyHave: 'มีบัญชีอยู่แล้ว?',
    dontHave: 'ยังไม่มีบัญชี?',
    socialLogin: 'ดำเนินการต่อด้วย {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'อีเมล',
    tabPhone: 'โทรศัพท์',
    invalidEmail: 'กรอกอีเมลที่ถูกต้อง',
    passwordTooShort: 'อย่างน้อย 6 ตัวอักษร',
    passwordWeak: 'ตัวอักษรและตัวเลขเพื่อความปลอดภัย',
    passwordMedium: 'ปานกลาง',
    passwordStrong: 'แข็งแกร่ง',
    google: 'Google',
    invalidPhone: 'กรอกหมายเลขที่ถูกต้อง',
    agreeTerms: 'กรุณายอมรับข้อกำหนด',
    enterPhone: 'กรอกหมายเลข',
    enterEmail: 'กรอกอีเมล',
    enterCode: 'กรอกรหัส',
    nicknameOptional: 'ชื่อแสดง (ถ้ามี)',
    phoneDemoHint: 'เดโม: รหัส 123456',
    phoneSmsHint: 'รหัสจะส่งทาง SMS',
    socialDemo: 'เดโมเท่านั้น',
    continueWithGoogle: 'ดำเนินการต่อด้วย Google',
    sendCodeFailed: 'ส่งไม่สำเร็จ กรุณาลองใหม่',
    invalidCode: 'รหัสไม่ถูกต้องหรือหมดอายุ',
    googleRequiresSupabase: 'Google ต้องใช้ Supabase',
  },
  vi: {
    createAccount: 'Tạo tài khoản',
    welcomeBack: 'Chào bạn trở lại',
    signUpDesc: 'Đăng ký để lưu bưu thiếp và mua tín dụng.',
    logInDesc: 'Đăng nhập để xem bưu thiếp đã lưu.',
    orContinue: 'Hoặc tiếp tục với',
    email: 'Email',
    phone: 'Điện thoại',
    password: 'Mật khẩu',
    verificationCode: 'Mã xác minh',
    getCode: 'Lấy mã',
    codeSent: 'Đã gửi!',
    fullName: 'Họ tên',
    nickname: 'Biệt danh',
    terms: 'Tôi đồng ý với điều khoản và chính sách bảo mật',
    signUp: 'Đăng ký',
    logIn: 'Đăng nhập',
    alreadyHave: 'Đã có tài khoản?',
    dontHave: 'Chưa có tài khoản?',
    socialLogin: 'Tiếp tục với {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'Email',
    tabPhone: 'Điện thoại',
    invalidEmail: 'Vui lòng nhập email hợp lệ',
    passwordTooShort: 'Ít nhất 6 ký tự',
    passwordWeak: 'Chữ và số để bảo mật hơn',
    passwordMedium: 'Trung bình',
    passwordStrong: 'Mạnh',
    google: 'Google',
    invalidPhone: 'Vui lòng nhập số hợp lệ',
    agreeTerms: 'Vui lòng chấp nhận điều khoản',
    enterPhone: 'Vui lòng nhập số',
    enterEmail: 'Vui lòng nhập email',
    enterCode: 'Vui lòng nhập mã',
    nicknameOptional: 'Tên hiển thị (tùy chọn)',
    phoneDemoHint: 'Demo: mã 123456',
    phoneSmsHint: 'Mã sẽ được gửi qua SMS',
    socialDemo: 'Chỉ demo',
    continueWithGoogle: 'Tiếp tục với Google',
    sendCodeFailed: 'Gửi thất bại. Vui lòng thử lại.',
    invalidCode: 'Mã không hợp lệ hoặc hết hạn.',
    googleRequiresSupabase: 'Google cần cấu hình Supabase.',
  },
  id: {
    createAccount: 'Buat akun',
    welcomeBack: 'Selamat datang kembali',
    signUpDesc: 'Daftar untuk menyimpan kartu pos dan membeli kredit.',
    logInDesc: 'Masuk untuk mengakses kartu pos tersimpan.',
    orContinue: 'Atau lanjutkan dengan',
    email: 'Email',
    phone: 'Telepon',
    password: 'Kata sandi',
    verificationCode: 'Kode verifikasi',
    getCode: 'Dapatkan kode',
    codeSent: 'Terkirim!',
    fullName: 'Nama',
    nickname: 'Nama panggilan',
    terms: 'Saya setuju dengan syarat dan kebijakan privasi',
    signUp: 'Daftar',
    logIn: 'Masuk',
    alreadyHave: 'Sudah punya akun?',
    dontHave: 'Belum punya akun?',
    socialLogin: 'Lanjutkan dengan {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'Email',
    tabPhone: 'Telepon',
    invalidEmail: 'Masukkan email yang valid',
    passwordTooShort: 'Minimal 6 karakter',
    passwordWeak: 'Huruf dan angka untuk keamanan',
    passwordMedium: 'Sedang',
    passwordStrong: 'Kuat',
    google: 'Google',
    invalidPhone: 'Masukkan nomor yang valid',
    agreeTerms: 'Silakan setuju syarat',
    enterPhone: 'Masukkan nomor',
    enterEmail: 'Masukkan email',
    enterCode: 'Masukkan kode',
    nicknameOptional: 'Nama tampilan (opsional)',
    phoneDemoHint: 'Demo: kode 123456',
    phoneSmsHint: 'Kode akan dikirim via SMS',
    socialDemo: 'Hanya demo',
    continueWithGoogle: 'Lanjutkan dengan Google',
    sendCodeFailed: 'Gagal mengirim. Coba lagi.',
    invalidCode: 'Kode tidak valid atau kedaluwarsa.',
    googleRequiresSupabase: 'Google memerlukan Supabase.',
  },
  ms: {
    createAccount: 'Cipta akaun',
    welcomeBack: 'Selamat kembali',
    signUpDesc: 'Daftar untuk simpan poskad dan beli kredit.',
    logInDesc: 'Log masuk untuk akses poskad anda.',
    orContinue: 'Atau teruskan dengan',
    email: 'E-mel',
    phone: 'Telefon',
    password: 'Kata laluan',
    verificationCode: 'Kod pengesahan',
    getCode: 'Dapatkan kod',
    codeSent: 'Dihantar!',
    fullName: 'Nama',
    nickname: 'Nama panggilan',
    terms: 'Saya setuju terma dan dasar privasi',
    signUp: 'Daftar',
    logIn: 'Log masuk',
    alreadyHave: 'Sudah ada akaun?',
    dontHave: 'Belum ada akaun?',
    socialLogin: 'Teruskan dengan {provider}',
    wechat: 'WeChat',
    alipay: 'Alipay',
    qq: 'QQ',
    tabEmail: 'E-mel',
    tabPhone: 'Telefon',
    invalidEmail: 'Sila masukkan e-mel yang sah',
    passwordTooShort: 'Sekurang-kurangnya 6 aksara',
    passwordWeak: 'Huruf dan nombor untuk keselamatan',
    passwordMedium: 'Sederhana',
    passwordStrong: 'Kuat',
    google: 'Google',
    invalidPhone: 'Sila masukkan nombor yang sah',
    agreeTerms: 'Sila terima terma',
    enterPhone: 'Sila masukkan nombor',
    enterEmail: 'Sila masukkan e-mel',
    enterCode: 'Sila masukkan kod',
    nicknameOptional: 'Nama paparan (pilihan)',
    phoneDemoHint: 'Demo: kod 123456',
    phoneSmsHint: 'Kod akan dihantar melalui SMS',
    socialDemo: 'Demo sahaja',
    continueWithGoogle: 'Teruskan dengan Google',
    sendCodeFailed: 'Gagal menghantar. Cuba lagi.',
    invalidCode: 'Kod tidak sah atau tamat tempoh.',
    googleRequiresSupabase: 'Google memerlukan Supabase.',
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s-]{10,}$/;

/** 将输入转为 E.164（Supabase 短信需带国家码），默认 +86 */
function normalizePhoneForE164(phone: string, defaultCountryCode = '86'): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('86') && digits.length >= 11) return '+' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+86' + digits;
  if (digits.length >= 10) return '+' + (digits.startsWith(defaultCountryCode) ? digits : defaultCountryCode + digits);
  return '+' + defaultCountryCode + digits;
}

const getPasswordStrength = (p: string): 'weak' | 'medium' | 'strong' => {
  if (!p || p.length < 6) return 'weak';
  const hasLower = /[a-z]/.test(p);
  const hasUpper = /[A-Z]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasSpecial = /[^a-zA-Z0-9]/.test(p);
  const score = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0) + (p.length >= 8 ? 1 : 0);
  if (score >= 4) return 'strong';
  if (score >= 2 || p.length >= 6) return 'medium';
  return 'weak';
};

export default function AuthModal({ onClose, onLogin, onOAuthLogin: _onOAuthLogin, language }: Props) {
  const t = { ...translations.en, ...(translations[language] || {}) };
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, _setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (loginMethod === 'phone' && !phone.trim()) {
      setError(t.enterPhone ?? 'Please enter phone number');
      return;
    }
    if (loginMethod === 'email' && !email.trim()) {
      setError(t.enterEmail ?? 'Please enter email');
      return;
    }
    setError(null);

    if (loginMethod === 'phone' && isSupabaseConnected) {
      const normalized = normalizePhoneForE164(phone.trim());
      const { error: err } = await supabase.auth.signInWithOtp({ phone: normalized });
      if (err) {
        setError(err.message || (t.sendCodeFailed ?? 'Failed to send code.'));
        return;
      }
      setCountdown(60);
      return;
    }

    setCountdown(60);
    const target = loginMethod === 'phone' ? phone : email;
    alert(`[模拟发送 / Simulation] 验证码已发送至 / Verification code sent to ${target}: 123456`);
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConnected) {
      setError(t.googleRequiresSupabase ?? 'Google login requires Supabase');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider.toLowerCase() === 'google') {
      handleGoogleLogin();
      return;
    }
    // 演示：用手机号分支在本地创建用户，避免走 Supabase 邮箱
    setIsLoading(true);
    setError(null);
    const demoPhone = `+86999${String(Date.now()).slice(-8)}`;
    const demoName = language === 'zh' ? `${provider} 用户` : `${provider} User`;
    onLogin(demoPhone, undefined, true, demoName, 'phone').then((err) => {
      setIsLoading(false);
      if (err) setError(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (loginMethod === 'email') {
      if (!EMAIL_REGEX.test(email.trim())) {
        setError(t.invalidEmail ?? 'Please enter a valid email address');
        return;
      }
      if (!password || password.length < 6) {
        setError(t.passwordTooShort ?? 'Password must be at least 6 characters');
        return;
      }
      if (isSignUp && !agreed) {
        setError(t.agreeTerms ?? 'Please agree to the terms');
        return;
      }
      setIsLoading(true);
      const err = await onLogin(email.trim(), password, isSignUp, nickname || name, 'email');
      setIsLoading(false);
      if (err) setError(err);
    } else {
      if (!PHONE_REGEX.test(phone.replace(/\s/g, ''))) {
        setError(t.invalidPhone ?? 'Please enter a valid phone number');
        return;
      }
      if (!code.trim()) {
        setError(t.enterCode ?? 'Please enter verification code');
        return;
      }
      if (isSignUp && !agreed) {
        setError(t.agreeTerms ?? 'Please agree to the terms');
        return;
      }

      if (isSupabaseConnected) {
        setIsLoading(true);
        setError(null);
        const normalized = normalizePhoneForE164(phone.trim());
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          phone: normalized,
          token: code.trim(),
          type: 'sms',
        });
        setIsLoading(false);
        if (verifyErr) {
          setError(verifyErr.message || (t.invalidCode ?? 'Invalid or expired code.'));
          return;
        }
        onClose();
        return;
      }

      if (code !== '123456') {
        setError(t.invalidCode ?? 'Invalid code (demo: 123456)');
        return;
      }
      setIsLoading(true);
      const err = await onLogin(phone, undefined, isSignUp, nickname || name, 'phone');
      setIsLoading(false);
      if (err) setError(err);
    }
  };

  const renderSocialIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'wechat':
        return (
          <svg className="w-6 h-6 text-[#07C160]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8.5 14.5c-3.5 0-6.5-2.5-6.5-5.5S5 3.5 8.5 3.5 15 6 15 9s-3 5.5-6.5 5.5zm0-9c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1zM17.5 20.5c-3 0-5.5-2-5.5-4.5s2.5-4.5 5.5-4.5 5.5 2 5.5 4.5-2.5 4.5-5.5 4.5zm0-7c-.4 0-.8.4-.8.8s.4.8.8.8.8-.4.8-.8-.4-.8-.8-.8zm2.5 0c-.4 0-.8.4-.8.8s.4.8.8.8.8-.4.8-.8-.4-.8-.8-.8z"/>
          </svg>
        );
      case 'alipay':
        return (
          <svg className="w-6 h-6 text-[#1677FF]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.5 6h16.8a.5.5 0 0 0 .2-.9l-1.6-1.6a.5.5 0 0 0-.4-.1H5.5a.5.5 0 0 0-.4.1L3.5 5.1a.5.5 0 0 0 0 .9zM12 2a.5.5 0 0 1 .5.5v2h-1v-2a.5.5 0 0 1 .5-.5zM6.5 8h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3.8c.4 1.8 1.4 3.4 2.8 4.6a.5.5 0 0 1 .1.7l-1 1.2a.5.5 0 0 1-.7.1c-1.6-1.3-2.8-3-3.4-5h-1c-.6 2-1.8 3.7-3.4 5a.5.5 0 0 1-.7-.1l-1-1.2a.5.5 0 0 1 .1-.7c1.4-1.2 2.4-2.8 2.8-4.6H6.5a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z"/>
          </svg>
        );
      case 'qq':
        return (
          <svg className="w-6 h-6 text-[#12B7F5]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm0 17.5c-1.5 0-2.8-.8-3.5-2 .5-.5 1.5-1 3.5-1s3 .5 3.5 1c-.7 1.2-2 2-3.5 2zm5.5-4c-.5.5-1.5.5-2 .5-.5 0-1 0-1.5-.5-.5-.5-.5-1.5-.5-2.5 0-1.5 1-3 4-3s4 1.5 4 3c0 1-.1 2-.5 2.5zM6.5 15.5c-.5.5-1.5.5-2 .5-.5 0-1 0-1.5-.5-.5-.5-.5-1.5-.5-2.5 0-1.5 1-3 4-3s4 1.5 4 3c0 1-.1 2-.5 2.5z"/>
          </svg>
        );
      default:
        return <span className="text-sm font-medium text-stone-700">{provider}</span>;
    }
  };

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
        className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative border border-white/20"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2 tracking-tight">
              {isSignUp ? t.createAccount : t.welcomeBack}
            </h2>
            <p className="text-stone-500 text-sm">
              {isSignUp ? t.signUpDesc : t.logInDesc}
            </p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex p-1 bg-stone-100 rounded-xl mb-6">
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                loginMethod === 'phone' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t.tabPhone}
            </button>
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                loginMethod === 'email' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t.tabEmail}
            </button>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && loginMethod === 'phone' && (
                <>
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">{t.nickname}</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                        placeholder={t.nicknameOptional ?? 'Optional display name'}
                      />
                    </div>
                  </div>
                </>
              )}

              {loginMethod === 'phone' ? (
                <>
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">{t.phone}</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="+86 138 0000 0000"
                        required
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">{t.verificationCode}</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                          placeholder="123456"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0}
                        className="px-4 py-3.5 rounded-2xl bg-stone-100 text-stone-900 font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[100px]"
                      >
                        {countdown > 0 ? `${countdown}s` : t.getCode}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-stone-400 ml-1">
                      {isSupabaseConnected ? t.phoneSmsHint : t.phoneDemoHint}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">{t.email}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">{t.password}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    {isSignUp && password.length >= 1 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              getPasswordStrength(password) === 'weak' && 'w-1/3 bg-amber-400',
                              getPasswordStrength(password) === 'medium' && 'w-2/3 bg-amber-500',
                              getPasswordStrength(password) === 'strong' && 'w-full bg-emerald-500'
                            )}
                            style={{ width: getPasswordStrength(password) === 'weak' ? '33%' : getPasswordStrength(password) === 'medium' ? '66%' : '100%' }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-stone-400">
                          {getPasswordStrength(password) === 'weak' && t.passwordWeak}
                          {getPasswordStrength(password) === 'medium' && t.passwordMedium}
                          {getPasswordStrength(password) === 'strong' && t.passwordStrong}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {isSignUp && (
                <div className="flex items-start gap-3 mt-6 px-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                    required
                  />
                  <label htmlFor="terms" className="text-xs text-stone-500 leading-relaxed cursor-pointer select-none">
                    {t.terms}
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 mt-8 active:scale-[0.98] shadow-lg shadow-stone-900/10"
              >
                {isSignUp ? t.signUp : t.logIn}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-stone-400">
                <span className="px-4 bg-white">{t.orContinue}</span>
              </div>
            </div>

            <div className="space-y-3">
              {isSupabaseConnected && (
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl border-2 border-stone-200 font-medium text-stone-700 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t.continueWithGoogle}
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">{t.socialDemo}</span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('WeChat')}
                className="flex flex-col items-center justify-center py-3 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all gap-2 group"
              >
                <div className="group-hover:scale-110 transition-transform">
                  {renderSocialIcon('wechat')}
                </div>
                <span className="text-xs font-medium text-stone-600">{t.wechat}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('Alipay')}
                className="flex flex-col items-center justify-center py-3 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all gap-2 group"
              >
                <div className="group-hover:scale-110 transition-transform">
                  {renderSocialIcon('alipay')}
                </div>
                <span className="text-xs font-medium text-stone-600">{t.alipay}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialLogin('QQ')}
                className="flex flex-col items-center justify-center py-3 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all gap-2 group"
              >
                <div className="group-hover:scale-110 transition-transform">
                  {renderSocialIcon('qq')}
                </div>
                <span className="text-xs font-medium text-stone-600">{t.qq}</span>
              </button>
            </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-stone-500">
                {isSignUp ? t.alreadyHave : t.dontHave}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-stone-900 font-bold hover:underline underline-offset-4"
                >
                  {isSignUp ? t.logIn : t.signUp}
                </button>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
