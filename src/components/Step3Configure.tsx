import { useState } from 'react';
import { ConfigGroup, SettingsType, defaultSettings } from '../App';
import { ArrowLeft, CheckCircle2, LayoutTemplate, BoxSelect, Wand2, Languages, HelpCircle, Smile, Minus, PenTool, History, Type, Image } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  editingGroupId: string | null;
  configGroups: ConfigGroup[];
  onSave: (group: ConfigGroup) => void;
  onCancel: () => void;
  language: string;
  onFeedback: () => void;
}

const translations: Record<string, any> = {
  en: {
    title: 'Global Settings',
    desc: 'Define the settings for all your postcards.',
    size: 'Postcard Size',
    sizeUseCase: 'Use case (Size)',
    size4x6: 'Standard Postcard',
    size5x7: 'Large',
    sizeSquare: 'Square',
    sizePolaroid: 'Polaroid',
    sizeCustom: 'Custom',
    fit: 'Image Fit',
    fill: 'Fill',
    fillDesc: 'Stretch or compress to fill (no cropping)',
    border: 'Border',
    borderDesc: 'Keep original aspect ratio with borders on all sides',
    bottomBorder: 'Bottom Border',
    bottomBorderDesc: 'Keep original aspect ratio with border only at the bottom',
    aiFeatures: 'AI Enhancements & Metadata',
    author: 'Photographer / Author (Optional)',
    aiTitle: 'AI Front Title',
    aiTitleDesc: 'Automatically generate a location and title based on the image content.',
    aiBack: 'AI Back Template',
    aiBackDesc: 'Generate a personalized message and layout for the back of the postcard.',
    outputLang: 'Output Language',
    copyStyle: 'Copywriting Style',
    cardStoryLabel: 'Story for this postcard',
    cardStoryPlaceholder: 'Tell the story or mood behind this photo. The AI will use it to design the back and message.',
    styleAuto: 'Auto',
    stylePoetic: 'Poetic',
    styleModern: 'Modern',
    styleWitty: 'Witty',
    styleNostalgic: 'Nostalgic',
    styleMinimalist: 'Minimalist',
    back: 'Back',
    continue: 'Continue',
    width: 'Width (inches)',
    height: 'Height (inches)',
    feedbackHint: 'Feedback & help',
    font: 'Font',
    fontHandwritten: 'Handwritten',
    fontSerif: 'Serif',
    fontSans: 'Sans',
    filter: 'Photo Filter',
    filterNone: 'Original',
    filterSummer: 'Summer',
    filterFilm: 'Film',
    filterGoldenSunset: 'Golden Sunset',
    filterTropical: 'Tropical',
    filterCinematic: 'Cinematic',
    filterPolaroid: 'Polaroid',
    filterVintagePostcard: 'Vintage Postcard',
    filterNordic: 'Nordic',
    filterTokyoNight: 'Tokyo Night',
    filterMoody: 'Moody',
    filterUnderwaterRestore: 'Underwater Restore',
  },
  zh: {
    title: '全局设置',
    desc: '为您的所有明信片定义设置。',
    size: '明信片尺寸',
    sizeUseCase: '适用场景(尺寸)',
    size4x6: '标准明信片',
    size5x7: '大尺寸',
    sizeSquare: '方形',
    sizePolaroid: '拍立得',
    sizeCustom: '自定义',
    fit: '图片适配',
    fill: '顶格 (Fill)',
    fillDesc: '拉伸或压缩以填满 (不裁剪)',
    border: '四周留白 (Border)',
    borderDesc: '保持原始比例，四周留出边框',
    bottomBorder: '底部留白 (Bottom Border)',
    bottomBorderDesc: '保持原始比例，仅在底部留出边框',
    aiFeatures: 'AI 增强与元数据',
    author: '摄影师 / 作者 (可选)',
    aiTitle: 'AI 正面标题',
    aiTitleDesc: '根据图片内容自动生成地点和标题。',
    aiBack: 'AI 背面模板',
    aiBackDesc: '为明信片背面生成个性化消息和布局。',
    outputLang: '输出语言',
    copyStyle: '文案风格',
    cardStoryLabel: '明信片故事',
    cardStoryPlaceholder: '写一段关于这张照片的故事或心情，大模型将根据故事与情感设计背面与文案。',
    styleAuto: '自动判定',
    stylePoetic: '诗情画意',
    styleModern: '现代简约',
    styleWitty: '幽默风趣',
    styleNostalgic: '怀旧感伤',
    styleMinimalist: '极简主义',
    back: '返回',
    continue: '继续',
    width: '宽度 (英寸)',
    height: '高度 (英寸)',
    font: '字体',
    fontHandwritten: '手写',
    fontSerif: '衬线',
    fontSans: '无衬线',
    filter: '照片滤镜',
    filterNone: '原片',
    filterSummer: '夏日',
    filterFilm: '胶片',
    filterGoldenSunset: '金色日落',
    filterTropical: '热带',
    filterCinematic: '电影感',
    filterPolaroid: '拍立得',
    filterVintagePostcard: '复古明信片',
    filterNordic: '北欧',
    filterTokyoNight: '东京之夜',
    filterMoody: '情绪',
    filterUnderwaterRestore: '水下修复',
  },
  ja: {
    title: 'グローバル設定',
    desc: 'すべてのポストカードの設定を定義します。',
    size: 'ポストカードのサイズ',
    sizeUseCase: '用途（サイズ）',
    size4x6: '標準はがき',
    size5x7: '大判',
    sizeSquare: '正方形',
    sizePolaroid: 'チェキ',
    sizeCustom: 'カスタム',
    fit: '画像のフィット',
    fill: '塗りつぶし (Fill)',
    fillDesc: '伸縮して埋める (クロップなし)',
    border: 'ボーダー (Border)',
    borderDesc: '元の比率を維持し、すべての辺に余白を残す',
    bottomBorder: '下部ボーダー (Bottom Border)',
    bottomBorderDesc: '元の比率を維持し、下部のみに余白を残す',
    aiFeatures: 'AI 拡張とメタデータ',
    author: '撮影者 / 著者 (任意)',
    aiTitle: 'AI 表面タイトル',
    aiTitleDesc: '画像の内容に基づいて場所とタイトルを自動生成します。',
    aiBack: 'AI 裏面テンプレート',
    aiBackDesc: 'ポストカードの裏面のメッセージとレイアウトを生成します。',
    outputLang: '出力言語',
    back: '戻る',
    continue: '続行',
    width: '幅 (インチ)',
    height: '高さ (インチ)',
    font: 'フォント',
    fontHandwritten: '手書き',
    fontSerif: 'セリフ',
    fontSans: 'サンセリフ',
    filter: '写真フィルター',
    filterNone: 'オリジナル',
    filterSummer: 'サマー',
    filterFilm: 'フィルム',
    filterGoldenSunset: 'ゴールデンサンセット',
    filterTropical: 'トロピカル',
    filterCinematic: 'シネマティック',
    filterPolaroid: 'ポラロイド',
    filterVintagePostcard: 'ビンテージはがき',
    filterNordic: 'ノルディック',
    filterTokyoNight: '東京ナイト',
    filterMoody: 'ムーディ',
    filterUnderwaterRestore: '水中補正',
  },
  ko: {
    title: '전체 설정',
    desc: '모든 엽서에 대한 설정을 정의합니다.',
    size: '엽서 크기',
    sizeUseCase: '용도(크기)',
    size4x6: '표준 엽서',
    size5x7: '대형',
    sizeSquare: '정사각형',
    sizePolaroid: '폴라로이드',
    sizeCustom: '맞춤',
    fit: '이미지 맞춤',
    fill: '채우기 (Fill)',
    fillDesc: '늘리거나 줄여서 채우기 (자르기 없음)',
    border: '여백 (Border)',
    borderDesc: '모든 면에 여백을 두고 원래 비율 유지',
    bottomBorder: '하단 여백 (Bottom Border)',
    bottomBorderDesc: '하단에만 여백을 두고 원래 비율 유지',
    aiFeatures: 'AI 향상 및 메타데이터',
    author: '사진작가 / 저자 (선택 사항)',
    aiTitle: 'AI 전면 제목',
    aiTitleDesc: '이미지 콘텐츠를 기반으로 위치와 제목을 자동으로 생성합니다.',
    aiBack: 'AI 후면 템플릿',
    aiBackDesc: '엽서 뒷면의 개인화된 메시지와 레이아웃을 생성합니다.',
    outputLang: '출력 언어',
    back: '뒤로',
    continue: '계속하기',
    width: '너비 (인치)',
    height: '높이 (인치)',
    feedbackHint: '피드백 및 도움말',
    font: '글꼴',
    fontHandwritten: '손글씨',
    fontSerif: '세리프',
    fontSans: '산세리프',
    filter: '사진 필터',
    filterNone: '원본',
    filterSummer: '썸머',
    filterFilm: '필름',
    filterGoldenSunset: '골든 선셋',
    filterTropical: '트로피컬',
    filterCinematic: '시네마틱',
    filterPolaroid: '폴라로이드',
    filterVintagePostcard: '빈티지 엽서',
    filterNordic: '노르딕',
    filterTokyoNight: '도쿄의 밤',
    filterMoody: '무디',
    filterUnderwaterRestore: '수중 복원',
  },
  fr: { title: 'Paramètres globaux', desc: 'Définissez les réglages pour toutes vos cartes.', size: 'Taille', back: 'Retour', continue: 'Continuer', feedbackHint: 'Aide' },
  de: { title: 'Globale Einstellungen', desc: 'Einstellungen für alle Ihre Karten.', size: 'Größe', back: 'Zurück', continue: 'Weiter', feedbackHint: 'Hilfe' },
  es: { title: 'Configuración global', desc: 'Define la configuración de tus postales.', size: 'Tamaño', back: 'Atrás', continue: 'Continuar', feedbackHint: 'Ayuda' },
  it: { title: 'Impostazioni globali', desc: 'Imposta le opzioni per le tue cartoline.', size: 'Dimensione', back: 'Indietro', continue: 'Continua', feedbackHint: 'Aiuto' },
  th: { title: 'การตั้งค่าทั่วไป', desc: 'กำหนดการตั้งค่าสำหรับโปสการ์ดทั้งหมด', size: 'ขนาด', back: 'กลับ', continue: 'ดำเนินการต่อ', feedbackHint: 'ความช่วยเหลือ' },
  vi: { title: 'Cài đặt chung', desc: 'Định nghĩa cài đặt cho tất cả bưu thiếp.', size: 'Kích thước', back: 'Quay lại', continue: 'Tiếp tục', feedbackHint: 'Trợ giúp' },
  id: { title: 'Pengaturan global', desc: 'Tentukan pengaturan untuk semua kartu pos.', size: 'Ukuran', back: 'Kembali', continue: 'Lanjutkan', feedbackHint: 'Bantuan' },
  ms: { title: 'Tetapan global', desc: 'Tentukan tetapan untuk semua poskad.', size: 'Saiz', back: 'Kembali', continue: 'Teruskan', feedbackHint: 'Bantuan' },
};

export default function Step3Configure({ editingGroupId, configGroups, onSave, onCancel, language, onFeedback }: Props) {
  const t = { ...translations.en, ...(translations[language] || {}) };
  const existingGroup = editingGroupId ? configGroups.find(g => g.id === editingGroupId) : null;
  
  // Map language code to full language name for AI
  const langMap: Record<string, string> = {
    en: 'English',
    zh: 'Simplified Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    it: 'Italian',
    id: 'Indonesian',
    th: 'Thai',
    vi: 'Vietnamese',
    ms: 'Malay'
  };

  const [settings, setSettings] = useState<SettingsType>(() => {
    const base = { ...defaultSettings, ...(existingGroup?.settings || {}) };
    if (!existingGroup && langMap[language]) {
      return { ...base, aiLanguage: langMap[language] };
    }
    return base;
  });

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      id: 'default',
      name: 'Global Settings',
      settings,
      photoIds: []
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[clamp(1.25rem,4vw,1.5rem)] font-semibold tracking-tight mb-2">
            {t.title}
          </h2>
          <p className="text-stone-500 text-[clamp(0.875rem,2vw,1rem)]">{t.desc}</p>
        </div>
        <button
          type="button"
          onClick={onFeedback}
          title={t.feedbackHint ?? 'Feedback'}
          aria-label={t.feedbackHint ?? 'Feedback'}
          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col pb-8">
        <div className="grid gap-8">
          {/* 适用场景(尺寸) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BoxSelect className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.sizeUseCase || t.size}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {([
                { id: '4x6', label: t.size4x6 || '4×6' },
                { id: '5x7', label: t.size5x7 || '5×7' },
                { id: 'square', label: t.sizeSquare || 'Square' },
                { id: 'polaroid', label: t.sizePolaroid || 'Polaroid' },
                { id: 'custom', label: t.sizeCustom || 'Custom' },
              ] as const).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => updateSetting('size', id)}
                  className={cn(
                    "border-2 rounded-xl p-3 text-center transition-all",
                    settings.size === id
                      ? "border-stone-900 bg-stone-50 text-stone-900 font-medium"
                      : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
            {settings.size === 'custom' && (
              <div className="mt-4 flex gap-4 items-center bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">{t.width}</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="20" 
                    step="0.1"
                    value={settings.customWidth} 
                    onChange={e => updateSetting('customWidth', Number(e.target.value))} 
                    className="w-24 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900" 
                  />
                </div>
                <span className="text-stone-400 mt-4">×</span>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">{t.height}</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="20" 
                    step="0.1"
                    value={settings.customHeight} 
                    onChange={e => updateSetting('customHeight', Number(e.target.value))} 
                    className="w-24 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900" 
                  />
                </div>
              </div>
            )}
          </section>

          {/* Fill Mode */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <LayoutTemplate className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.fit}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => updateSetting('fill', 'fill')}
                className={cn(
                  "border-2 rounded-xl p-4 text-left transition-all",
                  settings.fill === 'fill'
                    ? "border-stone-900 bg-stone-50 text-stone-900 font-medium"
                    : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50/50"
                )}
              >
                <div className="font-medium mb-1">{t.fill}</div>
                <div className="text-sm opacity-80">{t.fillDesc}</div>
              </button>
              <button
                onClick={() => updateSetting('fill', 'border')}
                className={cn(
                  "border-2 rounded-xl p-4 text-left transition-all",
                  settings.fill === 'border'
                    ? "border-stone-900 bg-stone-50 text-stone-900 font-medium"
                    : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50/50"
                )}
              >
                <div className="font-medium mb-1">{t.border}</div>
                <div className="text-sm opacity-80">{t.borderDesc}</div>
              </button>
              <button
                onClick={() => updateSetting('fill', 'bottom-border')}
                className={cn(
                  "border-2 rounded-xl p-4 text-left transition-all",
                  settings.fill === 'bottom-border'
                    ? "border-stone-900 bg-stone-50 text-stone-900 font-medium"
                    : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50/50"
                )}
              >
                <div className="font-medium mb-1">{t.bottomBorder}</div>
                <div className="text-sm opacity-80">{t.bottomBorderDesc}</div>
              </button>
            </div>
          </section>

          {/* Font */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.font}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'handwritten' as const, label: t.fontHandwritten },
                { id: 'serif' as const, label: t.fontSerif },
                { id: 'sans' as const, label: t.fontSans },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting('font', opt.id)}
                  className={cn(
                    "py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium",
                    settings.font === opt.id
                      ? "border-stone-900 bg-stone-50 text-stone-900"
                      : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* 照片滤镜 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.filter || 'Photo Filter'}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { id: 'original' as const, label: t.filterNone || 'Original' },
                { id: 'summer' as const, label: t.filterSummer || 'Summer' },
                { id: 'film' as const, label: t.filterFilm || 'Film' },
                { id: 'goldenSunset' as const, label: t.filterGoldenSunset || 'Golden Sunset' },
                { id: 'tropical' as const, label: t.filterTropical || 'Tropical' },
                { id: 'cinematic' as const, label: t.filterCinematic || 'Cinematic' },
                { id: 'polaroid' as const, label: t.filterPolaroid || 'Polaroid' },
                { id: 'vintagePostcard' as const, label: t.filterVintagePostcard || 'Vintage Postcard' },
                { id: 'nordic' as const, label: t.filterNordic || 'Nordic' },
                { id: 'tokyoNight' as const, label: t.filterTokyoNight || 'Tokyo Night' },
                { id: 'moody' as const, label: t.filterMoody || 'Moody' },
                { id: 'underwaterRestore' as const, label: t.filterUnderwaterRestore || 'Underwater Restore' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting('filter', opt.id)}
                  className={cn(
                    "py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium",
                    settings.filter === opt.id
                      ? "border-stone-900 bg-stone-50 text-stone-900"
                      : "border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                Filter intensity
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round((settings.filterIntensity ?? 0.8) * 100)}
                onChange={(e) => updateSetting('filterIntensity', Number(e.target.value) / 100)}
                className="w-full"
              />
              <div className="mt-1 text-xs text-stone-500">
                {Math.round((settings.filterIntensity ?? 0.8) * 100)}%
              </div>
            </div>
          </section>

          {/* AI Features */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.aiFeatures}</h3>
            </div>
            <div className="space-y-4">
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">{t.author}</label>
                <input
                  type="text"
                  value={settings.authorName || ''}
                  onChange={(e) => updateSetting('authorName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <label className="flex items-start gap-4 p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.aiTitle}
                  onChange={(e) => updateSetting('aiTitle', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <div>
                  <div className="font-medium text-stone-900 mb-1">{t.aiTitle}</div>
                  <div className="text-sm text-stone-500">{t.aiTitleDesc}</div>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.aiBackTemplate}
                  onChange={(e) => updateSetting('aiBackTemplate', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <div>
                  <div className="font-medium text-stone-900 mb-1">{t.aiBack}</div>
                  <div className="text-sm text-stone-500">{t.aiBackDesc}</div>
                </div>
              </label>
            </div>
          </section>

          {/* AI Language Selection */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Languages className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.outputLang}</h3>
            </div>
            <select
              value={settings.aiLanguage}
              onChange={(e) => updateSetting('aiLanguage', e.target.value)}
              className="w-full border-2 border-stone-200 rounded-xl p-4 text-stone-900 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors appearance-none bg-white"
            >
              <option value="Simplified Chinese">简体中文 (Simplified Chinese)</option>
              <option value="Traditional Chinese">繁體中文 (Traditional Chinese)</option>
              <option value="English">English</option>
              <option value="Japanese">日本語 (Japanese)</option>
              <option value="Korean">한국어 (Korean)</option>
              <option value="Spanish">Español (Spanish)</option>
              <option value="French">Français (French)</option>
              <option value="German">Deutsch (German)</option>
            </select>
          </section>

          {/* 明信片故事 - 根据故事与情感设计背面与文案 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <PenTool className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.cardStoryLabel}</h3>
            </div>
            <textarea
              value={settings.cardStory ?? ''}
              onChange={(e) => updateSetting('cardStory', e.target.value)}
              placeholder={t.cardStoryPlaceholder}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all resize-y min-h-[100px] text-stone-900 placeholder:text-stone-400"
            />
          </section>

          {/* Copywriting Style Selection */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-stone-400" />
              <h3 className="font-medium text-stone-900">{t.copyStyle}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'auto', label: t.styleAuto, icon: Wand2 },
                { id: 'poetic', label: t.stylePoetic, icon: PenTool },
                { id: 'modern', label: t.styleModern, icon: LayoutTemplate },
                { id: 'witty', label: t.styleWitty, icon: Smile },
                { id: 'nostalgic', label: t.styleNostalgic, icon: History },
                { id: 'minimalist', label: t.styleMinimalist, icon: Minus },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => updateSetting('copywritingStyle', style.id as any)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                    settings.copywritingStyle === style.id
                      ? "border-stone-900 bg-stone-50 text-stone-900"
                      : "border-stone-100 text-stone-400 hover:border-stone-200 hover:bg-stone-50/50"
                  )}
                >
                  <style.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{style.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-stone-100">
        <button onClick={onCancel} className="text-stone-500 hover:text-stone-900 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </button>
        <button onClick={handleSave} className="bg-stone-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center gap-2">
          {t.continue} <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
