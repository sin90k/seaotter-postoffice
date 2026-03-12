import { motion } from 'motion/react';
import { ArrowRight, Image as ImageIcon, Globe2, Sparkles, Heart, MessageSquare, ChevronDown } from 'lucide-react';
import { SeaOtterLogo } from './SeaOtterLogo';
import { cn } from '../lib/utils';
import { CountryConfig, countriesConfig } from '../config/countries';
import { useState } from 'react';

interface Props {
  onStart: () => void;
  language: string;
  countryConfig: CountryConfig;
  onCountryChange: (config: CountryConfig) => void;
  onFeedback: () => void;
}

const translations: Record<string, any> = {
  en: {
    badge: "Sea Otter Post Office",
    title1: "Mail your moments to ",
    title2: "the future",
    subtitle: "Let the sea otter postman turn your precious photos into beautiful postcards. We deliver your memories with care and love.",
    startBtn: "Start Sending",
    featuresTitle: "Special Delivery Service",
    featuresSubtitle: "Crafted with love by our sea otter team.",
    feature1Title: "Smart Formatting",
    feature1Desc: "Our otters carefully crop your photos to fit standard postcard sizes perfectly.",
    feature2Title: "Heartfelt Messages",
    feature2Desc: "We help you write the perfect message to capture the feeling of the moment.",
    feature3Title: "Global Delivery",
    feature3Desc: "Styles and themes from around the world, delivered to your digital mailbox.",
    showcaseTitle: "Otter's Gallery",
    showcaseSubtitle: "See the beautiful memories our post office has handled.",
    tryBtn: "Visit the Post Office",
    ctaTitle: "Ready to send your first card?",
    ctaSubtitle: "The sea otter postman is waiting for your photos.",
    ctaBtn: "Open Post Office",
    rights: "All rights reserved.",
    navFeatures: "Features",
    navGallery: "Gallery",
    navPricing: "Pricing",
    navAbout: "About"
  },
  zh: {
    badge: "海獭邮局",
    title1: "为您以此刻，",
    title2: "寄往未来",
    subtitle: "让海獭邮递员为您将珍贵的照片变成精美的明信片。我们会用爱心和关怀传递您的每一份回忆。",
    startBtn: "开始寄信",
    featuresTitle: "海獭特快专递",
    featuresSubtitle: "由我们的海獭团队精心打造。",
    feature1Title: "智能裁剪",
    feature1Desc: "海獭们会小心地裁剪您的照片，使其完美适配明信片尺寸。",
    feature2Title: "温情寄语",
    feature2Desc: "我们帮您写下最完美的留言，捕捉当下的感动。",
    feature3Title: "环球风格",
    feature3Desc: "来自世界各地的风格和主题，投递到您的数字邮箱。",
    showcaseTitle: "海獭画廊",
    showcaseSubtitle: "看看邮局处理过的美好回忆。",
    tryBtn: "参观邮局",
    ctaTitle: "准备好寄出第一张明信片了吗？",
    ctaSubtitle: "海獭邮递员正在等待您的照片。",
    ctaBtn: "进入邮局",
    rights: "版权所有。",
    navFeatures: "功能介绍",
    navGallery: "精选画廊",
    navPricing: "会员方案",
    navAbout: "关于我们"
  },
  // ... (keep other languages as fallback or update if needed, for now focusing on ZH/EN as requested)
  ja: {
    badge: "ラッコ郵便局",
    title1: "思い出を",
    title2: "未来へ届けよう",
    subtitle: "ラッコの郵便屋さんが、あなたの大切な写真を素敵なポストカードに変えてくれます。愛を込めてお届けします。",
    startBtn: "手紙を送る",
    featuresTitle: "ラッコの特別便",
    featuresSubtitle: "ラッコチームが心を込めて作ります。",
    feature1Title: "スマートクロッピング",
    feature1Desc: "写真をポストカードサイズにぴったり合うように丁寧に調整します。",
    feature2Title: "心温まるメッセージ",
    feature2Desc: "その瞬間の気持ちを捉えた完璧なメッセージ作りをお手伝いします。",
    feature3Title: "グローバルスタイル",
    feature3Desc: "世界中のスタイルとテーマで、あなたの思い出を彩ります。",
    showcaseTitle: "ラッコギャラリー",
    showcaseSubtitle: "郵便局が扱った美しい思い出をご覧ください。",
    tryBtn: "郵便局へ行く",
    ctaTitle: "最初のカードを送る準備はできましたか？",
    ctaSubtitle: "ラッコの郵便屋さんがあなたの写真を待っています。",
    ctaBtn: "郵便局を開く",
    rights: "全著作権所有。"
  },
  ko: {
    badge: "해달 우체국",
    title1: "당신의 추억을",
    title2: "미래로 보내세요",
    subtitle: "해달 우체부가 당신의 소중한 사진을 아름다운 엽서로 만들어 드립니다. 사랑과 정성을 담아 추억을 배달합니다.",
    startBtn: "편지 보내기",
    featuresTitle: "해달 특급 배송",
    featuresSubtitle: "해달 팀이 정성을 다해 만듭니다.",
    feature1Title: "스마트 포맷팅",
    feature1Desc: "사진을 엽서 크기에 딱 맞게 조심스럽게 다듬어 드립니다.",
    feature2Title: "진심 어린 메시지",
    feature2Desc: "그 순간의 감동을 담은 완벽한 메시지를 작성하도록 도와드립니다.",
    feature3Title: "글로벌 스타일",
    feature3Desc: "전 세계의 다양한 스타일과 테마로 당신의 추억을 꾸며보세요.",
    showcaseTitle: "해달 갤러리",
    showcaseSubtitle: "우체국을 거쳐간 아름다운 추억들을 감상해보세요.",
    tryBtn: "우체국 방문하기",
    ctaTitle: "첫 번째 엽서를 보낼 준비가 되셨나요?",
    ctaSubtitle: "해달 우체부가 당신의 사진을 기다리고 있습니다.",
    ctaBtn: "우체국 입장하기",
    rights: "모든 권리 보유."
  },
  // Keep other languages minimal or fallback to EN for now to save space/time, 
  // but ideally they should be updated too. For this task, ZH is priority.
  fr: {
    badge: "Bureau de Poste des Loutres",
    title1: "Envoyez vos souvenirs ",
    title2: "vers le futur",
    subtitle: "Laissez le facteur loutre transformer vos précieuses photos en magnifiques cartes postales.",
    startBtn: "Commencer",
    featuresTitle: "Service Spécial",
    featuresSubtitle: "Créé avec amour par notre équipe de loutres.",
    feature1Title: "Formatage Intelligent",
    feature1Desc: "Nos loutres recadrent soigneusement vos photos.",
    feature2Title: "Messages Sincères",
    feature2Desc: "Nous vous aidons à écrire le message parfait.",
    feature3Title: "Styles Mondiaux",
    feature3Desc: "Des thèmes du monde entier.",
    showcaseTitle: "Galerie des Loutres",
    showcaseSubtitle: "Voir les beaux souvenirs.",
    tryBtn: "Visiter",
    ctaTitle: "Prêt à envoyer ?",
    ctaSubtitle: "Le facteur loutre vous attend.",
    ctaBtn: "Entrer",
    rights: "Tous droits réservés."
  },
  es: {
    badge: "Oficina de Correos de Nutrias",
    title1: "Envía tus recuerdos ",
    title2: "al futuro",
    subtitle: "Deja que el cartero nutria convierta tus preciosas fotos en hermosas postales.",
    startBtn: "Empezar",
    featuresTitle: "Servicio Especial",
    featuresSubtitle: "Creado con amor por nuestro equipo de nutrias.",
    feature1Title: "Formato Inteligente",
    feature1Desc: "Nuestras nutrias recortan cuidadosamente tus fotos.",
    feature2Title: "Mensajes Sinceros",
    feature2Desc: "Te ayudamos a escribir el mensaje perfecto.",
    feature3Title: "Estilos Globales",
    feature3Desc: "Temas de todo el mundo.",
    showcaseTitle: "Galería de Nutrias",
    showcaseSubtitle: "Ver los hermosos recuerdos.",
    tryBtn: "Visitar",
    ctaTitle: "¿Listo para enviar?",
    ctaSubtitle: "El cartero nutria te espera.",
    ctaBtn: "Entrar",
    rights: "Todos los derechos reservados."
  },
  de: {
    badge: "Seeotter-Postamt",
    title1: "Senden Sie Ihre Erinnerungen ",
    title2: "in die Zukunft",
    subtitle: "Lassen Sie den Seeotter-Postboten Ihre wertvollen Fotos in wunderschöne Postkarten verwandeln.",
    startBtn: "Starten",
    featuresTitle: "Spezialversand",
    featuresSubtitle: "Mit Liebe von unserem Seeotter-Team erstellt.",
    feature1Title: "Intelligente Formatierung",
    feature1Desc: "Unsere Otter schneiden Ihre Fotos sorgfältig zu.",
    feature2Title: "Herzliche Nachrichten",
    feature2Desc: "Wir helfen Ihnen, die perfekte Nachricht zu schreiben.",
    feature3Title: "Globale Stile",
    feature3Desc: "Themen aus der ganzen Welt.",
    showcaseTitle: "Otter-Galerie",
    showcaseSubtitle: "Sehen Sie die schönen Erinnerungen.",
    tryBtn: "Besuchen",
    ctaTitle: "Bereit zum Senden?",
    ctaSubtitle: "Der Seeotter-Postbote wartet.",
    ctaBtn: "Eintreten",
    rights: "Alle Rechte vorbehalten."
  },
  it: {
    badge: "Ufficio Postale delle Lontre",
    title1: "Invia i tuoi ricordi ",
    title2: "nel futuro",
    subtitle: "Lascia che il postino lontra trasformi le tue foto preziose in splendide cartoline.",
    startBtn: "Inizia",
    featuresTitle: "Servizio Speciale",
    featuresSubtitle: "Creato con amore dal nostro team di lontre.",
    feature1Title: "Formattazione Intelligente",
    feature1Desc: "Le nostre lontre ritagliano con cura le tue foto.",
    feature2Title: "Messaggi Sinceri",
    feature2Desc: "Ti aiutiamo a scrivere il messaggio perfetto.",
    feature3Title: "Stili Globali",
    feature3Desc: "Temi da tutto il mondo.",
    showcaseTitle: "Galleria delle Lontre",
    showcaseSubtitle: "Vedi i bei ricordi.",
    tryBtn: "Visita",
    ctaTitle: "Pronto a inviare?",
    ctaSubtitle: "Il postino lontra ti aspetta.",
    ctaBtn: "Entra",
    rights: "Tutti i diritti riservati."
  },
  id: {
    badge: "Kantor Pos Berang-berang",
    title1: "Kirim kenangan Anda ",
    title2: "ke masa depan",
    subtitle: "Biarkan tukang pos berang-berang mengubah foto berharga Anda menjadi kartu pos yang indah.",
    startBtn: "Mulai",
    featuresTitle: "Layanan Khusus",
    featuresSubtitle: "Dibuat dengan cinta oleh tim berang-berang kami.",
    feature1Title: "Pemformatan Cerdas",
    feature1Desc: "Berang-berang kami memotong foto Anda dengan hati-hati.",
    feature2Title: "Pesan Tulus",
    feature2Desc: "Kami membantu Anda menulis pesan yang sempurna.",
    feature3Title: "Gaya Global",
    feature3Desc: "Tema dari seluruh dunia.",
    showcaseTitle: "Galeri Berang-berang",
    showcaseSubtitle: "Lihat kenangan indah.",
    tryBtn: "Kunjungi",
    ctaTitle: "Siap mengirim?",
    ctaSubtitle: "Tukang pos berang-berang menunggu.",
    ctaBtn: "Masuk",
    rights: "Hak cipta terpelihara."
  },
  th: {
    badge: "ที่ทำการไปรษณีย์นากทะเล",
    title1: "ส่งความทรงจำของคุณ ",
    title2: "สู่อนาคต",
    subtitle: "ให้บุรุษไปรษณีย์นากทะเลเปลี่ยนภาพถ่ายอันมีค่าของคุณให้เป็นโปสการ์ดที่สวยงาม",
    startBtn: "เริ่ม",
    featuresTitle: "บริการพิเศษ",
    featuresSubtitle: "สร้างขึ้นด้วยความรักโดยทีมนากทะเลของเรา",
    feature1Title: "การจัดรูปแบบอัจฉริยะ",
    feature1Desc: "นากทะเลของเราตัดรูปภาพของคุณอย่างระมัดระวัง",
    feature2Title: "ข้อความที่จริงใจ",
    feature2Desc: "เราช่วยคุณเขียนข้อความที่สมบูรณ์แบบ",
    feature3Title: "สไตล์ระดับโลก",
    feature3Desc: "ธีมจากทั่วโลก",
    showcaseTitle: "แกลเลอรีนากทะเล",
    showcaseSubtitle: "ดูความทรงจำที่สวยงาม",
    tryBtn: "เยี่ยมชม",
    ctaTitle: "พร้อมส่งหรือยัง?",
    ctaSubtitle: "บุรุษไปรษณีย์นากทะเลกำลังรออยู่",
    ctaBtn: "เข้าสู่",
    rights: "สงวนลิขสิทธิ์"
  },
  vi: {
    badge: "Bưu điện Rái cá biển",
    title1: "Gửi những kỷ niệm của bạn ",
    title2: "đến tương lai",
    subtitle: "Hãy để người đưa thư rái cá biển biến những bức ảnh quý giá của bạn thành những tấm bưu thiếp đẹp.",
    startBtn: "Bắt đầu",
    featuresTitle: "Dịch vụ đặc biệt",
    featuresSubtitle: "Được tạo ra với tình yêu bởi đội ngũ rái cá biển của chúng tôi.",
    feature1Title: "Định dạng thông minh",
    feature1Desc: "Những chú rái cá của chúng tôi cẩn thận cắt ảnh của bạn.",
    feature2Title: "Thông điệp chân thành",
    feature2Desc: "Chúng tôi giúp bạn viết thông điệp hoàn hảo.",
    feature3Title: "Phong cách toàn cầu",
    feature3Desc: "Chủ đề từ khắp nơi trên thế giới.",
    showcaseTitle: "Phòng trưng bày Rái cá",
    showcaseSubtitle: "Xem những kỷ niệm đẹp.",
    tryBtn: "Ghé thăm",
    ctaTitle: "Sẵn sàng gửi?",
    ctaSubtitle: "Người đưa thư rái cá đang chờ.",
    ctaBtn: "Vào",
    rights: "Đã đăng ký Bản quyền."
  },
  ms: {
    badge: "Pejabat Pos Memerang Laut",
    title1: "Hantar kenangan anda ",
    title2: "ke masa depan",
    subtitle: "Biarkan posmen memerang laut mengubah foto berharga anda menjadi poskad yang cantik.",
    startBtn: "Mula",
    featuresTitle: "Perkhidmatan Istimewa",
    featuresSubtitle: "Dibuat dengan kasih sayang oleh pasukan memerang laut kami.",
    feature1Title: "Pemformatan Pintar",
    feature1Desc: "Memerang laut kami memotong foto anda dengan teliti.",
    feature2Title: "Mesej Ikhlas",
    feature2Desc: "Kami membantu anda menulis mesej yang sempurna.",
    feature3Title: "Gaya Global",
    feature3Desc: "Tema dari seluruh dunia.",
    showcaseTitle: "Galeri Memerang",
    showcaseSubtitle: "Lihat kenangan indah.",
    tryBtn: "Lawati",
    ctaTitle: "Bersedia untuk menghantar?",
    ctaSubtitle: "Posmen memerang laut sedang menunggu.",
    ctaBtn: "Masuk",
    rights: "Hak cipta terpelihara."
  }
};

export default function LandingPage({ onStart, language, countryConfig, onCountryChange, onFeedback }: Props) {
  const t = translations[language] || translations.en;
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SeaOtterLogo className="w-8 h-8 text-stone-900" />
            <span className="font-bold text-lg tracking-tight text-stone-900">{t.badge}</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">{t.navFeatures}</a>
            <a href="#gallery" className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">{t.navGallery}</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Country Selection in Header */}
            <div className="relative">
              <button
                onClick={() => setShowCountryMenu(!showCountryMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 text-sm font-medium hover:border-stone-300 transition-all"
              >
                <Globe2 className="w-4 h-4 text-stone-400" />
                <span className="hidden sm:inline">{countryConfig.nativeCountry} ({countryConfig.nativeLanguage})</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", showCountryMenu && "rotate-180")} />
              </button>

              {showCountryMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-100 overflow-hidden z-20 min-w-[160px]">
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {countriesConfig.map((country) => (
                      <button
                        key={country.country}
                        onClick={() => {
                          onCountryChange(country);
                          setShowCountryMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 transition-colors text-sm",
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

            <button
              onClick={onStart}
              className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 transition-all hover:scale-105 active:scale-95"
            >
              {t.startBtn}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:justify-between gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-sm font-medium mb-6 border border-stone-200"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t.badge}</span>
        </motion.div>
        
        <div className="flex-1 max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[clamp(2.25rem,8vw,4.5rem)] font-bold text-stone-900 tracking-tight mb-6 leading-[1.05]"
          >
            {t.title1}
            <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-500 to-stone-900">{t.title2}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[clamp(1rem,2.5vw,1.2rem)] text-stone-500 mb-8 leading-relaxed"
          >
            {t.subtitle}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center md:items-start gap-4"
          >
            <button
              onClick={onStart}
              className="w-full sm:w-auto bg-stone-900 text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-stone-900/10"
            >
              {t.startBtn}
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-stone-200 text-stone-700 bg-white/70 hover:bg-white transition-all text-sm flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              精选示例
            </button>
          </motion.div>
        </div>

        {/* Hero Image/Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex-1 w-full max-w-lg mx-auto md:mx-0"
        >
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-stone-200/60 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-600">
            <img 
              src="https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=1600" 
              alt="Postcards scattered on a table" 
              className="w-full h-full object-cover opacity-85"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <div className="flex-1 bg-white/90 rounded-2xl p-3 shadow-lg">
                <div className="text-[11px] font-medium text-stone-500 mb-1">AI 设计正面</div>
                <div className="text-sm font-semibold text-stone-900 truncate">东京黄昏街角</div>
                <div className="text-[11px] text-stone-500 mt-1 truncate">根据照片自动生成标题与地点</div>
              </div>
              <div className="flex-1 bg-white/90 rounded-2xl p-3 shadow-lg hidden sm:block">
                <div className="text-[11px] font-medium text-stone-500 mb-1">AI 设计背面</div>
                <div className="text-[11px] text-stone-600 line-clamp-3">
                  在异国的街灯下，时间像被放慢了一拍。写下一句话，把这一刻寄给未来的自己。
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold text-stone-900 mb-4">{t.featuresTitle}</h2>
            <p className="text-[clamp(1rem,2vw,1.125rem)] text-stone-500">{t.featuresSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 mb-6">
                <ImageIcon className="w-6 h-6 text-stone-700" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">{t.feature1Title}</h3>
              <p className="text-stone-500 leading-relaxed">
                {t.feature1Desc}
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 mb-6">
                <Heart className="w-6 h-6 text-stone-700" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">{t.feature2Title}</h3>
              <p className="text-stone-500 leading-relaxed">
                {t.feature2Desc}
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-stone-100 mb-6">
                <Globe2 className="w-6 h-6 text-stone-700" />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">{t.feature3Title}</h3>
              <p className="text-stone-500 leading-relaxed">
                {t.feature3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section */}
      <section id="gallery" className="py-24 bg-stone-900 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-[clamp(1.75rem,5vw,2.5rem)] font-bold mb-4">{t.showcaseTitle}</h2>
              <p className="text-stone-400 text-[clamp(1rem,2vw,1.125rem)] max-w-xl">{t.showcaseSubtitle}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[
              { 
                img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800', 
                title: 'Cyberpunk Tokyo', 
                loc: 'Shibuya, Japan', 
                theme: 'Neon Night',
                style: 'cyberpunk',
                msg: 'The neon lights are blinding, and the energy is electric. Tokyo never sleeps, and neither do I! \n\nCatch you in the matrix,\nOtter' 
              },
              { 
                img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=800', 
                title: 'Venetian Serenade', 
                loc: 'Venice, Italy', 
                theme: 'Oil Painting',
                style: 'artistic',
                msg: 'Floating through the canals, the water reflects centuries of history. Every corner is a masterpiece.\n\nCiao,\nOtter' 
              },
              { 
                img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800', 
                title: 'Alpine Solitude', 
                loc: 'Zermatt, Switzerland', 
                theme: 'Vintage Film',
                style: 'vintage',
                msg: 'The Matterhorn stands tall against the blue sky. The air is thin but the view is worth every breath.\n\nStay cool,\nOtter' 
              },
              { 
                img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800', 
                title: 'Azure Escape', 
                loc: 'Maldives', 
                theme: 'Minimalist',
                style: 'minimal',
                msg: 'Just blue. Endless blue. The sand is like powder and the water is like glass. Paradise found.\n\nPeace,\nOtter' 
              },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[3/4] rounded-2xl bg-transparent [perspective:1000px]"
              >
                <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-2xl">
                  {/* Front */}
                  <div className={cn(
                    "absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden border",
                    item.style === 'cyberpunk' ? "bg-black border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]" :
                    item.style === 'artistic' ? "bg-stone-800 border-amber-600/50 p-3" :
                    item.style === 'vintage' ? "bg-white border-stone-200 p-4 pb-12" :
                    "bg-white border-stone-100"
                  )}>
                    <div className={cn(
                      "w-full h-full overflow-hidden rounded-lg relative",
                      item.style === 'artistic' && "border-4 border-amber-700/30 shadow-inner"
                    )}>
                      <img 
                        src={item.img} 
                        alt={item.title} 
                        className={cn(
                          "w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110",
                          item.style === 'vintage' && "sepia-[0.2] contrast-[0.9]"
                        )} 
                        referrerPolicy="no-referrer" 
                      />
                      
                      {/* Front Overlays */}
                      <div className={cn(
                        "absolute inset-0 flex flex-col justify-end p-6",
                        item.style === 'cyberpunk' ? "bg-gradient-to-t from-cyan-950/90 via-transparent to-transparent" :
                        item.style === 'artistic' ? "bg-gradient-to-t from-amber-950/80 via-transparent to-transparent" :
                        item.style === 'vintage' ? "bg-transparent" :
                        "bg-gradient-to-t from-black/60 via-transparent to-transparent"
                      )}>
                        {item.style !== 'vintage' && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-semibold backdrop-blur-md",
                              item.style === 'cyberpunk' ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
                              item.style === 'artistic' ? "bg-amber-500/20 text-amber-200 border border-amber-500/30" :
                              "bg-white/20 text-white"
                            )}>
                              {item.theme}
                            </span>
                          </div>
                        )}
                        <h4 className={cn(
                          "text-2xl leading-tight mb-1",
                          item.style === 'cyberpunk' ? "font-mono text-cyan-400 [text-shadow:0_0_10px_rgba(34,211,238,0.8)]" :
                          item.style === 'artistic' ? "font-serif italic text-amber-100" :
                          item.style === 'vintage' ? "font-mono text-stone-800 absolute -bottom-8 left-0 w-full text-center text-sm" :
                          "font-sans font-bold text-white"
                        )}>
                          {item.title}
                        </h4>
                        {item.style !== 'vintage' && (
                          <p className={cn(
                            "text-sm flex items-center gap-1.5",
                            item.style === 'cyberpunk' ? "text-cyan-600 font-mono" :
                            item.style === 'artistic' ? "text-amber-400/80 font-serif italic" :
                            "text-stone-300"
                          )}>
                            <Globe2 className="w-3 h-3" /> {item.loc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className={cn(
                    "absolute inset-0 [backface-visibility:hidden] rounded-2xl p-6 flex flex-col [transform:rotateY(180deg)] border-2 shadow-inner",
                    item.style === 'cyberpunk' ? "bg-slate-950 border-cyan-900 text-cyan-400" :
                    item.style === 'artistic' ? "bg-[#f4e4bc] border-amber-900/20 text-amber-950" :
                    item.style === 'vintage' ? "bg-[#f2f0e9] border-stone-300 text-stone-800" :
                    "bg-white border-stone-100 text-stone-900"
                  )}>
                    {/* Back Header */}
                    <div className={cn(
                      "flex justify-between items-start border-b-2 pb-4 mb-4",
                      item.style === 'cyberpunk' ? "border-cyan-900/50" :
                      item.style === 'artistic' ? "border-amber-900/10" :
                      item.style === 'vintage' ? "border-stone-300" :
                      "border-stone-100"
                    )}>
                      <div className="flex flex-col">
                        <div className={cn(
                          "text-lg leading-none",
                          item.style === 'cyberpunk' ? "font-mono tracking-tighter" :
                          item.style === 'artistic' ? "font-serif italic font-bold" :
                          item.style === 'vintage' ? "font-mono uppercase text-sm" :
                          "font-sans font-bold"
                        )}>
                          {item.loc}
                        </div>
                        <div className={cn(
                          "text-[10px] uppercase tracking-tighter mt-1 opacity-60",
                          item.style === 'cyberpunk' && "font-mono"
                        )}>
                          Postcard from Otter
                        </div>
                      </div>
                      <div className={cn(
                        "w-12 h-14 border-2 border-dashed rounded-sm flex flex-col items-center justify-center",
                        item.style === 'cyberpunk' ? "border-cyan-500/30 bg-cyan-500/5" :
                        item.style === 'artistic' ? "border-amber-900/20 bg-amber-900/5" :
                        item.style === 'vintage' ? "border-stone-400 bg-stone-200/50" :
                        "border-stone-200 bg-stone-50"
                      )}>
                        <div className="text-[8px] font-bold uppercase opacity-40">Stamp</div>
                        {item.style === 'cyberpunk' ? <Sparkles className="w-4 h-4 text-cyan-400 mt-1" /> :
                         item.style === 'artistic' ? <Globe2 className="w-4 h-4 text-amber-800 mt-1" /> :
                         <Heart className="w-4 h-4 text-stone-400 mt-1" />}
                      </div>
                    </div>

                    {/* Back Content */}
                    <div className={cn(
                      "flex-1 flex gap-6",
                      item.style === 'cyberpunk' && "flex-col"
                    )}>
                      <div className={cn(
                        "flex-[1.5] text-lg leading-relaxed whitespace-pre-wrap",
                        item.style === 'cyberpunk' ? "font-mono text-sm text-cyan-300 order-2" :
                        item.style === 'artistic' ? "font-serif italic text-amber-900/80" :
                        item.style === 'vintage' ? "font-mono text-sm text-stone-700" :
                        "font-hand text-xl text-stone-700 rotate-[-1deg]"
                      )}>
                        {item.msg}
                      </div>
                      
                      {/* Divider */}
                      {item.style !== 'cyberpunk' && (
                        <div className={cn(
                          "w-px h-full relative",
                          item.style === 'artistic' ? "bg-amber-900/10" :
                          item.style === 'vintage' ? "bg-stone-300" :
                          "bg-stone-200"
                        )}>
                          <div className={cn(
                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-2",
                            item.style === 'artistic' ? "bg-[#f4e4bc]" :
                            item.style === 'vintage' ? "bg-[#f2f0e9]" :
                            "bg-white"
                          )}>
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              item.style === 'artistic' ? "bg-amber-600" :
                              item.style === 'vintage' ? "bg-stone-400" :
                              "bg-stone-300"
                            )}></div>
                          </div>
                        </div>
                      )}

                      {/* Address Area / Illustration Background Placeholder */}
                      <div className={cn(
                        "flex-1 flex flex-col gap-4 mt-2 relative",
                        item.style === 'cyberpunk' ? "order-1 flex-row items-center" : ""
                      )}>
                        {/* Full Background AI Illustration Placeholder */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
                           <SeaOtterLogo className={cn(
                             "w-32 h-32",
                             item.style === 'cyberpunk' ? "text-cyan-500" :
                             item.style === 'artistic' ? "text-amber-700" :
                             "text-stone-400"
                           )} />
                        </div>

                        {item.style !== 'cyberpunk' && [1, 2, 3].map(n => (
                          <div key={n} className={cn(
                            "h-px w-full",
                            item.style === 'artistic' ? "bg-amber-900/10" :
                            item.style === 'vintage' ? "bg-stone-300" :
                            "bg-stone-200"
                          )}></div>
                        ))}
                        
                        <div className="mt-auto flex justify-end">
                          <div className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center",
                            item.style === 'cyberpunk' ? "bg-cyan-500/10 border-cyan-500/30" :
                            item.style === 'artistic' ? "bg-amber-500/10 border-amber-500/30" :
                            "bg-stone-100 border-stone-200"
                          )}>
                            <SeaOtterLogo className={cn(
                              "w-5 h-5",
                              item.style === 'cyberpunk' ? "text-cyan-400 opacity-80" :
                              item.style === 'artistic' ? "text-amber-800 opacity-60" :
                              "opacity-30"
                            )} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[clamp(2rem,6vw,3rem)] font-bold text-stone-900 mb-6">{t.ctaTitle}</h2>
          <p className="text-[clamp(1rem,2.5vw,1.25rem)] text-stone-500 mb-10">{t.ctaSubtitle}</p>
          <button
            onClick={onStart}
            className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-medium text-lg hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-stone-900/10"
          >
            {t.ctaBtn}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="pricing" className="py-12 bg-stone-50 border-t border-stone-100 px-4 sm:px-6 lg:px-8 text-center text-stone-400 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <SeaOtterLogo className="w-6 h-6 opacity-30" />
            <span className="font-semibold text-stone-500">{t.badge}</span>
          </div>
          <div className="flex gap-8">
            <button onClick={onFeedback} className="hover:text-stone-600 transition-colors flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Feedback
            </button>
            <a href="#" className="hover:text-stone-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Instagram</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Contact</a>
          </div>
          <p>© {new Date().getFullYear()} {t.badge}. {t.rights}</p>
        </div>
      </footer>
    </div>
  );
}
