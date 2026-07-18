import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Download,
  Globe2,
  Image as ImageIcon,
  MessageSquare,
  MoveHorizontal,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SeaOtterLogo } from './SeaOtterLogo';
import { APP_VERSION } from '../version';
import { cn } from '../lib/utils';
import { CountryConfig, countriesConfig } from '../config/countries';

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
  comparisonTitle: string;
  comparisonSubtitle: string;
  beforeLabel: string;
  afterLabel: string;
  beforeCaption: string;
  afterCaption: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  ctaTitle: string;
  ctaBtn: string;
  ctaMicrocopy: string;
  rights: string;
  navFeatures: string;
  navGallery: string;
  navPricing: string;
  front: string;
  back: string;
  sampleTitle: string;
  sampleHint: string;
  sampleMessage: string;
  fromOtter: string;
  feedback: string;
  contact: string;
};

type ShowcaseItem = {
  img: string;
  title: string;
  loc: string;
  theme: string;
  msg: string;
};

const baseCopy: LandingCopy = {
  badge: 'Sea Otter Post Office',
  heroEyebrow: 'AI postcard maker for travel photos',
  title1: "Don't let beautiful views",
  title2: 'die in your camera roll',
  subtitle: 'Upload one photo. AI writes a poetic caption, lays it out with a vintage postcard feel, and turns an ordinary moment into something worth keeping.',
  deliveryNote: 'Free digital creation and download are available now. Physical printing and global mailing are being prepared.',
  startBtn: '[Free] Make my postcard',
  navStartBtn: 'Make a card',
  secondaryBtn: 'View examples',
  proof1: 'Free digital download',
  proof2: 'Editable front and back',
  proof3: 'No surprise charges',
  comparisonTitle: 'From snapshot to keepsake, in one glance.',
  comparisonSubtitle: 'Drag the divider to see how a plain travel photo becomes a designed postcard.',
  beforeLabel: 'Original',
  afterLabel: 'AI postcard',
  beforeCaption: 'A normal photo from the camera roll',
  afterCaption: 'A finished card with title, copy and layout',
  showcaseTitle: 'Sea Otter Theater',
  showcaseSubtitle: 'A quiet reel of places turned into postcards.',
  ctaTitle: 'Now, turn one precious memory into a postcard.',
  ctaBtn: '[Free] Make my postcard',
  ctaMicrocopy: 'Free to try and download. You will never be charged without confirmation.',
  rights: 'All rights reserved.',
  navFeatures: 'How it works',
  navGallery: 'Gallery',
  navPricing: 'Pricing',
  front: 'Front',
  back: 'Back',
  sampleTitle: 'Quiet Afternoon',
  sampleHint: 'Title, place and date can be edited',
  sampleMessage: 'A quiet moment, turned into a card worth keeping.',
  fromOtter: 'Postcard memory',
  feedback: 'Feedback',
  contact: 'Contact',
};

const translations: Record<string, Partial<LandingCopy>> = {
  en: baseCopy,
  zh: {
    badge: '海獭邮局',
    heroEyebrow: '照片生成 AI 明信片',
    title1: '别让美景',
    title2: '死在手机相册里',
    subtitle: '上传一张照片，海獭 AI 帮你自动写诗、复古排版。把每一个平凡的瞬间，定格成可以收藏与邮寄的艺术明信片。',
    deliveryNote: '支持免费制作与数字下载；实体印刷与全球邮寄正在加急准备中。',
    startBtn: '[免费] 制作我的明信片',
    navStartBtn: '免费制作',
    secondaryBtn: '看作例',
    proof1: '免费数字下载',
    proof2: '正反面可编辑',
    proof3: '绝无自动扣费',
    comparisonTitle: '废片变大片，只需一眼。',
    comparisonSubtitle: '拖动对比，看一张普通照片如何变成有故事感的明信片。',
    beforeLabel: '手机原图',
    afterLabel: 'AI 明信片',
    beforeCaption: '普通相册照片',
    afterCaption: '带标题、文案和复古版式的明信片',
    showcaseTitle: '海獭放映室',
    showcaseSubtitle: '看看他们记录的世界。',
    ctaTitle: '现在，把你的珍贵回忆做成明信片吧。',
    ctaBtn: '[免费] 制作我的明信片',
    ctaMicrocopy: '试用与下载完全免费，绝无任何自动扣费。',
    rights: '版权所有。',
    navFeatures: '效果对比',
    navGallery: '精选画廊',
    navPricing: '价格',
    front: '正面',
    back: '背面',
    sampleTitle: '静谧午后',
    sampleHint: '标题、地点、日期都可调整',
    sampleMessage: '把一瞬间认真写成一张可以保存的明信片。',
    fromOtter: '海獭明信片',
    feedback: '意见反馈',
    contact: '联系我们',
  },
  ja: {
    badge: 'ラッコ郵便局',
    heroEyebrow: '写真から作るAIポストカード',
    title1: '大切な風景を',
    title2: 'スマホの中で眠らせない',
    subtitle: '写真を一枚選ぶだけ。ラッコAIが言葉とレトロなレイアウトを添え、保存したくなるポストカードに仕上げます。',
    deliveryNote: '無料で作成・デジタル保存できます。印刷と海外郵送は準備中です。',
    startBtn: '無料でカードを作る',
    navStartBtn: 'カードを作る',
    secondaryBtn: '作例を見る',
    proof1: '無料デジタル保存',
    proof2: '表面・裏面を編集',
    proof3: '勝手に課金されません',
    comparisonTitle: '何気ない一枚が、物語のあるカードに。',
    comparisonSubtitle: 'スライダーを動かして、写真がポストカードに変わる瞬間を見てください。',
    beforeLabel: '元の写真',
    afterLabel: 'AIポストカード',
    beforeCaption: 'スマホに残っていた一枚',
    afterCaption: '言葉と余白を添えた一枚',
    showcaseTitle: 'ラッコシアター',
    showcaseSubtitle: '世界の思い出を、静かに上映します。',
    ctaTitle: '今、この思い出をポストカードに。',
    ctaBtn: '無料でカードを作る',
    ctaMicrocopy: 'お試し作成とダウンロードは無料です。確認なしに課金されることはありません。',
    rights: '無断転載を禁じます。',
    navFeatures: '比較',
    navGallery: '作例',
    navPricing: '料金',
    front: '表面',
    back: '裏面',
    sampleTitle: '静かな午後',
    sampleHint: 'タイトル・場所・日付を編集できます',
    sampleMessage: '静かなひとときを、大切に残せる一枚のカードに。',
    fromOtter: 'ラッコの一枚',
    feedback: 'ご意見',
    contact: 'お問い合わせ',
  },
  ko: {
    badge: '해달 우체국',
    heroEyebrow: '사진으로 만드는 AI 엽서',
    title1: '아름다운 순간을',
    title2: '앨범 속에만 두지 마세요',
    subtitle: '사진 한 장을 올리면 AI가 문장과 빈티지 레이아웃을 더해 소장하고 싶은 엽서로 만들어 줍니다.',
    deliveryNote: '디지털 제작과 다운로드는 무료입니다. 인쇄와 해외 발송은 준비 중입니다.',
    startBtn: '[무료] 내 엽서 만들기',
    navStartBtn: '엽서 만들기',
    secondaryBtn: '예시 보기',
    proof1: '무료 다운로드',
    proof2: '앞뒷면 편집',
    proof3: '자동 결제 없음',
    comparisonTitle: '평범한 사진이 이야기 있는 엽서로.',
    comparisonSubtitle: '슬라이더를 움직여 전후 차이를 확인해 보세요.',
    showcaseTitle: '해달 상영관',
    ctaTitle: '지금, 소중한 기억을 엽서로 만들어 보세요.',
    ctaBtn: '[무료] 내 엽서 만들기',
    ctaMicrocopy: '체험 제작과 다운로드는 무료이며, 확인 없이 결제되지 않습니다.',
    navFeatures: '비교',
    navGallery: '갤러리',
    navPricing: '요금',
  },
  fr: {
    badge: 'Poste des Loutres',
    title1: 'Ne laissez pas vos beaux paysages',
    title2: 'dormir dans la pellicule',
    subtitle: 'Ajoutez une photo. L’IA écrit, compose et transforme un instant simple en carte postale à garder.',
    deliveryNote: 'Création et téléchargement numériques gratuits. Impression et envoi mondial en préparation.',
    startBtn: '[Gratuit] Créer ma carte',
    navStartBtn: 'Créer',
    secondaryBtn: 'Voir les exemples',
    proof1: 'Téléchargement gratuit',
    proof3: 'Aucun débit automatique',
    comparisonTitle: 'Une photo simple devient une carte souvenir.',
    showcaseTitle: 'Cinéma des Loutres',
    ctaTitle: 'Transformez ce souvenir en carte postale.',
    ctaBtn: '[Gratuit] Créer ma carte',
    ctaMicrocopy: 'Essai et téléchargement gratuits. Aucun paiement sans confirmation.',
    navFeatures: 'Comparaison',
    navGallery: 'Galerie',
    navPricing: 'Prix',
  },
  es: {
    badge: 'Correo Nutria',
    title1: 'No dejes que tus mejores vistas',
    title2: 'mueran en la galería',
    subtitle: 'Sube una foto. La IA escribe y compone una postal vintage lista para guardar.',
    deliveryNote: 'Creación y descarga digital gratis. Impresión y envío internacional en preparación.',
    startBtn: '[Gratis] Crear mi postal',
    navStartBtn: 'Crear',
    secondaryBtn: 'Ver ejemplos',
    proof1: 'Descarga gratis',
    proof3: 'Sin cargos sorpresa',
    comparisonTitle: 'Una foto normal se convierte en recuerdo.',
    showcaseTitle: 'Cine Nutria',
    ctaTitle: 'Convierte un recuerdo en postal.',
    ctaBtn: '[Gratis] Crear mi postal',
    ctaMicrocopy: 'Prueba y descarga gratis. Nunca se cobra sin confirmación.',
    navFeatures: 'Comparar',
    navGallery: 'Galería',
    navPricing: 'Precios',
  },
  de: {
    badge: 'Seeotter-Post',
    title1: 'Lass schöne Ausblicke',
    title2: 'nicht im Fotoalbum verschwinden',
    subtitle: 'Ein Foto hochladen, und die KI gestaltet daraus eine Postkarte mit Text und Vintage-Layout.',
    deliveryNote: 'Digitale Erstellung und Download sind kostenlos. Druck und weltweiter Versand sind in Vorbereitung.',
    startBtn: '[Gratis] Meine Karte erstellen',
    navStartBtn: 'Karte erstellen',
    secondaryBtn: 'Beispiele ansehen',
    proof1: 'Gratis Download',
    proof3: 'Keine automatische Abbuchung',
    comparisonTitle: 'Aus einem Foto wird eine Karte mit Geschichte.',
    showcaseTitle: 'Seeotter-Kino',
    ctaTitle: 'Mach aus dieser Erinnerung eine Postkarte.',
    ctaBtn: '[Gratis] Meine Karte erstellen',
    ctaMicrocopy: 'Test und Download sind kostenlos. Keine Zahlung ohne Bestätigung.',
    navFeatures: 'Vergleich',
    navGallery: 'Galerie',
    navPricing: 'Preise',
  },
  it: {
    badge: 'Posta Lontra',
    title1: 'Non lasciare i paesaggi più belli',
    title2: 'dimenticati nel telefono',
    subtitle: 'Carica una foto. L’AI aggiunge parole e layout vintage per creare una cartolina da conservare.',
    deliveryNote: 'Creazione e download digitale gratuiti. Stampa e spedizione globale in preparazione.',
    startBtn: '[Gratis] Crea la mia cartolina',
    navStartBtn: 'Crea',
    secondaryBtn: 'Vedi esempi',
    proof1: 'Download gratuito',
    proof3: 'Nessun addebito automatico',
    comparisonTitle: 'Una foto semplice diventa una cartolina.',
    showcaseTitle: 'Cinema Lontra',
    ctaTitle: 'Trasforma un ricordo in cartolina.',
    ctaBtn: '[Gratis] Crea la mia cartolina',
    ctaMicrocopy: 'Prova e download gratuiti. Nessun pagamento senza conferma.',
    navFeatures: 'Confronto',
    navGallery: 'Galleria',
    navPricing: 'Prezzi',
  },
  id: {
    badge: 'Kantor Pos Berang-berang',
    title1: 'Jangan biarkan pemandangan indah',
    title2: 'hilang di galeri ponsel',
    subtitle: 'Unggah satu foto. AI menulis dan menata kartu pos vintage yang siap disimpan.',
    deliveryNote: 'Pembuatan dan unduhan digital gratis. Cetak dan pengiriman global sedang disiapkan.',
    startBtn: '[Gratis] Buat kartu pos',
    navStartBtn: 'Buat kartu',
    secondaryBtn: 'Lihat contoh',
    proof1: 'Unduhan gratis',
    proof3: 'Tanpa tagihan otomatis',
    comparisonTitle: 'Foto biasa menjadi kartu pos berkesan.',
    showcaseTitle: 'Teater Berang-berang',
    ctaTitle: 'Ubah kenangan ini menjadi kartu pos.',
    ctaBtn: '[Gratis] Buat kartu pos',
    ctaMicrocopy: 'Coba dan unduh gratis. Tidak ada pembayaran tanpa konfirmasi.',
    navFeatures: 'Perbandingan',
    navGallery: 'Galeri',
    navPricing: 'Harga',
  },
  th: {
    badge: 'ไปรษณีย์นากทะเล',
    title1: 'อย่าปล่อยภาพสวยงาม',
    title2: 'หลับอยู่ในอัลบั้ม',
    subtitle: 'อัปโหลดภาพหนึ่งใบ AI จะช่วยเขียนและจัดวางเป็นโปสการ์ดวินเทจที่น่าเก็บไว้',
    deliveryNote: 'สร้างและดาวน์โหลดแบบดิจิทัลได้ฟรี การพิมพ์และส่งทั่วโลกกำลังเตรียมพร้อม',
    startBtn: '[ฟรี] สร้างโปสการ์ด',
    navStartBtn: 'สร้างการ์ด',
    secondaryBtn: 'ดูตัวอย่าง',
    proof1: 'ดาวน์โหลดฟรี',
    proof3: 'ไม่มีการหักเงินอัตโนมัติ',
    comparisonTitle: 'ภาพธรรมดากลายเป็นโปสการ์ดมีเรื่องราว',
    showcaseTitle: 'โรงภาพยนตร์นากทะเล',
    ctaTitle: 'เปลี่ยนความทรงจำนี้เป็นโปสการ์ด',
    ctaBtn: '[ฟรี] สร้างโปสการ์ด',
    ctaMicrocopy: 'ทดลองและดาวน์โหลดฟรี ไม่มีการชำระเงินโดยไม่ยืนยัน',
    navFeatures: 'เปรียบเทียบ',
    navGallery: 'แกลเลอรี',
    navPricing: 'ราคา',
  },
  vi: {
    badge: 'Bưu điện Rái cá',
    title1: 'Đừng để khung cảnh đẹp',
    title2: 'ngủ quên trong album',
    subtitle: 'Tải lên một bức ảnh. AI viết lời và dàn trang thành một tấm bưu thiếp cổ điển đáng lưu giữ.',
    deliveryNote: 'Tạo và tải bản kỹ thuật số miễn phí. In ấn và gửi quốc tế đang được chuẩn bị.',
    startBtn: '[Miễn phí] Tạo bưu thiếp',
    navStartBtn: 'Tạo thẻ',
    secondaryBtn: 'Xem mẫu',
    proof1: 'Tải miễn phí',
    proof3: 'Không tự động thu phí',
    comparisonTitle: 'Ảnh thường trở thành bưu thiếp có câu chuyện.',
    showcaseTitle: 'Rạp chiếu Rái cá',
    ctaTitle: 'Biến kỷ niệm này thành bưu thiếp.',
    ctaBtn: '[Miễn phí] Tạo bưu thiếp',
    ctaMicrocopy: 'Dùng thử và tải xuống miễn phí. Không thu phí nếu chưa xác nhận.',
    navFeatures: 'So sánh',
    navGallery: 'Thư viện',
    navPricing: 'Giá',
  },
  ms: {
    badge: 'Pejabat Pos Memerang',
    title1: 'Jangan biarkan pemandangan indah',
    title2: 'tersimpan senyap dalam telefon',
    subtitle: 'Muat naik satu foto. AI menulis dan menyusun poskad vintaj yang sesuai untuk disimpan.',
    deliveryNote: 'Ciptaan dan muat turun digital adalah percuma. Cetakan dan penghantaran global sedang disediakan.',
    startBtn: '[Percuma] Cipta poskad saya',
    navStartBtn: 'Cipta kad',
    secondaryBtn: 'Lihat contoh',
    proof1: 'Muat turun percuma',
    proof3: 'Tiada caj automatik',
    comparisonTitle: 'Foto biasa menjadi poskad penuh cerita.',
    showcaseTitle: 'Pawagam Memerang',
    ctaTitle: 'Jadikan kenangan ini sebuah poskad.',
    ctaBtn: '[Percuma] Cipta poskad saya',
    ctaMicrocopy: 'Cuba dan muat turun percuma. Tiada bayaran tanpa pengesahan.',
    navFeatures: 'Perbandingan',
    navGallery: 'Galeri',
    navPricing: 'Harga',
  },
};

const defaultShowcase: ShowcaseItem[] = [
  {
    img: 'https://images.unsplash.com/photo-1509043759401-136742328bb3?auto=format&fit=crop&q=80&w=900',
    title: 'Neon Shanghai',
    loc: 'The Bund · Shanghai',
    theme: 'City night',
    msg: 'The river catches the city lights and folds the night into a postcard.',
  },
  {
    img: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&q=80&w=900',
    title: 'Venetian Serenade',
    loc: 'Venice · Italy',
    theme: 'Canal',
    msg: 'Water carries the old city slowly, as if every bridge remembers a song.',
  },
  {
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=900',
    title: 'Alpine Quiet',
    loc: 'Zermatt · Switzerland',
    theme: 'Mountain',
    msg: 'A quiet ridge, blue air, and a sky that makes distance feel gentle.',
  },
  {
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=900',
    title: 'Blue Holiday',
    loc: 'Maldives · Full Moon',
    theme: 'Sea',
    msg: 'The afternoon dissolves into salt, light, and one endless shade of blue.',
  },
];

const showcaseByLanguage: Record<string, ShowcaseItem[]> = {
  en: defaultShowcase,
  zh: [
    { ...defaultShowcase[0], title: '上海夜色', loc: '上海 · 外滩', theme: '城市夜景', msg: '江面接住城市灯火，把夜晚折成一张可以寄出的明信片。' },
    { ...defaultShowcase[1], title: '威尼斯旋律', loc: '意大利 · 威尼斯', theme: '水城', msg: '船慢慢划过桥影，水面像替古老城市保存着一支歌。' },
    { ...defaultShowcase[2], title: '阿尔卑斯静境', loc: '瑞士 · 阿尔卑斯', theme: '雪山', msg: '山脊安静，空气清透，远方也变得温柔。' },
    { ...defaultShowcase[3], title: '蓝色假期', loc: '马尔代夫 · 满月岛', theme: '海岛', msg: '午后融进盐、光和一整片无边的蓝。' },
  ],
  ja: [
    { ...defaultShowcase[0], title: '上海の夜景', loc: '上海・外灘', theme: '都市の夜', msg: '川面が街の灯りを受け止め、夜を一枚のカードに折りたたみます。' },
    { ...defaultShowcase[1], title: 'ヴェネツィアの旋律', loc: 'イタリア・ヴェネツィア', theme: '水の街', msg: '橋の影をくぐるたび、古い街が静かな歌を思い出します。' },
    { ...defaultShowcase[2], title: 'アルプスの静寂', loc: 'スイス・アルプス', theme: '山景', msg: '澄んだ空気と静かな稜線が、遠くの景色までやさしくします。' },
    { ...defaultShowcase[3], title: '青の休暇', loc: 'モルディブ・フルムーン', theme: '海辺', msg: '午後が塩と光、そしてどこまでも続く青に溶けていきます。' },
  ],
  ko: [
    { ...defaultShowcase[0], title: '상하이의 밤', loc: '상하이 · 와이탄', theme: '도시 야경', msg: '강물은 도시의 빛을 받아 밤을 한 장의 엽서로 접어 둡니다.' },
    { ...defaultShowcase[1], title: '베네치아의 선율', loc: '이탈리아 · 베네치아', theme: '운하', msg: '다리 그림자를 지날 때마다 오래된 도시는 조용한 노래를 떠올립니다.' },
    { ...defaultShowcase[2], title: '알프스의 고요', loc: '스위스 · 알프스', theme: '산', msg: '맑은 공기와 조용한 능선이 먼 풍경까지 부드럽게 만듭니다.' },
    { ...defaultShowcase[3], title: '푸른 휴가', loc: '몰디브 · 풀문', theme: '바다', msg: '오후는 소금과 빛, 끝없는 파랑 속으로 녹아듭니다.' },
  ],
  fr: [
    { ...defaultShowcase[0], title: 'Nuit à Shanghai', loc: 'Shanghai · Le Bund', theme: 'Ville', msg: 'Le fleuve recueille les lumières et plie la nuit en carte postale.' },
    { ...defaultShowcase[1], title: 'Mélodie vénitienne', loc: 'Venise · Italie', theme: 'Canal', msg: 'Sous les ponts, la vieille ville retrouve une chanson très douce.' },
    { ...defaultShowcase[2], title: 'Silence alpin', loc: 'Suisse · Alpes', theme: 'Montagne', msg: 'L’air clair et la crête tranquille rendent l’horizon plus tendre.' },
    { ...defaultShowcase[3], title: 'Vacances bleues', loc: 'Maldives · Full Moon', theme: 'Mer', msg: 'L’après-midi fond dans le sel, la lumière et un bleu sans fin.' },
  ],
  es: [
    { ...defaultShowcase[0], title: 'Noche en Shanghái', loc: 'Shanghái · El Bund', theme: 'Ciudad', msg: 'El río recoge las luces y dobla la noche como una postal.' },
    { ...defaultShowcase[1], title: 'Melodía veneciana', loc: 'Italia · Venecia', theme: 'Canal', msg: 'Bajo cada puente, la ciudad antigua recuerda una canción tranquila.' },
    { ...defaultShowcase[2], title: 'Silencio alpino', loc: 'Suiza · Alpes', theme: 'Montaña', msg: 'El aire claro y la cresta serena vuelven amable la distancia.' },
    { ...defaultShowcase[3], title: 'Vacación azul', loc: 'Maldivas · Full Moon', theme: 'Mar', msg: 'La tarde se disuelve en sal, luz y una inmensa sombra azul.' },
  ],
  de: [
    { ...defaultShowcase[0], title: 'Shanghai bei Nacht', loc: 'Shanghai · Bund', theme: 'Stadt', msg: 'Der Fluss fängt die Lichter ein und faltet die Nacht zur Postkarte.' },
    { ...defaultShowcase[1], title: 'Venezianische Melodie', loc: 'Italien · Venedig', theme: 'Kanal', msg: 'Unter jeder Brücke erinnert sich die alte Stadt an ein stilles Lied.' },
    { ...defaultShowcase[2], title: 'Alpine Stille', loc: 'Schweiz · Alpen', theme: 'Berg', msg: 'Klare Luft und ruhige Grate machen die Ferne sanft.' },
    { ...defaultShowcase[3], title: 'Blaue Auszeit', loc: 'Malediven · Full Moon', theme: 'Meer', msg: 'Der Nachmittag löst sich in Salz, Licht und endlosem Blau auf.' },
  ],
  it: [
    { ...defaultShowcase[0], title: 'Notte a Shanghai', loc: 'Shanghai · Bund', theme: 'Città', msg: 'Il fiume raccoglie le luci e piega la notte in una cartolina.' },
    { ...defaultShowcase[1], title: 'Melodia veneziana', loc: 'Italia · Venezia', theme: 'Canale', msg: 'Sotto ogni ponte, la città antica ricorda una canzone quieta.' },
    { ...defaultShowcase[2], title: 'Silenzio alpino', loc: 'Svizzera · Alpi', theme: 'Montagna', msg: 'Aria limpida e creste silenziose rendono dolce la distanza.' },
    { ...defaultShowcase[3], title: 'Vacanza blu', loc: 'Maldive · Full Moon', theme: 'Mare', msg: 'Il pomeriggio si scioglie in sale, luce e blu infinito.' },
  ],
  id: [
    { ...defaultShowcase[0], title: 'Malam Shanghai', loc: 'Shanghai · The Bund', theme: 'Kota', msg: 'Sungai menangkap cahaya kota dan melipat malam menjadi kartu pos.' },
    { ...defaultShowcase[1], title: 'Serenada Venesia', loc: 'Italia · Venesia', theme: 'Kanal', msg: 'Di bawah jembatan, kota tua mengingat sebuah lagu yang tenang.' },
    { ...defaultShowcase[2], title: 'Sunyi Alpen', loc: 'Swiss · Alpen', theme: 'Gunung', msg: 'Udara jernih dan punggung bukit yang sunyi membuat jarak terasa lembut.' },
    { ...defaultShowcase[3], title: 'Liburan Biru', loc: 'Maladewa · Full Moon', theme: 'Laut', msg: 'Sore larut ke dalam garam, cahaya, dan biru yang tak berujung.' },
  ],
  th: [
    { ...defaultShowcase[0], title: 'ค่ำคืนเซี่ยงไฮ้', loc: 'เซี่ยงไฮ้ · เดอะบันด์', theme: 'เมือง', msg: 'สายน้ำรับแสงไฟเมืองไว้ แล้วพับค่ำคืนให้เป็นโปสการ์ด' },
    { ...defaultShowcase[1], title: 'ท่วงทำนองเวนิส', loc: 'อิตาลี · เวนิส', theme: 'คลอง', msg: 'ใต้สะพานแต่ละแห่ง เมืองเก่าค่อย ๆ นึกถึงบทเพลงอันสงบ' },
    { ...defaultShowcase[2], title: 'ความสงบแห่งแอลป์', loc: 'สวิตเซอร์แลนด์ · แอลป์', theme: 'ภูเขา', msg: 'อากาศใสและสันเขาเงียบงาม ทำให้ระยะไกลดูอ่อนโยน' },
    { ...defaultShowcase[3], title: 'วันพักสีฟ้า', loc: 'มัลดีฟส์ · ฟูลมูน', theme: 'ทะเล', msg: 'ยามบ่ายละลายในเกลือ แสง และสีฟ้าไม่สิ้นสุด' },
  ],
  vi: [
    { ...defaultShowcase[0], title: 'Đêm Thượng Hải', loc: 'Thượng Hải · Bến Thượng Hải', theme: 'Thành phố', msg: 'Dòng sông giữ lấy ánh đèn và gấp đêm thành một tấm bưu thiếp.' },
    { ...defaultShowcase[1], title: 'Giai điệu Venice', loc: 'Ý · Venice', theme: 'Kênh đào', msg: 'Dưới mỗi cây cầu, thành phố cũ nhớ lại một khúc hát rất yên.' },
    { ...defaultShowcase[2], title: 'Tĩnh lặng Alps', loc: 'Thụy Sĩ · Alps', theme: 'Núi', msg: 'Không khí trong và sống núi lặng làm khoảng xa trở nên dịu dàng.' },
    { ...defaultShowcase[3], title: 'Kỳ nghỉ xanh', loc: 'Maldives · Full Moon', theme: 'Biển', msg: 'Buổi chiều tan vào muối, ánh sáng và một màu xanh bất tận.' },
  ],
  ms: [
    { ...defaultShowcase[0], title: 'Malam Shanghai', loc: 'Shanghai · The Bund', theme: 'Bandar', msg: 'Sungai menyimpan cahaya bandar lalu melipat malam menjadi poskad.' },
    { ...defaultShowcase[1], title: 'Serenad Venice', loc: 'Itali · Venice', theme: 'Terusan', msg: 'Di bawah setiap jambatan, kota lama mengingati sebuah lagu yang tenang.' },
    { ...defaultShowcase[2], title: 'Sunyi Alpen', loc: 'Switzerland · Alpen', theme: 'Gunung', msg: 'Udara jernih dan rabung yang sunyi membuat jarak terasa lembut.' },
    { ...defaultShowcase[3], title: 'Percutian Biru', loc: 'Maldives · Full Moon', theme: 'Laut', msg: 'Petang larut dalam garam, cahaya dan biru yang tidak berpenghujung.' },
  ],
};

function getShowcaseItems(language: string) {
  return showcaseByLanguage[language] ?? defaultShowcase;
}

export default function LandingPage({ onStart, language, countryConfig, onCountryChange, onFeedback }: Props) {
  const t = { ...baseCopy, ...(translations[language] || {}) };
  const showcaseItems = getShowcaseItems(language);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [compare, setCompare] = useState(56);
  const heroImage = showcaseItems[1]?.img ?? defaultShowcase[1].img;
  const compareImage = showcaseItems[3]?.img ?? defaultShowcase[3].img;

  return (
    <div className="min-h-screen bg-[#fbfaf7] font-sans text-stone-950">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200/70 bg-[#fbfaf7]/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <SeaOtterLogo className="h-8 w-8 shrink-0 text-stone-900" />
            <span className="truncate text-lg font-bold tracking-tight text-stone-950">{t.badge}</span>
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#compare" className="text-sm font-bold text-stone-700 transition-colors hover:text-stone-950">{t.navFeatures}</a>
            <a href="#gallery" className="text-sm font-bold text-stone-700 transition-colors hover:text-stone-950">{t.navGallery}</a>
            <a href="#pricing" className="text-sm font-bold text-stone-700 transition-colors hover:text-stone-950">{t.navPricing}</a>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setShowCountryMenu(!showCountryMenu)}
                className="flex max-w-[10rem] items-center gap-2 rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-stone-300 sm:max-w-none sm:px-3"
              >
                <Globe2 className="h-4 w-4 shrink-0 text-stone-500" />
                <span className="hidden max-w-[12rem] truncate sm:inline">
                  {countryConfig.nativeCountry} ({countryConfig.nativeLanguage})
                </span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', showCountryMenu && 'rotate-180')} />
              </button>

              {showCountryMenu && (
                <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-stone-100 bg-white shadow-2xl">
                  <div className="custom-scrollbar max-h-[300px] overflow-y-auto">
                    {countriesConfig.map((country) => (
                      <button
                        key={country.country}
                        onClick={() => {
                          onCountryChange(country);
                          setShowCountryMenu(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-stone-50',
                          countryConfig.country === country.country ? 'bg-stone-50 font-bold text-stone-900' : 'text-stone-600',
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
              className="shrink-0 rounded-xl bg-[#9b5c2e] px-3 py-2 text-sm font-bold text-white shadow-lg shadow-[#9b5c2e]/15 transition-all hover:-translate-y-0.5 hover:bg-[#7f4624] sm:px-4"
            >
              {t.navStartBtn}
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-4 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-start gap-8 py-5 md:py-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm font-bold text-stone-700 shadow-sm">
                <Sparkles className="h-4 w-4 text-[#d59138]" />
                <span>{t.heroEyebrow}</span>
              </div>

              <h1 className="max-w-[620px] text-[clamp(2.45rem,5.35vw,4.7rem)] font-black leading-[0.98] tracking-tight text-stone-950">
                {t.title1}
                <br />
                <span className="text-stone-600">{t.title2}</span>
              </h1>

              <p className="mt-7 max-w-xl text-[clamp(1rem,2vw,1.25rem)] font-medium leading-8 text-stone-600">
                {t.subtitle}
              </p>

              <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-[15px] font-bold leading-7 text-stone-800 shadow-sm sm:text-base">
                {t.deliveryNote}
              </p>

              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
                <button
                  onClick={onStart}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#9b5c2e] px-8 py-4 text-lg font-black text-white shadow-xl shadow-[#9b5c2e]/20 transition-all hover:-translate-y-0.5 hover:bg-[#7f4624] sm:w-auto"
                >
                  {t.startBtn}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center justify-center gap-2 text-sm font-bold text-stone-700 underline decoration-stone-300 underline-offset-4 transition-colors hover:text-stone-950 hover:decoration-stone-600"
                >
                  <ImageIcon className="h-4 w-4" />
                  {t.secondaryBtn}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[t.proof1, t.proof2, t.proof3].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-950 p-3 shadow-2xl shadow-stone-900/15">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.4rem]">
                  <img
                    src={heroImage}
                    alt="Postcard preview"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/88 p-4 shadow-xl backdrop-blur-md">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t.front}</div>
                      <div className="mt-1 text-lg font-black leading-tight text-stone-950">{t.sampleTitle}</div>
                      <div className="mt-1 text-xs font-medium text-stone-600">{t.sampleHint}</div>
                    </div>
                    <div className="hidden rounded-2xl bg-white/88 p-4 shadow-xl backdrop-blur-md sm:block">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{t.back}</div>
                      <div className="mt-1 line-clamp-3 text-sm font-medium leading-6 text-stone-700">{t.sampleMessage}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="compare" className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-7 max-w-2xl">
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black leading-tight tracking-tight text-stone-950">{t.comparisonTitle}</h2>
              <p className="mt-3 text-base font-medium leading-7 text-stone-600 sm:text-lg">{t.comparisonSubtitle}</p>
            </div>

            <div className="grid overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-900/5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative aspect-[16/10] min-h-[360px] overflow-hidden bg-stone-200">
                <img
                  src={compareImage}
                  alt={t.beforeLabel}
                  className="absolute inset-0 h-full w-full object-cover saturate-[0.75] brightness-[0.82]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute left-5 top-5 rounded-full bg-stone-950/75 px-3 py-1.5 text-xs font-black text-white backdrop-blur">{t.beforeLabel}</div>
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${compare}%` }}
                >
                  <div className="relative h-full w-[min(72vw,920px)]">
                    <img
                      src={compareImage}
                      alt={t.afterLabel}
                      className="absolute inset-0 h-full w-full object-cover brightness-[1.04] contrast-[1.06] saturate-[1.12]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-[#f8efe0]/12" />
                    <div className="absolute left-7 top-7 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-stone-900 shadow-sm backdrop-blur">{t.afterLabel}</div>
                    <div className="absolute bottom-7 left-7 max-w-[68%] rounded-2xl bg-[#fffaf1]/92 p-5 shadow-2xl backdrop-blur-md">
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9b5c2e]">{t.fromOtter}</div>
                      <div className="text-2xl font-black leading-tight text-stone-950">{showcaseItems[3]?.title ?? t.sampleTitle}</div>
                      <div className="mt-2 text-sm font-bold text-stone-600">{showcaseItems[3]?.loc ?? t.sampleHint}</div>
                    </div>
                  </div>
                </div>
                <div
                  className="absolute inset-y-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.35)]"
                  style={{ left: `${compare}%` }}
                >
                  <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white text-stone-900 shadow-xl">
                    <MoveHorizontal className="h-5 w-5" />
                  </div>
                </div>
                <input
                  aria-label="Compare original and postcard"
                  type="range"
                  min="24"
                  max="76"
                  value={compare}
                  onChange={(event) => setCompare(Number(event.target.value))}
                  className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
                />
              </div>

              <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-stone-950">
                      <ImageIcon className="h-4 w-4 text-stone-500" />
                      {t.beforeLabel}
                    </div>
                    <p className="text-sm font-medium leading-6 text-stone-600">{t.beforeCaption}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6c7a4] bg-[#fff7ec] p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-stone-950">
                      <Sparkles className="h-4 w-4 text-[#9b5c2e]" />
                      {t.afterLabel}
                    </div>
                    <p className="text-sm font-medium leading-6 text-stone-700">{t.afterCaption}</p>
                  </div>
                </div>
                <button
                  onClick={onStart}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-6 py-4 text-base font-black text-white transition-all hover:-translate-y-0.5 hover:bg-stone-800"
                >
                  {t.startBtn}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#171310] px-5 py-8 text-white shadow-2xl shadow-stone-900/15 sm:px-8 lg:px-10">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-black tracking-tight">{t.showcaseTitle}</h2>
                <p className="mt-2 text-base font-medium text-stone-300">{t.showcaseSubtitle}</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-bold text-stone-200">
                <Download className="h-3.5 w-3.5" />
                {t.proof1}
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {showcaseItems.map((item, index) => (
                <motion.article
                  key={`${item.title}-${index}`}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/8"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-h-[116px] p-5">
                    <div className="mb-3 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-300">
                      {item.theme}
                    </div>
                    <h3 className="truncate text-xl font-black leading-tight text-white">{item.title}</h3>
                    <p className="mt-2 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-stone-300">
                      <Globe2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.loc}</span>
                    </p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-white px-6 py-10 text-center shadow-xl shadow-stone-900/5 sm:px-10">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0dc] text-[#9b5c2e]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-[clamp(1.8rem,4vw,3.1rem)] font-black leading-tight tracking-tight text-stone-950 [word-break:keep-all]">{t.ctaTitle}</h2>
            <button
              onClick={onStart}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#9b5c2e] px-8 py-4 text-lg font-black text-white shadow-xl shadow-[#9b5c2e]/20 transition-all hover:-translate-y-0.5 hover:bg-[#7f4624]"
            >
              {t.ctaBtn}
              <ArrowRight className="h-5 w-5" />
            </button>
            <p className="mx-auto mt-5 max-w-xl text-[15px] font-semibold leading-7 text-stone-700">
              ※ <strong className="font-black text-stone-950">{t.ctaMicrocopy.split('。')[0] || t.ctaMicrocopy}</strong>
              {t.ctaMicrocopy.includes('。') ? `。${t.ctaMicrocopy.split('。').slice(1).join('。')}` : ''}
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <SeaOtterLogo className="h-6 w-6 opacity-50" />
            <span className="font-bold text-stone-700">{t.badge}</span>
          </div>
          <div className="flex gap-7">
            <button onClick={onFeedback} className="flex items-center gap-1.5 font-semibold transition-colors hover:text-stone-900">
              <MessageSquare className="h-4 w-4" />
              {t.feedback}
            </button>
            <a href="#" className="font-semibold transition-colors hover:text-stone-900">Instagram</a>
            <a href="#" className="font-semibold transition-colors hover:text-stone-900">{t.contact}</a>
          </div>
          <p>© {new Date().getFullYear()} {t.badge}. {t.rights} · v{APP_VERSION}</p>
        </div>
      </footer>
    </div>
  );
}
