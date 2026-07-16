import { motion } from 'motion/react';
import { ArrowRight, Image as ImageIcon, Globe2, Sparkles, Heart, MessageSquare, ChevronDown, UploadCloud, Wand2, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { SeaOtterLogo } from './SeaOtterLogo';
import { APP_VERSION } from '../version';
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

type LandingCopy = {
  badge: string;
  heroEyebrow: string;
  title1: string;
  title2: string;
  subtitle: string;
  deliveryNote: string;
  startBtn: string;
  navStartBtn: string;
  secondaryBtn: string;
  proof1: string;
  proof2: string;
  proof3: string;
  workflow1Title: string;
  workflow1Desc: string;
  workflow2Title: string;
  workflow2Desc: string;
  workflow3Title: string;
  workflow3Desc: string;
  featuresTitle: string;
  featuresSubtitle: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  tryBtn: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn: string;
  ctaMicrocopy: string;
  rights: string;
  navFeatures: string;
  navGallery: string;
  navPricing: string;
  navAbout: string;
  front: string;
  back: string;
  sampleTitle: string;
  sampleHint: string;
  sampleMessage: string;
  fromOtter: string;
  stamp: string;
  feedback: string;
  contact: string;
};

const translations: Record<string, Partial<LandingCopy>> = {
  en: {
    badge: "Sea Otter Post Office",
    heroEyebrow: "AI postcard maker for travel photos",
    title1: "Turn one photo into ",
    title2: "a finished postcard",
    subtitle: "Upload a photo, let AI draft the title, place and message, then fine-tune the front and back before saving or sharing.",
    deliveryNote: "Create export-ready digital postcards today. Physical printing and mailing are being prepared.",
    startBtn: "Create a postcard",
    navStartBtn: "Create",
    secondaryBtn: "View examples",
    proof1: "AI title and caption",
    proof2: "Editable front and back",
    proof3: "Travel map history",
    workflow1Title: "Upload",
    workflow1Desc: "Pick a travel photo or daily snapshot.",
    workflow2Title: "Generate",
    workflow2Desc: "AI drafts the postcard copy and layout.",
    workflow3Title: "Edit",
    workflow3Desc: "Move text, tune style, then export.",
    featuresTitle: "A focused postcard workflow",
    featuresSubtitle: "Built around the actual steps of making and saving a card.",
    feature1Title: "Photo-aware layout",
    feature1Desc: "Keeps the image readable while reserving room for title, date and location.",
    feature2Title: "AI writing that you can edit",
    feature2Desc: "Use AI as a first draft, then keep your own voice in the final card.",
    feature3Title: "Memory archive",
    feature3Desc: "Saved postcards can build a travel map when location data is available.",
    showcaseTitle: "Postcard styles",
    showcaseSubtitle: "Examples of front design, back copy and export-ready cards.",
    tryBtn: "Visit the Post Office",
    ctaTitle: "Ready to send your first card?",
    ctaSubtitle: "The sea otter postman is waiting for your photos.",
    ctaBtn: "Create a postcard",
    ctaMicrocopy: "Free to try. AI generation and premium features use credits, and you will never be charged without confirmation.",
    rights: "All rights reserved.",
    navFeatures: "Features",
    navGallery: "Gallery",
    navPricing: "Pricing",
    navAbout: "About"
    ,front: "Front", back: "Back", sampleTitle: "Quiet Afternoon", sampleHint: "Editable title, place and date", sampleMessage: "A quiet moment, turned into a card worth keeping.", fromOtter: "Postcard from Otter", stamp: "Stamp", feedback: "Feedback", contact: "Contact"
  },
  zh: {
    badge: "海獭邮局",
    heroEyebrow: "用 AI 把照片做成明信片",
    title1: "上传一张照片，",
    title2: "生成一张可收藏的明信片",
    subtitle: "自动生成标题、地点与背面文字，再手动调整排版、滤镜和水印。适合旅行记录，也适合把日常瞬间认真保存下来。",
    deliveryNote: "目前先提供可保存、可下载的数字明信片；实体印刷与邮寄功能正在准备中。",
    startBtn: "开始制作",
    navStartBtn: "开始制作",
    secondaryBtn: "查看示例",
    proof1: "AI 标题与正文",
    proof2: "正反面可编辑",
    proof3: "旅行地图归档",
    workflow1Title: "上传照片",
    workflow1Desc: "选择旅行或日常照片。",
    workflow2Title: "AI 生成",
    workflow2Desc: "生成标题、地点、正文和背面。",
    workflow3Title: "编辑导出",
    workflow3Desc: "拖动文字、调整样式并保存。",
    featuresTitle: "围绕明信片制作的完整流程",
    featuresSubtitle: "不是单纯套模板，而是从照片到可保存作品的一条流程。",
    feature1Title: "照片优先的正面排版",
    feature1Desc: "保留照片主体，同时给标题、日期和地点留下稳定位置。",
    feature2Title: "可修改的 AI 文案",
    feature2Desc: "AI 先帮你写第一版，你可以继续改成自己的语气。",
    feature3Title: "可积累的旅行记录",
    feature3Desc: "有地点信息的明信片会进入旅行地图，减少重复地点。",
    showcaseTitle: "明信片样式示例",
    showcaseSubtitle: "查看正面设计、背面文字和不同风格的最终效果。",
    tryBtn: "参观邮局",
    ctaTitle: "准备好寄出第一张明信片了吗？",
    ctaSubtitle: "海獭邮递员正在等待您的照片。",
    ctaBtn: "开始制作明信片",
    ctaMicrocopy: "可免费试用；AI 生成与高级功能使用积分，未经确认不会自动扣费。",
    rights: "版权所有。",
    navFeatures: "功能介绍",
    navGallery: "精选画廊",
    navPricing: "会员方案",
    navAbout: "关于我们"
    ,front: "正面", back: "背面", sampleTitle: "猫咪时光", sampleHint: "标题、地点、日期都可调整", sampleMessage: "柔软的瞬间，被认真写成一张可以保存的明信片。", fromOtter: "海獭邮局明信片", stamp: "邮票", feedback: "意见反馈", contact: "联系我们"
  },
  // ... (keep other languages as fallback or update if needed, for now focusing on ZH/EN as requested)
  ja: {
    badge: "ラッコ郵便局",
    title1: "思い出を",
    title2: "未来へ届けよう",
    subtitle: "ラッコの郵便屋さんが、あなたの大切な写真を素敵なポストカードへと生まれ変わらせます。",
    deliveryNote: "現在は、保存・共有用のデジタルポストカードを作成できます。印刷・郵送機能は準備中です。",
    startBtn: "ポストカードを作ってみる",
    navStartBtn: "手紙を送る",
    secondaryBtn: "作例を見る",
    heroEyebrow: "写真から作るAIポストカード",
    proof1: "AIタイトルと文章",
    proof2: "表面・裏面を編集",
    proof3: "旅の地図に保存",
    workflow1Title: "写真を追加",
    workflow1Desc: "旅先や日常の一枚を選びます。",
    workflow2Title: "AIで生成",
    workflow2Desc: "写真に合うタイトル、場所、文章を作ります。",
    workflow3Title: "編集・書き出し",
    workflow3Desc: "文字とスタイルを調整して保存します。",
    featuresTitle: "ラッコの特別便",
    featuresSubtitle: "AIの下書きに、あなたらしい仕上げを加えられます。",
    feature1Title: "スマートクロッピング",
    feature1Desc: "AIが写真の構図を分析し、ポストカードに最適なサイズへ美しく切り抜きます。",
    feature2Title: "心温まるメッセージ",
    feature2Desc: "旅行の感動やその瞬間の想いを、AIが心温まるメッセージに変えるお手伝いをします。",
    feature3Title: "グローバルスタイル",
    feature3Desc: "世界各国の旅情をそそる多彩なデザインテーマで、あなたの思い出を鮮やかに彩ります。",
    showcaseTitle: "ラッコギャラリー",
    showcaseSubtitle: "郵便局が扱った美しい思い出をご覧ください。",
    tryBtn: "郵便局へ行く",
    ctaTitle: "あなただけの、特別な一枚を届けてみませんか？",
    ctaSubtitle: "写真を選ぶだけで、言葉とデザインを添えた一枚に仕上げられます。",
    ctaBtn: "ポストカードを作ってみる",
    ctaMicrocopy: "※お試し作成は無料です。AI生成や追加機能はクレジット制で、確認なしに課金されることはありません。",
    rights: "無断転載を禁じます。",
    navFeatures: "機能", navGallery: "作例", navPricing: "料金", navAbout: "概要", front: "表面", back: "裏面", sampleTitle: "静かな午後", sampleHint: "タイトル・場所・日付を編集できます", sampleMessage: "静かなひとときを、大切に残せる一枚のカードに。", fromOtter: "ラッコ郵便局から", stamp: "切手", feedback: "ご意見", contact: "お問い合わせ"
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
  const t = { ...translations.en, ...(translations[language] || {}) } as LandingCopy;
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const workflow = [
    { icon: UploadCloud, title: t.workflow1Title, desc: t.workflow1Desc },
    { icon: Wand2, title: t.workflow2Title, desc: t.workflow2Desc },
    { icon: SlidersHorizontal, title: t.workflow3Title, desc: t.workflow3Desc },
  ];
  const defaultShowcase = [
    { img: 'https://images.unsplash.com/photo-1509043759401-136742328bb3?auto=format&fit=crop&q=80&w=800', title: 'Neon Shanghai', loc: 'The Bund, Shanghai', theme: 'City Night', style: 'neon', msg: 'The city lights shimmer on the river, turning the night into a postcard.' },
    { img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=800', title: 'Venetian Serenade', loc: 'Venice, Italy', theme: 'Oil Painting', style: 'artistic', msg: 'Floating through the canals, the water reflects centuries of history.' },
    { img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800', title: 'Alpine Solitude', loc: 'Zermatt, Switzerland', theme: 'Vintage Film', style: 'vintage', msg: 'The Matterhorn stands tall against the blue sky.' },
    { img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800', title: 'Azure Escape', loc: 'Maldives', theme: 'Minimalist', style: 'minimal', msg: 'Endless blue water and powder-soft sand. A quiet paradise.' },
  ];
  const showcaseItems = language === 'ja' ? [
    { ...defaultShowcase[0], title: '上海の夜景', loc: '上海・外灘', theme: 'シティナイト', msg: '川面に揺れる灯りが、街の夜を一枚の手紙に変えていきます。' },
    { ...defaultShowcase[1], title: 'ヴェネツィアの旋律', loc: 'イタリア・ヴェネツィア', theme: '油彩', msg: '運河を進むたび、水面に長い歴史と静かな時間が映ります。' },
    { ...defaultShowcase[2], title: 'アルプスの静寂', loc: 'スイス・ツェルマット', theme: 'ヴィンテージフィルム', msg: '澄んだ空の下、マッターホルンが変わらない姿で立っています。' },
    { ...defaultShowcase[3], title: '青の休暇', loc: 'モルディブ', theme: 'ミニマル', msg: 'どこまでも続く青と、粉雪のような砂。静かな楽園を見つけました。' },
  ] : defaultShowcase;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SeaOtterLogo className="w-8 h-8 text-stone-900" />
            <span className="font-bold text-lg tracking-tight text-stone-900">{t.badge}</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-5 xl:gap-8">
            <a href="#features" className="whitespace-nowrap text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors">{t.navFeatures}</a>
            <a href="#gallery" className="whitespace-nowrap text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors">{t.navGallery}</a>
            <a href="#pricing" className="whitespace-nowrap text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors">{t.navPricing}</a>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Country Selection in Header */}
            <div className="relative">
              <button
                onClick={() => setShowCountryMenu(!showCountryMenu)}
              className="flex max-w-[11rem] items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-stone-700 transition-all hover:border-stone-300 sm:max-w-none sm:px-3"
              >
                <Globe2 className="w-4 h-4 text-stone-400" />
                <span className="hidden max-w-[13rem] truncate sm:inline">{countryConfig.nativeCountry} ({countryConfig.nativeLanguage})</span>
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
              className="shrink-0 whitespace-nowrap rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-stone-800 active:scale-95 sm:px-4"
            >
              {t.navStartBtn}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex flex-col items-center text-center md:text-left md:flex-row md:items-center md:justify-between gap-10">
        <div className="flex-1 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-sm font-medium text-stone-600 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.heroEyebrow || t.badge}</span>
          </motion.div>
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
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mb-7 rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-medium leading-relaxed text-stone-700 shadow-sm"
          >
            {t.deliveryNote}
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
              {t.secondaryBtn || t.tryBtn}
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-stone-600 md:justify-start"
          >
            {[t.proof1, t.proof2, t.proof3].filter(Boolean).map((item: string) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {item}
              </span>
            ))}
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
	                <div className="text-[11px] font-medium text-stone-500 mb-1">{t.front}</div>
	                <div className="text-sm font-semibold text-stone-900 truncate">{t.sampleTitle}</div>
	                <div className="text-[11px] text-stone-500 mt-1 truncate">{t.sampleHint}</div>
	              </div>
	              <div className="flex-1 bg-white/90 rounded-2xl p-3 shadow-lg hidden sm:block">
	                <div className="text-[11px] font-medium text-stone-500 mb-1">{t.back}</div>
	                <div className="text-[11px] text-stone-600 line-clamp-3">
	                  {t.sampleMessage}
	                </div>
	              </div>
	            </div>
	          </div>
	        </motion.div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {workflow.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="font-semibold text-stone-900">{title}</div>
                <div className="mt-1 text-[15px] leading-relaxed text-stone-700">{desc}</div>
              </div>
            </div>
          ))}
        </div>
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
            {showcaseItems.map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-transparent [perspective:1000px]"
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
                        "absolute inset-0 flex min-w-0 flex-col justify-end overflow-hidden p-4 sm:p-5",
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
                          "max-w-full break-words text-xl sm:text-2xl leading-tight mb-1",
                          item.style === 'cyberpunk' ? "font-mono text-cyan-400 [text-shadow:0_0_10px_rgba(34,211,238,0.8)]" :
                          item.style === 'artistic' ? "font-serif italic text-amber-100" :
                          item.style === 'vintage' ? "font-mono text-stone-800 bg-white/90 px-2 py-1 text-center text-sm" :
                          "font-sans font-bold text-white"
                        )}>
                          {item.title}
                        </h4>
                        {item.style !== 'vintage' && (
                          <p className={cn(
                            "flex min-w-0 max-w-full items-center gap-1.5 text-sm",
                            item.style === 'cyberpunk' ? "text-cyan-600 font-mono" :
                            item.style === 'artistic' ? "text-amber-400/80 font-serif italic" :
                            "text-stone-300"
                          )}>
                            <Globe2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="min-w-0 truncate leading-none">{item.loc}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div className={cn(
                    "absolute inset-0 min-h-0 overflow-hidden [backface-visibility:hidden] rounded-2xl p-5 sm:p-6 flex flex-col [transform:rotateY(180deg)] border-2 shadow-inner",
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
                      <div className="flex min-w-0 flex-col pr-2">
                        <div className={cn(
                          "max-w-full truncate text-base sm:text-lg leading-tight",
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
                          {t.fromOtter}
                        </div>
                      </div>
                      <div className={cn(
                        "w-12 h-14 border-2 border-dashed rounded-sm flex flex-col items-center justify-center",
                        item.style === 'cyberpunk' ? "border-cyan-500/30 bg-cyan-500/5" :
                        item.style === 'artistic' ? "border-amber-900/20 bg-amber-900/5" :
                        item.style === 'vintage' ? "border-stone-400 bg-stone-200/50" :
                        "border-stone-200 bg-stone-50"
                      )}>
                        <div className="text-[8px] font-bold uppercase opacity-40">{t.stamp}</div>
                        {item.style === 'cyberpunk' ? <Sparkles className="w-4 h-4 text-cyan-400 mt-1" /> :
                         item.style === 'artistic' ? <Globe2 className="w-4 h-4 text-amber-800 mt-1" /> :
                         <Heart className="w-4 h-4 text-stone-400 mt-1" />}
                      </div>
                    </div>

                    {/* Back Content */}
                    <div className={cn(
                      "min-h-0 flex-1 flex gap-4 sm:gap-6 overflow-hidden",
                      item.style === 'cyberpunk' && "flex-col"
                    )}>
                      <div className={cn(
                        "min-h-0 min-w-0 flex-[1.5] overflow-hidden text-base sm:text-lg leading-relaxed whitespace-pre-wrap [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:7]",
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
                        "min-h-0 min-w-0 flex-1 flex flex-col gap-4 mt-2 relative overflow-hidden",
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
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-500">{t.ctaMicrocopy}</p>
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
              {t.feedback}
            </button>
            <a href="#" className="hover:text-stone-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-stone-600 transition-colors">Instagram</a>
            <a href="#" className="hover:text-stone-600 transition-colors">{t.contact}</a>
          </div>
          <p>© {new Date().getFullYear()} {t.badge}. {t.rights} · v{APP_VERSION}</p>
        </div>
      </footer>
    </div>
  );
}
