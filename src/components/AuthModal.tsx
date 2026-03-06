import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, X, ArrowRight, Smartphone, User as UserIcon } from 'lucide-react';
import { CountryConfig } from '../config/countries';

interface Props {
  onClose: () => void;
  onLogin: (identifier: string, password?: string, isSignUp?: boolean, name?: string, type?: 'email' | 'phone') => void;
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
  },
  // ... (keep other languages, default to English for missing keys)
};

export default function AuthModal({ onClose, onLogin, language }: Props) {
  const t = translations[language] || translations.en;
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = () => {
    if (loginMethod === 'phone' && !phone) {
      alert('请输入手机号码 / Please enter phone number');
      return;
    }
    if (loginMethod === 'email' && !email) {
      alert('请输入邮箱 / Please enter email');
      return;
    }
    setCountdown(60);
    const target = loginMethod === 'phone' ? phone : email;
    alert(`[模拟发送 / Simulation] 验证码已发送至 / Verification code sent to ${target}: 123456`);
  };

  const handleSocialLogin = (provider: string) => {
    // Simulation for demo
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const mockEmail = `user_${provider}_${Date.now()}@example.com`;
      const mockName = `${provider} User`;
      onLogin(mockEmail, undefined, false, mockName, 'email');
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !agreed) {
      alert(t.terms || 'Please agree to the terms');
      return;
    }
    
    if (loginMethod === 'email') {
      if (email && password) {
        onLogin(email, password, isSignUp, nickname || name, 'email');
      }
    } else {
      if (phone && code) {
        if (code !== '123456') {
          alert('验证码错误 / Invalid verification code (Try 123456)');
          return;
        }
        onLogin(phone, undefined, isSignUp, nickname || name, 'phone');
      }
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
              {isSignUp && (
                <>
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">真实姓名 / Real Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="张三 / John Doe"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-[11px] uppercase tracking-wider font-bold text-stone-400 mb-1.5 ml-1">昵称 / Nickname</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5 outline-none transition-all bg-stone-50/50 focus:bg-white"
                        placeholder="海獭爱好者 / Otter Lover"
                        required={isSignUp}
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
                  </div>
                </>
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
