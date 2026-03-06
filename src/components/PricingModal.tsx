import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Crown, Zap, X, CreditCard, ArrowLeft, ArrowRight, Wallet, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { SeaOtterLogo } from './SeaOtterLogo';
import { UserLevel } from '../App';
import { CountryConfig } from '../config/countries';

interface Props {
  onClose: () => void;
  onBuyCredits: (amount: number) => void;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  language: string;
  countryConfig: CountryConfig;
}

const translations: Record<string, any> = {
  en: {
    title: "Upgrade Your Experience",
    subtitle: "Choose a plan that fits your needs. Keep your memories longer and create without limits.",
    free: "Free",
    vip: "VIP",
    credits: "Credits",
    buyCredits: "Buy Credits",
    freeDesc: "Basic features for casual users",
    vipDesc: "Permanent storage for your memories",
    month: "month",
    subscribe: "Subscribe Now",
    current: "Current Plan",
    maybeLater: "Maybe later",
    selectPayment: "Select Payment Method",
    purchasing: "Processing",
    creditCard: "Credit Card",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    backToPlans: "Back to plans",
    unit: "Cards",
    flexible: "Flexible",
    starter: "Starter",
    popular: "🔥 Most Popular",
    bestValue: "💎 Best Value",
    save: "Save",
    features: {
      storage14: "14 days image storage",
      storagePerm: "Permanent image storage",
      aiGen: "AI generation (requires credits)",
      global: "Global delivery styles",
      support: "Priority support",
      batch: "Batch download & management",
      noWatermark: "High-quality downloads",
      exclusive: "Exclusive VIP badge"
    }
  },
  zh: {
    title: "升级您的体验",
    subtitle: "选择适合您的方案。更久地保存您的回忆。",
    free: "普通用户",
    vip: "VIP 用户",
    credits: "积分",
    buyCredits: "购买积分",
    freeDesc: "适合偶尔使用的基础功能",
    vipDesc: "图片永久保存，珍藏回忆",
    month: "月",
    subscribe: "立即订阅",
    current: "当前方案",
    maybeLater: "以后再说",
    selectPayment: "选择支付方式",
    purchasing: "正在处理",
    creditCard: "信用卡",
    alipay: "支付宝",
    wechat: "微信支付",
    backToPlans: "返回方案",
    unit: "张",
    flexible: "灵活试用",
    starter: "入门尝鲜",
    popular: "🔥 最受欢迎",
    bestValue: "💎 超值首选",
    save: "节省",
    features: {
      storage14: "图片保存 14 天",
      storagePerm: "图片永久保存",
      aiGen: "AI 智能生成 (需消耗积分)",
      global: "全球风格模板",
      support: "优先客户支持",
      batch: "批量下载与管理",
      noWatermark: "高清无水印下载",
      exclusive: "专属会员标识"
    }
  },
  ja: {
    title: "体験をアップグレード",
    subtitle: "ニーズに合ったプランをお選びください。思い出を長く保存し、無制限に作成できます。",
    payAsYouGo: "従量課金",
    payAsYouGoDesc: "たまに使用するのに最適",
    credits: "クレジット",
    buyCredits: "クレジットを購入",
    proMember: "Proメンバー",
    proDesc: "ヘビーユーザー向け",
    month: "月",
    subscribePro: "Proを購読",
    superMember: "Superメンバー",
    superDesc: "コレクター＆プロ向け",
    subscribeSuper: "Superを購読",
    popular: "人気",
    maybeLater: "後で",
    backToPlans: "プランに戻る",
    selectPayment: "お支払い方法を選択",
    purchasing: "購入中",
    subscribingTo: "購読中",
    creditCard: "クレジットカード",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50回のAI生成",
      hist3d: "3日間の履歴保持",
      watermarked: "透かしあり",
      unlimited: "無制限の生成",
      hist3m: "3ヶ月の履歴保持",
      noWatermark: "透かしなし",
      histPerm: "永久的な履歴保持",
      priority: "優先サポート"
    }
  },
  ko: {
    title: "경험 업그레이드",
    subtitle: "필요에 맞는 플랜을 선택하세요. 추억을 더 오래 보존하고 제한 없이 만드세요.",
    payAsYouGo: "사용한 만큼 지불",
    payAsYouGoDesc: "가끔 사용하기에 적합",
    credits: "크레딧",
    buyCredits: "크레딧 구매",
    proMember: "Pro 회원",
    proDesc: "헤비 유저용",
    month: "월",
    subscribePro: "Pro 구독",
    superMember: "Super 회원",
    superDesc: "수집가 및 전문가용",
    subscribeSuper: "Super 구독",
    popular: "인기",
    maybeLater: "나중에",
    backToPlans: "플랜으로 돌아가기",
    selectPayment: "결제 수단 선택",
    purchasing: "구매 중",
    subscribingTo: "구독 중",
    creditCard: "신용카드",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50회 AI 생성",
      hist3d: "3일 기록 유지",
      watermarked: "워터마크 있음",
      unlimited: "무제한 생성",
      hist3m: "3개월 기록 유지",
      noWatermark: "워터마크 없음",
      histPerm: "영구 기록 유지",
      priority: "우선 지원"
    }
  },
  fr: {
    title: "Améliorez votre expérience",
    subtitle: "Choisissez le plan qui correspond le mieux à vos besoins. Conservez vos souvenirs plus longtemps et créez sans limites.",
    payAsYouGo: "Paiement à l'utilisation",
    payAsYouGoDesc: "Parfait pour un usage occasionnel",
    credits: "crédits",
    buyCredits: "Acheter des crédits",
    proMember: "Membre Pro",
    proDesc: "Pour les utilisateurs intensifs",
    month: "mois",
    subscribePro: "S'abonner Pro",
    superMember: "Membre Super",
    superDesc: "Pour les collectionneurs et les professionnels",
    subscribeSuper: "S'abonner Super",
    popular: "POPULAIRE",
    maybeLater: "Peut-être plus tard",
    backToPlans: "Retour aux plans",
    selectPayment: "Sélectionner le mode de paiement",
    purchasing: "Achat de",
    subscribingTo: "Abonnement à",
    creditCard: "Carte de crédit",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 Générations IA",
      hist3d: "Conservation de l'historique 3 jours",
      watermarked: "Filigrané",
      unlimited: "Générations illimitées",
      hist3m: "Conservation de l'historique 3 mois",
      noWatermark: "Pas de filigrane",
      histPerm: "Conservation permanente de l'historique",
      priority: "Support prioritaire"
    }
  },
  es: {
    title: "Mejora tu experiencia",
    subtitle: "Elige el plan que mejor se adapte a tus necesidades. Conserva tus recuerdos por más tiempo y crea sin límites.",
    payAsYouGo: "Pago por uso",
    payAsYouGoDesc: "Perfecto para uso ocasional",
    credits: "créditos",
    buyCredits: "Comprar créditos",
    proMember: "Miembro Pro",
    proDesc: "Para usuarios intensivos",
    month: "mes",
    subscribePro: "Suscribirse Pro",
    superMember: "Miembro Super",
    superDesc: "Para coleccionistas y profesionales",
    subscribeSuper: "Suscribirse Super",
    popular: "POPULAR",
    maybeLater: "Quizás más tarde",
    backToPlans: "Volver a los planes",
    selectPayment: "Seleccionar método de pago",
    purchasing: "Comprando",
    subscribingTo: "Suscribiéndose a",
    creditCard: "Tarjeta de crédito",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 Generaciones IA",
      hist3d: "Retención de historial de 3 días",
      watermarked: "Con marca de agua",
      unlimited: "Generaciones ilimitadas",
      hist3m: "Retención de historial de 3 meses",
      noWatermark: "Sin marca de agua",
      histPerm: "Retención de historial permanente",
      priority: "Soporte prioritario"
    }
  },
  de: {
    title: "Verbessern Sie Ihr Erlebnis",
    subtitle: "Wählen Sie den Plan, der am besten zu Ihnen passt. Behalten Sie Ihre Erinnerungen länger und erstellen Sie ohne Grenzen.",
    payAsYouGo: "Pay-as-you-go",
    payAsYouGoDesc: "Perfekt für gelegentliche Nutzung",
    credits: "Credits",
    buyCredits: "Credits kaufen",
    proMember: "Pro-Mitglied",
    proDesc: "Für Power-User",
    month: "Monat",
    subscribePro: "Pro abonnieren",
    superMember: "Super-Mitglied",
    superDesc: "Für Sammler & Profis",
    subscribeSuper: "Super abonnieren",
    popular: "BELIEBT",
    maybeLater: "Vielleicht später",
    backToPlans: "Zurück zu den Plänen",
    selectPayment: "Zahlungsmethode auswählen",
    purchasing: "Kauf von",
    subscribingTo: "Abonnieren von",
    creditCard: "Kreditkarte",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 KI-Generationen",
      hist3d: "3 Tage Historienaufbewahrung",
      watermarked: "Mit Wasserzeichen",
      unlimited: "Unbegrenzte Generationen",
      hist3m: "3 Monate Historienaufbewahrung",
      noWatermark: "Keine Wasserzeichen",
      histPerm: "Dauerhafte Historienaufbewahrung",
      priority: "Prioritäts-Support"
    }
  },
  it: {
    title: "Migliora la tua esperienza",
    subtitle: "Scegli il piano più adatto alle tue esigenze. Conserva i tuoi ricordi più a lungo e crea senza limiti.",
    payAsYouGo: "Consumo",
    payAsYouGoDesc: "Perfetto per un uso occasionale",
    credits: "crediti",
    buyCredits: "Acquista Crediti",
    proMember: "Membro Pro",
    proDesc: "Per utenti esperti",
    month: "mese",
    subscribePro: "Abbonati Pro",
    superMember: "Membro Super",
    superDesc: "Per collezionisti e professionisti",
    subscribeSuper: "Abbonati Super",
    popular: "POPOLARE",
    maybeLater: "Forse più tardi",
    backToPlans: "Torna ai piani",
    selectPayment: "Seleziona metodo di pagamento",
    purchasing: "Acquisto",
    subscribingTo: "Abbonamento a",
    creditCard: "Carta di Credito",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 Generazioni IA",
      hist3d: "Conservazione cronologia 3 giorni",
      watermarked: "Con filigrana",
      unlimited: "Generazioni illimitate",
      hist3m: "Conservazione cronologia 3 mesi",
      noWatermark: "Nessuna filigrana",
      histPerm: "Conservazione cronologia permanente",
      priority: "Supporto prioritario"
    }
  },
  id: {
    title: "Tingkatkan pengalaman Anda",
    subtitle: "Pilih paket yang paling sesuai dengan kebutuhan Anda. Simpan kenangan Anda lebih lama dan buat tanpa batas.",
    payAsYouGo: "Bayar sesuai penggunaan",
    payAsYouGoDesc: "Sempurna untuk penggunaan sesekali",
    credits: "kredit",
    buyCredits: "Beli Kredit",
    proMember: "Anggota Pro",
    proDesc: "Untuk pengguna berat",
    month: "bulan",
    subscribePro: "Berlangganan Pro",
    superMember: "Anggota Super",
    superDesc: "Untuk kolektor & profesional",
    subscribeSuper: "Berlangganan Super",
    popular: "POPULER",
    maybeLater: "Mungkin nanti",
    backToPlans: "Kembali ke paket",
    selectPayment: "Pilih Metode Pembayaran",
    purchasing: "Membeli",
    subscribingTo: "Berlangganan",
    creditCard: "Kartu Kredit",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 Generasi AI",
      hist3d: "Penyimpanan Riwayat 3 Hari",
      watermarked: "Bercap air",
      unlimited: "Generasi Tanpa Batas",
      hist3m: "Penyimpanan Riwayat 3 Bulan",
      noWatermark: "Tanpa Cap Air",
      histPerm: "Penyimpanan Riwayat Permanen",
      priority: "Dukungan Prioritas"
    }
  },
  th: {
    title: "อัปเกรดประสบการณ์ของคุณ",
    subtitle: "เลือกแผนที่เหมาะกับความต้องการของคุณมากที่สุด เก็บความทรงจำของคุณไว้นานขึ้นและสร้างสรรค์อย่างไร้ขีดจำกัด",
    payAsYouGo: "จ่ายตามการใช้งาน",
    payAsYouGoDesc: "เหมาะสำหรับการใช้งานเป็นครั้งคราว",
    credits: "เครดิต",
    buyCredits: "ซื้อเครดิต",
    proMember: "สมาชิก Pro",
    proDesc: "สำหรับผู้ใช้งานหนัก",
    month: "เดือน",
    subscribePro: "สมัคร Pro",
    superMember: "สมาชิก Super",
    superDesc: "สำหรับนักสะสมและมืออาชีพ",
    subscribeSuper: "สมัคร Super",
    popular: "ยอดนิยม",
    maybeLater: "ไว้ทีหลัง",
    backToPlans: "กลับไปที่แผน",
    selectPayment: "เลือกวิธีการชำระเงิน",
    purchasing: "กำลังซื้อ",
    subscribingTo: "กำลังสมัคร",
    creditCard: "บัตรเครดิต",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 การสร้าง AI",
      hist3d: "เก็บประวัติ 3 วัน",
      watermarked: "มีลายน้ำ",
      unlimited: "สร้างไม่จำกัด",
      hist3m: "เก็บประวัติ 3 เดือน",
      noWatermark: "ไม่มีลายน้ำ",
      histPerm: "เก็บประวัติถาวร",
      priority: "การสนับสนุนลำดับความสำคัญ"
    }
  },
  vi: {
    title: "Nâng cấp trải nghiệm của bạn",
    subtitle: "Chọn gói phù hợp nhất với nhu cầu của bạn. Giữ những kỷ niệm của bạn lâu hơn và sáng tạo không giới hạn.",
    payAsYouGo: "Trả tiền theo mức sử dụng",
    payAsYouGoDesc: "Hoàn hảo cho việc sử dụng thỉnh thoảng",
    credits: "tín dụng",
    buyCredits: "Mua Tín dụng",
    proMember: "Thành viên Pro",
    proDesc: "Dành cho người dùng nhiều",
    month: "tháng",
    subscribePro: "Đăng ký Pro",
    superMember: "Thành viên Super",
    superDesc: "Dành cho nhà sưu tập & chuyên gia",
    subscribeSuper: "Đăng ký Super",
    popular: "PHỔ BIẾN",
    maybeLater: "Để sau",
    backToPlans: "Quay lại các gói",
    selectPayment: "Chọn phương thức thanh toán",
    purchasing: "Đang mua",
    subscribingTo: "Đang đăng ký",
    creditCard: "Thẻ tín dụng",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 Lần tạo AI",
      hist3d: "Lưu giữ lịch sử 3 ngày",
      watermarked: "Có hình mờ",
      unlimited: "Tạo không giới hạn",
      hist3m: "Lưu giữ lịch sử 3 tháng",
      noWatermark: "Không có hình mờ",
      histPerm: "Lưu giữ lịch sử vĩnh viễn",
      priority: "Hỗ trợ ưu tiên"
    }
  },
  ms: {
    title: "Tingkatkan pengalaman anda",
    subtitle: "Pilih pelan yang paling sesuai dengan keperluan anda. Simpan kenangan anda lebih lama dan cipta tanpa had.",
    payAsYouGo: "Bayar semasa anda guna",
    payAsYouGoDesc: "Sempurna untuk kegunaan sekali-sekala",
    credits: "kredit",
    buyCredits: "Beli Kredit",
    proMember: "Ahli Pro",
    proDesc: "Untuk pengguna tegar",
    month: "bulan",
    subscribePro: "Langgan Pro",
    superMember: "Ahli Super",
    superDesc: "Untuk pengumpul & profesional",
    subscribeSuper: "Langgan Super",
    popular: "POPULAR",
    maybeLater: "Mungkin nanti",
    backToPlans: "Kembali ke pelan",
    selectPayment: "Pilih Kaedah Pembayaran",
    purchasing: "Membeli",
    subscribingTo: "Melanggan",
    creditCard: "Kad Kredit",
    alipay: "Alipay",
    wechat: "WeChat Pay",
    features: {
      gen50: "50 Penjanaan AI",
      hist3d: "Pengekalan Sejarah 3 Hari",
      watermarked: "Beraik",
      unlimited: "Penjanaan Tanpa Had",
      hist3m: "Pengekalan Sejarah 3 Bulan",
      noWatermark: "Tiada Tera Air",
      histPerm: "Pengekalan Sejarah Kekal",
      priority: "Sokongan Keutamaan"
    }
  }
};

export default function PricingModal({ onClose, onBuyCredits, isLoggedIn, onRequireLogin, language, countryConfig }: Props) {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'subscription' | 'credits'>('credits');
  const [selectedPlan, setSelectedPlan] = useState<UserLevel | number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const handleSubscribe = (level: UserLevel) => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    setSelectedPlan(level);
    setShowPayment(true);
  };

  const handleBuyCredits = (amount: number) => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    setSelectedPlan(amount);
    setShowPayment(true);
  };

  const confirmPurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPayment(false);
      if (typeof selectedPlan === 'number') {
        onBuyCredits(selectedPlan);
      }
      onClose();
    }, 2000);
  };

  const creditPacks = countryConfig.pricing.packs;

  const plans = [
    {
      id: 'free' as UserLevel,
      name: t.free,
      price: "0",
      desc: t.freeDesc,
      icon: Zap,
      color: "text-stone-500",
      bgColor: "bg-stone-50",
      features: [t.features.storage14, t.features.aiGen, t.features.global]
    },
    {
      id: 'vip' as UserLevel,
      name: t.vip,
      price: countryConfig.pricing.vip,
      desc: t.vipDesc,
      icon: Crown,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      features: [t.features.storagePerm, t.features.aiGen, t.features.batch, t.features.noWatermark, t.features.support],
      popular: true
    }
  ];

  const renderPaymentIcon = (provider: string) => {
    if (provider.includes('Card')) return <CreditCard className="w-5 h-5" />;
    if (provider.includes('Alipay')) return <Wallet className="w-5 h-5 text-blue-500" />;
    if (provider.includes('WeChat')) return <Smartphone className="w-5 h-5 text-green-500" />;
    return <Wallet className="w-5 h-5" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side - Plans */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[90vh]">
            {!showPayment ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-stone-900 mb-3">{t.title}</h2>
                  <p className="text-stone-500">{t.subtitle}</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-stone-100 rounded-xl mb-8 w-fit">
                  <button
                    onClick={() => setActiveTab('credits')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                      activeTab === 'credits' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {t.buyCredits}
                  </button>
                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                      activeTab === 'subscription' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {t.subscribe}
                  </button>
                </div>

                {activeTab === 'credits' ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {creditPacks.map((pack) => (
                      <button
                        key={pack.amount}
                        onClick={() => handleBuyCredits(pack.amount)}
                        className={cn(
                          "relative p-6 rounded-2xl border-2 transition-all text-center group flex flex-col",
                          pack.popular ? "border-amber-200 bg-amber-50/30" : "border-stone-100 bg-white hover:border-stone-200"
                        )}
                      >
                        {pack.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase whitespace-nowrap">
                            {t.popular}
                          </div>
                        )}
                        <div className="text-stone-400 text-xs font-bold mb-1 uppercase tracking-wider">{pack.amount}{t.unit}</div>
                        <div className="text-3xl font-black text-stone-900 mb-2">{countryConfig.currency.symbol}{pack.price}</div>
                        <div className="text-[10px] text-stone-500 mb-4">
                          {pack.save && `${t.save} ${pack.save}`}
                          {!pack.save && "—"}
                        </div>
                        <div className="text-xs text-stone-600 mb-4 font-medium">{pack.label}</div>
                        <div className="mt-auto py-2 rounded-lg bg-stone-900 text-white text-xs font-bold group-hover:bg-stone-800 transition-colors">
                          {t.buyCredits}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                      <div 
                        key={plan.id}
                        className={cn(
                          "relative p-6 rounded-2xl border-2 transition-all flex flex-col",
                          plan.popular ? "border-amber-200 bg-amber-50/30" : "border-stone-100 bg-white"
                        )}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                            POPULAR
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn("p-2 rounded-xl", plan.bgColor)}>
                            <plan.icon className={cn("w-5 h-5", plan.color)} />
                          </div>
                          <div>
                            <h3 className="font-bold text-stone-900">{plan.name}</h3>
                            <p className="text-xs text-stone-500">{plan.desc}</p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-stone-900">{countryConfig.currency.symbol}{plan.price}</span>
                            {plan.price !== "0" && <span className="text-stone-400 text-sm">/{t.month}</span>}
                          </div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-stone-600 leading-relaxed">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={plan.id === 'free'}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold transition-all",
                            plan.id === 'free' 
                              ? "bg-stone-100 text-stone-400 cursor-default" 
                              : "bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
                          )}
                        >
                          {plan.id === 'free' ? t.current : t.subscribe}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={onClose}
                  className="mt-8 text-stone-400 text-sm hover:text-stone-600 transition-colors w-full text-center"
                >
                  {t.maybeLater}
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col">
                <button 
                  onClick={() => setShowPayment(false)}
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-8 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'zh' ? '返回方案' : 'Back to plans'}
                </button>

                <h2 className="text-2xl font-bold text-stone-900 mb-2">{t.selectPayment}</h2>
                <p className="text-stone-500 mb-8">
                  {language === 'zh' 
                    ? `购买 ${typeof selectedPlan === 'number' ? `${selectedPlan} 张额度` : (selectedPlan === 'vip' ? 'VIP 用户' : selectedPlan)}` 
                    : `Purchasing ${typeof selectedPlan === 'number' ? `${selectedPlan} Credits` : selectedPlan}`}
                </p>

                <div className="space-y-3 mb-10">
                  {countryConfig.payment.map((provider) => (
                    <button
                      key={provider}
                      onClick={confirmPurchase}
                      disabled={isProcessing}
                      className="w-full p-4 rounded-2xl border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center">
                          {renderPaymentIcon(provider)}
                        </div>
                        <span className="font-medium text-stone-900">
                          {provider === 'Credit/Debit Card' ? t.creditCard : 
                           provider === 'Alipay' ? t.alipay : 
                           provider === 'WeChat Pay' ? t.wechat : provider}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 transition-colors" />
                    </button>
                  ))}
                </div>

                {isProcessing && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
                    <p className="text-stone-500 text-sm font-medium">{t.purchasing}...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Visual */}
          <div className="hidden md:block w-72 bg-stone-50 p-12 border-l border-stone-100">
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 rotate-3">
                <SeaOtterLogo className="w-12 h-12 text-stone-900" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-4">
                {language === 'zh' ? '海獭邮局' : 'Sea Otter Post'}
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {language === 'zh' 
                  ? '加入我们的会员，解锁更多专属功能，让您的回忆永不褪色。' 
                  : 'Join our membership to unlock exclusive features and keep your memories forever.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
