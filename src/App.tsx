import { useState, useEffect } from 'react';
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
  email?: string;
  phoneNumber?: string;
  name?: string; // Real name for shipping
  nickname?: string; // Display name
  avatar?: string;
  level: UserLevel;
  credits: number;
  password?: string;
  createdAt?: number;
  addresses: Address[];
  role?: 'admin' | 'user';
  generatedCount?: number;
};

export type SettingsType = {
  layout: 'classic' | 'modern' | 'minimal';
  font: 'handwritten' | 'serif' | 'sans';
  showDate: boolean;
  showLocation: boolean;
  showWeather: boolean;
  filter: 'none' | 'vintage' | 'bw' | 'warm';
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
  date: string;
  location: string;
  weather: string;
  size: 'standard' | 'large' | 'custom' | 'square' | '3.5x5.5' | '4x6' | '4.1x5.8' | '4.1x5.9' | '4.7x6.7' | '5x7' | '5.8x8.3';
  customWidth?: number;
  customHeight?: number;
  fill: 'fill' | 'border' | 'bottom-border';
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
};

export const defaultSettings: SettingsType = { // Exported
  layout: 'classic',
  font: 'handwritten',
  showDate: true,
  showLocation: true,
  showWeather: true,
  filter: 'none',
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
  date: '',
  location: '',
  weather: '',
  size: '4x6',
  fill: 'border'
};

const steps = [
  { id: 1, title: 'Upload' },
  { id: 2, title: 'Configure' },
  { id: 3, title: 'Process' }
];

const translations: Record<string, any> = {
    en: {
    badge: 'Sea Otter Post Office',
    credits: 'Credits',
    upgrade: 'Upgrade',
    history: 'History',
    login: 'Log In',
    admin: 'Admin',
  },
  zh: {
    badge: '海獭邮局',
    credits: '积分',
    upgrade: '升级',
    history: '历史',
    login: '登录',
    admin: '管理',
  },
  ja: {
    badge: 'ラッコ郵便局',
    credits: 'クレジット',
    upgrade: 'アップグレード',
    history: '履歴',
    login: 'ログイン',
    admin: '管理',
  },
  ko: {
    badge: '해달 우체국',
    credits: '크레딧',
    upgrade: '업그레이드',
    history: '기록',
    login: '로그인',
    admin: '관리',
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
        return { ...parsed, credits: 0 };
      }
      return parsed;
    }
    return { isLoggedIn: false, level: 'free', credits: 0, addresses: [] };
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
  // 从 Supabase 会话同步用户信息
  const syncUserFromSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser({ isLoggedIn: false, level: 'free', credits: 0, addresses: [] });
      return;
    }
    const sUser = session.user;
    setUser(prev => ({
      ...prev,
      isLoggedIn: true,
      email: sUser.email || prev.email,
      nickname: prev.nickname || (sUser.email ? sUser.email.split('@')[0] : undefined),
      level: prev.level || 'free',
      credits: typeof prev.credits === 'number' ? prev.credits : 3,
      addresses: prev.addresses || [],
      createdAt: prev.createdAt || Date.now(),
      role: prev.role || 'user',
    }));
  };

  // 组件挂载时，初始化 Supabase 会话 & 监听 Auth 状态变更
  useEffect(() => {
    syncUserFromSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      syncUserFromSupabase();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadHistory().then(savedHistory => {
      setHistory(savedHistory);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveHistory(history);
    }
  }, [history, isLoaded]);

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

  const handleLogin = (identifier: string, password?: string, isSignUp?: boolean, name?: string, type: 'email' | 'phone' = 'email') => {
    const role = identifier === 'admin@seaotter.com' ? 'admin' : 'user';
    if (isSignUp) {
      // Check if user already exists
      if (allUsers.find(u => (type === 'email' ? u.email === identifier : u.phoneNumber === identifier))) {
        alert('User already exists');
        return;
      }
      const newUser: User = {
        isLoggedIn: true,
        [type === 'email' ? 'email' : 'phoneNumber']: identifier,
        nickname: name || identifier.split('@')[0],
        password,
        level: 'free',
        credits: 3, // Reduced from 5 to 3 due to $0.08 cost
        createdAt: Date.now(),
        addresses: [],
        role
      };
      setAllUsers(prev => [...prev, newUser]);
      setUser(newUser);
      alert('Registration successful! Welcome to 海獭邮局.');
    } else {
      // Login logic
      const existingUser = allUsers.find(u => (type === 'email' ? u.email === identifier : u.phoneNumber === identifier));
      if (existingUser) {
        if (password && existingUser.password !== password) {
          alert('Incorrect password');
          return;
        }
        // Force update role if it's the admin email
        const updatedRole = identifier === 'admin@seaotter.com' ? 'admin' : (existingUser.role || 'user');
        setUser({ ...existingUser, isLoggedIn: true, addresses: existingUser.addresses || [], role: updatedRole });
      } else {
        // Auto-register for demo if social/code login
        if (!password) {
          const newUser: User = {
            isLoggedIn: true,
            [type === 'email' ? 'email' : 'phoneNumber']: identifier,
            nickname: name || identifier,
            level: 'free',
            credits: 3, // Reduced from 5 to 3 due to $0.08 cost
            createdAt: Date.now(),
            addresses: [],
            role
          };
          setAllUsers(prev => [...prev, newUser]);
          setUser(newUser);
        } else {
          alert('User not found. Please sign up first.');
          return;
        }
      }
    }
    setShowAuth(false);
    setShowLanding(false);
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, level: 'free', credits: 5, addresses: [] });
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
    setConfigGroups(prev => {
      const index = prev.findIndex(g => g.id === group.id);
      if (index >= 0) {
        const newGroups = [...prev];
        newGroups[index] = group;
        return newGroups;
      }
      return [...prev, group];
    });
    handleNext();
  };

  const tHeader = translations[language] || translations.en;

  if (isAdmin) {
    return <AdminPanel onBack={() => setIsAdmin(false)} users={allUsers} />;
  }

  const showDebug = true; // 临时始终显示，便于排查 Supabase 连接状态

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      {showDebug && (
        <div className="fixed bottom-4 right-4 z-[200] px-4 py-2 rounded-xl shadow-lg text-sm font-bold bg-stone-900 text-white">
          Supabase: {isSupabaseConnected ? '✅ 已连接' : '❌ 未连接'}
        </div>
      )}
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
                    {step.title}
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
                className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 text-[10px] sm:text-xs xl:text-sm font-medium hover:border-stone-300 transition-all"
              >
                <Globe2 className="w-3 h-3 sm:w-4 sm:h-4 text-stone-400" />
                <span className="hidden xs:inline">{countryConfig.nativeCountry} ({countryConfig.nativeLanguage})</span>
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
                    {user.credits} <span className="hidden xs:inline">{tHeader.credits}</span>
                  </div>
                  {!user.isLoggedIn && (
                    <span className="text-[9px] text-indigo-500 font-bold mt-0.5 animate-pulse">登录领3积分</span>
                  )}
                </div>
                <button
                  onClick={() => setShowPricing(true)}
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
                  className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap"
                >
                  <History className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tHeader.history}</span>
                </button>
                <button
                  onClick={() => setShowProfile(true)}
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
                    className="flex items-center gap-1 text-[10px] sm:text-xs xl:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap mr-2"
                  >
                    <History className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{tHeader.history}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAuth(true)}
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
              setUser(prev => ({ ...prev, credits: prev.credits + amount }));
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
    </div>
  );
}
