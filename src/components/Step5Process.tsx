/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react';
import { Photo, ConfigGroup, SettingsType, ProcessedPostcard, User, defaultSettings } from '../App';
import { ArrowLeft, Download, Loader2, CheckCircle2, RefreshCw, Check, Edit3, Clock, ShieldCheck, Wand2, X, HelpCircle, Share2, Move } from 'lucide-react';
import JSZip from 'jszip';
import { cn } from '../lib/utils';
import { loadImage } from '../lib/imageUtils';
import { brandConfig } from '../config/brand';
import { applyFilterById } from '../lib/filter-engine';
import { isSupabaseConnected, supabase } from '../lib/supabaseClient';
import { updateUserCredits, getCreditsPerPostcard } from '../lib/credits';
import { syncGeneratedCount } from '../lib/profileSync';
import { logEvent } from '../lib/events';
import { buildShareCardBlob, type ShareType } from '../lib/shareCard';
import { getShareBranding } from '../lib/shareBranding';
import { getPublishedPromptContent } from '../lib/promptService';
import { resolveLocationSource } from '../lib/locationSource';

const withTimeout = <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
};

interface Props {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;
  configGroups: ConfigGroup[];
  history: ProcessedPostcard[];
  setHistory: React.Dispatch<React.SetStateAction<ProcessedPostcard[]>>;
  onBack: () => void;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  setShowPricing: (show: boolean) => void;
  editId?: string | null;
  onClearEdit?: () => void;
  onOpenHistory?: () => void;
  language: string;
  onFeedback: () => void;
}

const translations: Record<string, any> = {
  en: {
    processing: 'Processing your postcards...',
    wait: 'Please wait while AI generates your memories.',
    creditsError: 'Not enough credits. You need {need} credits but have {have}.',
    error: 'An error occurred during processing.',
    results: 'Your Postcards',
    resultsDesc: 'AI has generated {count} postcards for you.',
    downloadAll: 'Download All',
    back: 'Back to Start',
    edit: 'Edit',
    save: 'Save Changes',
    cancel: 'Cancel',
    regenerate: 'Regenerate',
    saveAsNew: 'Save as New',
    preview: 'Preview',
    front: 'Front',
    backSide: 'Back',
    content: 'Content',
    style: 'Style',
    title: 'Title',
    location: 'Location',
    message: 'Message',
    author: 'Author',
    date: 'Date',
    fontSize: 'Font Size',
    color: 'Color',
    position: 'Position',
    retention: 'Retention',
    security: 'Security',
    encrypted: 'End-to-end encrypted',
    processingStep: 'Step {step} of {total}',
    free: 'Free Member',
    vip: 'VIP Member',
    historyTitle: 'Processing History & Storage',
    historyDesc: 'Your generated postcards are saved securely. Based on your current {level} membership, files will be retained for:',
    startOver: 'Start Over',
    batch: 'Batch',
    postcards: 'Postcards',
    yesterday: 'Yesterday',
    lastWeek: 'Last Week',
    expiringSoon: 'Expiring soon',
    expired: 'Expired',
  },
  zh: {
    processing: '正在处理您的明信片...',
    wait: '请稍候，AI 正在生成您的回忆。',
    creditsError: '积分不足。您需要 {need} 积分，但当前只有 {have} 积分。',
    error: '处理过程中发生错误。',
    results: '您的明信片',
    resultsDesc: 'AI 已为您生成了 {count} 张明信片。',
    downloadAll: '下载全部',
    download: '下载',
    back: '返回开始',
    edit: '编辑',
    save: '保存更改',
    saveOverwrite: '覆盖保存',
    cancel: '取消',
    regenerate: '重新生成',
    saveAsNew: '保存为新版本',
    preview: '预览',
    front: '正面',
    backSide: '背面',
    content: '内容',
    style: '样式',
    title: '标题',
    location: '地点',
    message: '正文',
    author: '作者',
    date: '日期',
    fontSize: '字号',
    color: '颜色',
    position: '位置',
    retention: '保存期限',
    security: '安全',
    encrypted: '端到端加密',
    processingStep: '第 {step} 步，共 {total} 步',
    free: '免费会员',
    vip: 'VIP 会员',
    historyTitle: '处理历史与存储',
    historyDesc: '您的明信片已安全保存。根据您当前的 {level} 等级，文件将保留：',
    startOver: '重新开始',
    viewHistory: '查看历史记录',
    batch: '批次',
    postcards: '张明信片',
    yesterday: '昨天',
    lastWeek: '上周',
    expiringSoon: '即将过期',
    expired: '已过期',
    mergedDownload: '合并下载 (正反面)',
    individualDownload: '分别下载',
  },
  ja: {
    processing: 'ポストカードを処理中...',
    wait: 'AIが思い出を生成しています。少々お待ちください。',
    creditsError: 'クレジットが不足しています。{need} クレジットが必要ですが、現在 {have} クレジットです。',
    error: '処理中にエラーが発生しました。',
    results: 'あなたのポストカード',
    resultsDesc: 'AIが {count} 枚のポストカードを生成しました。',
    downloadAll: 'すべてダウンロード',
    back: 'スタートに戻る',
    edit: '編集',
    save: '変更を保存',
    cancel: 'キャンセル',
    regenerate: '再生成',
    saveAsNew: '新規保存',
    preview: 'プレビュー',
    front: '表面',
    backSide: '裏面',
    content: '内容',
    style: 'スタイル',
    title: 'タイトル',
    location: '場所',
    message: 'メッセージ',
    author: '著者',
    date: '日付',
    fontSize: 'フォントサイズ',
    color: 'カラー',
    position: '位置',
    retention: '保存期間',
    security: 'セキュリティ',
    encrypted: 'エンドツーエンド暗号化',
    processingStep: 'ステップ {step} / {total}',
    free: '無料会員',
    pro: 'Pro 会员',
    supreme: 'Super 会员',
    historyTitle: '処理履歴とストレージ',
    historyDesc: '生成されたポストカードは安全に保存されます。現在の {level} メンバーシップに基づいて、ファイルは次の期間保持されます：',
    startOver: '最初からやり直す',
    batch: 'バッチ',
    postcards: '枚のポストカード',
    yesterday: '昨日',
    lastWeek: '先週',
    expiringSoon: 'まもなく期限切れ',
    expired: '期限切れ',
  },
  ko: {
    processing: '엽서 처리 중...',
    wait: 'AI가 추억을 생성하는 동안 잠시 기다려 주세요.',
    creditsError: '크레딧이 부족합니다. {need} 크레딧이 필요하지만 현재 {have} 크레딧이 있습니다.',
    error: '처리 중 오류가 발생했습니다.',
    results: '나의 엽서',
    resultsDesc: 'AI가 {count}개의 엽서를 생성했습니다.',
    downloadAll: '모두 다운로드',
    back: '처음으로 돌아가기',
    edit: '편집',
    save: '변경 사항 저장',
    cancel: '취소',
    regenerate: '재생성',
    saveAsNew: '새로 저장',
    preview: '미리보기',
    front: '앞면',
    backSide: '뒷면',
    content: '내용',
    style: '스타일',
    title: '제목',
    location: '위치',
    message: '메시지',
    author: '저자',
    date: '날짜',
    fontSize: '글꼴 크기',
    color: '색상',
    position: '위치',
    retention: '보관 기간',
    security: '보안',
    encrypted: '종단간 암호화',
    processingStep: '{step}단계 / 총 {total}단계',
    free: '무료 회원',
    pro: 'Pro 회원',
    supreme: 'Super 회원',
    historyTitle: '처리 기록 및 저장',
    historyDesc: '생성된 엽서는 안전하게 저장됩니다. 현재 {level} 멤버십에 따라 파일은 다음 기간 동안 보관됩니다:',
    startOver: '다시 시작',
    batch: '배치',
    postcards: '개의 엽서',
    yesterday: '어제',
    lastWeek: '지난주',
    expiringSoon: '곧 만료',
    expired: '만료됨',
  }
};

export default function Step5Process({ 
  photos, 
  setPhotos, 
  configGroups, 
  history, 
  setHistory, 
  onBack, 
  user, 
  setUser, 
  setShowPricing, 
  editId, 
  onClearEdit, 
  onOpenHistory,
  language,
  onFeedback
}: Props) {
  const t = translations[language] || translations.en;
  const cleanLocationPart = (raw?: string) => {
    if (!raw) return '';
    const first = raw
      .split(/[;；|/]+/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    return first || '';
  };
  const cleanLocationDisplay = (raw?: string) => {
    if (!raw) return '';
    const normalizedKey = (val: string) =>
      val
        .replace(/國/g, '国')
        .replace(/\s+/g, '')
        .toLowerCase();
    const parts = raw
      .split(/[，,]+/)
      .map((s) => cleanLocationPart(s))
      .filter(Boolean);
    const seen = new Set<string>();
    const unique = parts.filter((part) => {
      const key = normalizedKey(part);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.join(', ');
  };
  const getExifLocationName = (exif?: Photo['exif']) => {
    if (!exif) return '';
    const city = cleanLocationPart(exif.city);
    const country = cleanLocationPart(exif.country);
    const region = cleanLocationPart(exif.region);
    if (city) return [city, country].filter(Boolean).join(', ');
    if (region || country) return [region, country].filter(Boolean).join(', ');
    if (exif.location) {
      const lat = Number(exif.location.lat);
      const lng = Number(exif.location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      }
    }
    return '';
  };
  const isUnreliableInferredLocation = (raw?: string) => {
    const value = String(raw || '').trim();
    if (!value) return false;
    return /^(家中|家里|家裡|在家|室内|室內|室内一角|室內一角|屋内|屋內|房间|房間|客厅|客廳|卧室|臥室|厨房|廚房|home|at home|indoors?|inside|room|living room)$/i.test(value);
  };
  const cleanInferredLocation = (raw?: string) => {
    const cleaned = cleanLocationDisplay(String(raw || '').trim());
    return isUnreliableInferredLocation(cleaned) ? '' : cleaned;
  };
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [freeRetentionDays, setFreeRetentionDays] = useState(7);
  const [vipRetentionDays, setVipRetentionDays] = useState(0); // 0 表示永久
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<ProcessedPostcard | null>(null);
  const [editTab, setEditTab] = useState<'content' | 'style'>('content');
  const [currentBatchIds, setCurrentBatchIds] = useState<string[]>([]);
  const [livePreview, setLivePreview] = useState<{ front: string, back: string } | null>(null);
  const [rewritingState, setRewritingState] = useState<{ id: string, field: string } | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [batchBackState, setBatchBackState] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 });
  const isDraggingFrontText = useRef(false);

  const invokePostcardAi = async (action: 'chat' | 'image', payload: Record<string, unknown>) => {
    const { data, error: functionError } = await supabase.functions.invoke('postcard-ai', {
      body: { action, payload },
    });
    if (functionError) {
      let detail = functionError.message || 'Supabase AI function failed';
      const context = (functionError as { context?: Response }).context;
      if (context) {
        try {
          const body = await context.clone().json();
          detail = body?.error?.message || body?.error || detail;
        } catch {
          // Keep the SDK error when the response body is not JSON.
        }
      }
      throw new Error(detail);
    }
    if (data?.error) {
      const message = typeof data.error === 'string' ? data.error : data.error.message;
      throw new Error(message || 'OpenAI request failed');
    }
    return data;
  };

  const getGeneratedImageSource = (response: any) => {
    const image = response?.data?.[0];
    if (image?.b64_json) {
      const mimeType = image.mime_type || 'image/png';
      return `data:${mimeType};base64,${image.b64_json}`;
    }
    if (image?.url) return image.url;
    return null;
  };

  const slugifyTheme = (raw?: string) =>
    String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(new Error('Failed to read blob'));
      fr.readAsDataURL(blob);
    });

  useEffect(() => {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    const freeRaw = parseInt(ls.getItem('admin_history_retention_free_days') || '7', 10);
    const vipRaw = parseInt(ls.getItem('admin_history_retention_vip_days') || '0', 10);
    if (Number.isFinite(freeRaw) && freeRaw > 0) setFreeRetentionDays(freeRaw);
    if (Number.isFinite(vipRaw) && vipRaw >= 0) setVipRetentionDays(vipRaw);
  }, []);

  useEffect(() => {
    if (editId) {
      setEditingResultId(editId);
    }
  }, [editId]);

  useEffect(() => {
    let isMounted = true;
    
    const processPhotos = async () => {
      const processStart = Date.now();

      // Opening an existing postcard for editing must never start a new batch or charge credits.
      if (editId) {
        setIsProcessing(false);
        return;
      }

      const configuredPhotos = photos.filter(p => p.groupId !== null);
      if (configuredPhotos.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Strict check: Must be logged in to process
      if (!user.isLoggedIn) {
        const defaultPromo = (() => {
          const v = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_credits_default_promo') : null;
          const n = v != null ? parseInt(v, 10) : NaN;
          return Number.isFinite(n) && n >= 0 ? n : 3;
        })();
        setError(
          language === 'zh'
            ? `请先登录以获取 ${defaultPromo} 个免费积分。`
            : `Please log in first to get ${defaultPromo} free credits.`
        );
        setIsProcessing(false);
        setShowPricing(true);
        return;
      }

      const creditsPerCard = await getCreditsPerPostcard();
      if (creditsPerCard > 10) {
        setError(
          language === 'zh'
            ? `后台「每张明信片消耗积分」配置异常（${creditsPerCard}）。请在 Admin 设置中改为 0-10 后再试。`
            : `Abnormal credits-per-postcard setting (${creditsPerCard}). Please set it to 0-10 in Admin Settings and retry.`
        );
        setIsProcessing(false);
        return;
      }
      const aiPhotosCount = configuredPhotos.reduce((count, photo) => {
        const group = configGroups.find(g => g.id === photo.groupId);
        const settings = { ...defaultSettings, ...(group?.settings || {}) };
        const backMode = settings.backDesignMode ?? (settings.aiBackTemplate ? 'ai' : 'template');
        const frontMode = settings.frontAiMode ?? (settings.aiTitle ? 'title_location' : 'none');
        const needFrontTitle = frontMode === 'title_location' || frontMode === 'title_only';
        const needFrontLocation = frontMode === 'title_location' || frontMode === 'location_only';
        const hasExifLocation = !!getExifLocationName(photo.exif);
        const usesAi = needFrontTitle || (needFrontLocation && !hasExifLocation) || backMode === 'ai';
        return count + (usesAi ? 1 : 0);
      }, 0);
      const totalNeed = creditsPerCard * aiPhotosCount;
      if (user.credits < totalNeed) {
        setError(t.creditsError.replace('{need}', totalNeed.toString()).replace('{have}', user.credits.toString()));
        setIsProcessing(false);
        setShowPricing(true);
        return;
      }

      // 预计算每张图是否必须加本站信息：
      // - 勾选开启时：全部背面都加
      // - 勾选关闭且有付费积分时：先消耗付费积分；付费用尽后，消耗到赠送积分的图片强制加
      const watermarkByPhotoId = new Map<string, boolean>();
      let remainPaid = Math.max(0, user.paid_credits ?? 0);
      let remainPromo = Math.max(0, user.promo_credits ?? 0);
      for (const photo of configuredPhotos) {
        const group = configGroups.find(g => g.id === photo.groupId);
        const settings = { ...defaultSettings, ...(group?.settings || {}) };
        const backMode = settings.backDesignMode ?? (settings.aiBackTemplate ? 'ai' : 'template');
        const brandingEnabled = settings.backBrandingEnabled !== false;
        const frontMode = settings.frontAiMode ?? (settings.aiTitle ? 'title_location' : 'none');
        const needFrontTitle = frontMode === 'title_location' || frontMode === 'title_only';
        const needFrontLocation = frontMode === 'title_location' || frontMode === 'location_only';
        const hasExifLocation = !!getExifLocationName(photo.exif);
        const usesAi = needFrontTitle || (needFrontLocation && !hasExifLocation) || backMode === 'ai';
        const cost = usesAi ? creditsPerCard : 0;

        if (backMode !== 'none' && brandingEnabled) {
          watermarkByPhotoId.set(photo.id, true);
        } else {
          let promoUsed = false;
          if (cost > 0) {
            const paidUsed = Math.min(remainPaid, cost);
            remainPaid -= paidUsed;
            const left = cost - paidUsed;
            if (left > 0) {
              const usePromo = Math.min(remainPromo, left);
              remainPromo -= usePromo;
              promoUsed = usePromo > 0;
            }
          }
          watermarkByPhotoId.set(photo.id, promoUsed);
        }
      }

      const captionPromptGuidance = await getPublishedPromptContent('caption_generation_default').catch(() => '');

      try {
        const newResults: ProcessedPostcard[] = [];
        const concurrencyLimit = 3;
        let activeCount = 0;
        let currentIndex = 0;
        let completedCount = 0;

        const processNext = async () => {
          if (currentIndex >= configuredPhotos.length || !isMounted) return;
          const i = currentIndex++;
          activeCount++;
          
          const photo = configuredPhotos[i];
          const group = configGroups.find(g => g.id === photo.groupId);
          
          if (group) {
            // 确保与 defaultSettings 合并，避免 aiTitle/aiBackTemplate 等关键项丢失（如仅修改滤镜时）
            const settings = { ...defaultSettings, ...(group.settings || {}) };

            try {
              // 1. Load image
              const img = await loadImage(photo.url);
              const imgBase64 = getCompressedBase64(img, 1200, 0.85);
              
              // 2. AI Analysis
              let title = "";
              let location = "";
              let message = "";
              let theme = "elegant";
              let postmark = "";
              let artisticIcons: string[] = [];
              let generatedBackImageBase64: string | null = null;
              let textPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-left';
              const backMode = settings.backDesignMode ?? (settings.aiBackTemplate ? 'ai' : 'template');
              const frontMode = settings.frontAiMode ?? (settings.aiTitle ? 'title_location' : 'none');
              const needFrontTitle = frontMode === 'title_location' || frontMode === 'title_only';
              const needFrontLocation = frontMode === 'title_location' || frontMode === 'location_only';
              const hasExifLocation = !!getExifLocationName(photo.exif);
              
              // AI 开关：任一项启用则运行 AI；纯滤镜模式（都关闭）不调用 AI。
              const runAi = needFrontTitle || (needFrontLocation && !hasExifLocation) || backMode === 'ai';
              if (runAi) {
                const base64Data = getCompressedBase64(img);
                
                try {
                  // 1. Define Style Instructions
                  const styleInstructions: Record<string, string> = {
                    auto: "Automatically determine the best style based on the image content. If landscape, be poetic. If street/urban, be modern.",
                    poetic: "STYLE: Poetic & Lyrical. Use metaphors, classical imagery, or rhythmic prose. Tone: Elegant, deep, artistic. Example: '山海入怀，万物皆诗' (Mountains and seas in my heart, all things are poetry).",
                    modern: "STYLE: Modern & Direct. Use contemporary, straightforward language. Tone: Fresh, urban, direct. Example: '在东京街头，遇见一场不期而至的雨' (Meeting an unexpected rain on the streets of Tokyo).",
                    witty: "STYLE: Witty & Humorous. Use a clever, slightly ironic, or playful tone. Tone: Wry, funny, personal. Example: '这里的猫比人还多，而且它们看起来都比我有钱' (More cats than people here, and they all look richer than me).",
                    nostalgic: "STYLE: Nostalgic & Sentimental. Use a warm, slightly melancholic tone. Tone: Warm, reflective, timeless. Example: '风里有旧时光的味道，像极了小时候的夏天' (The wind smells like old times, just like the summers of childhood).",
                    minimalist: "STYLE: Minimalist & Concise. Use extremely short, punchy phrases. 3-5 words max for title. Tone: Zen, essence-focused. Example: '静谧。深蓝。' (Quiet. Deep blue.)."
                  };
                  const currentStyle = styleInstructions[settings.copywritingStyle] || styleInstructions.auto;

                  // 2. Build Analysis Prompt
                  let analysisPrompt = `You are an expert graphic designer, a master photographer, and a world-class poet. Your task is to analyze this photo to create a breathtaking, elegant postcard.

1. Visual Analysis: Identify the primary subject, the context/location, and the overall mood.
2. Spatial Composition: Find the largest "negative space" for text placement.
3. Literary Creation: Write a title and message that STRICTLY follows the ${settings.copywritingStyle} style.
4. Back Template Direction: Choose a theme that also controls the postcard-back template: modern=clean right sidebar, vintage=gallery/memo layout, handwritten=soft personal note, classic=traditional split postcard.
5. Back Image Prompt: Write a prompt for a subtle decorative postcard-back motif, not a literal redraw.

MANDATORY STYLE: ${currentStyle}`;

                  if (captionPromptGuidance.trim()) {
                    analysisPrompt += `\n\nADMIN PUBLISHED PROMPT GUIDANCE:\n${captionPromptGuidance.trim()}`;
                  }

                  // EXIF 地点与日期：要求模型在标题与背面文案中优先参考 EXIF，而不是随意猜城市
                  let exifLocationLabel = "";
                  if (photo.exif) {
                    const loc = getExifLocationName(photo.exif);
                    if (loc) {
                      exifLocationLabel = loc;
                      analysisPrompt += `\nPhoto EXIF location (most reliable real-world place): ${exifLocationLabel}.`;
                    }
                    if (photo.exif.location) {
                      analysisPrompt += `\nGPS Coordinates: Latitude ${photo.exif.location.lat}, Longitude ${photo.exif.location.lng}. Use these only to refine the same real-world place, do NOT guess a different city or country.`;
                    }
                    if (photo.exif.date) {
                      analysisPrompt += `\nPhoto EXIF date: ${photo.exif.date}. You may subtly reflect the season or time of year, but do not explicitly print the full date unless it feels natural.`;
                    }
                  }

                  analysisPrompt += `
IMPORTANT: All generated text MUST be strictly in ${settings.aiLanguage} language. 
If the target language is Chinese:
- Do NOT include any English characters.
- The 'title' (front) MUST be a short phrase (max 12 chars) in ${settings.copywritingStyle} style.
- The 'message' (back) MUST be a natural observation (max 25 words) in ${settings.copywritingStyle} style, tightly connected to the title.
- AVOID clichés like "愿你...", "在这个喧嚣的世界里". 
- ONLY describe what is ACTUALLY visible in the photo, and keep it consistent with the EXIF location if provided.
- For 'location_name': If EXIF location exists, base it on that real-world place (city / region / country). Only when EXIF has no location, you may use a poetic generic one (e.g., "街角", "海边").
- If there is no EXIF/GPS location and no recognizable public place, return an empty string for 'location_name'. Never use private/vague guesses such as "家中", "家里", "室内", "房间", "home", or "indoors" as a location.
- THE OVERALL TONE MUST BE FORCEFULLY ${settings.copywritingStyle.toUpperCase()}.

Output JSON strictly in this format:
{
  "thought_process": "Brainstorm 3 options in ${settings.copywritingStyle} style, then pick the best one.",
  "subject": "Main subject",
  "context": "Context/location",
  "general_elements": "Key visual elements",
  "location_name": "Specific location name",
  "mood": "Atmosphere",
  "color_palette": ["#hex1", "#hex2"],
  "title": "Title in ${settings.copywritingStyle} style",
  "message": "Message in ${settings.copywritingStyle} style",
  "theme": "One of: 'classic', 'modern', 'vintage', 'handwritten'. Choose based on the image and desired back template.",
  "postmark": "Short postmark text",
  "artistic_icons": ["icon1", "icon2"],
  "text_position": "One of: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'",
  "back_image_prompt": "Prompt for a subtle decorative postcard-back motif"
}`;

                  const analysisResponse = await withTimeout(
                    invokePostcardAi('chat', {
                      model: "gpt-4o-mini",
                      temperature: 0.7,
                      messages: [
                        {
                          role: "user",
                          content: [
                            { type: "text", text: analysisPrompt },
                            {
                              type: "image_url",
                              image_url: {
                                url: base64Data,
                              },
                            },
                          ],
                        },
                      ],
                      response_format: { type: "json_object" },
                    }),
                    60000,
                    "AI Analysis timed out."
                  );

                  const analysisData = JSON.parse(analysisResponse.choices?.[0]?.message?.content || "{}");

                  // 3. 根据开关和 EXIF 更新文字与位置
                  if (needFrontTitle && analysisData.title) {
                    title = analysisData.title;
                  }

                  let analysisLocation = "";
                  if (analysisData.location_name) {
                    analysisLocation = cleanInferredLocation(analysisData.location_name);
                  }

                  // 尝试从 EXIF 提取地点信息，优先使用真实位置而不是模型臆测
                  const exifLocationName = getExifLocationName(photo.exif);
                  if (needFrontLocation) {
                    if (exifLocationName) {
                      location = exifLocationName;
                    } else if (analysisLocation) {
                      location = analysisLocation;
                    }
                  } else if (!needFrontTitle && exifLocationName) {
                    // 仅在纯本地前景文本模式下，保留 EXIF 地点兜底
                    location = exifLocationName;
                  }

                  // 背面文案与背面图：仅在 AI 背面模式下生成，避免浪费 token
                  if (backMode === 'ai') {
                    if (analysisData.message) {
                      let msg = Array.isArray(analysisData.message) ? analysisData.message.join('\n\n') : analysisData.message;
                      message = String(msg || '').trim();
                    }
                    if (analysisData.theme) theme = analysisData.theme;
                    if (analysisData.postmark) postmark = analysisData.postmark;
                    if (analysisData.artistic_icons) artisticIcons = analysisData.artistic_icons;
                    if (
                      analysisData.text_position &&
                      ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(analysisData.text_position)
                    ) {
                      textPosition = analysisData.text_position;
                    }

                    // 首轮批量生成不再等待 DALL·E 背面图。
                    // 背面先使用 AI 文案 + 自动模板，用户需要时可在编辑页按需生成装饰图。
                    generatedBackImageBase64 = null;
                  }
                } catch (aiErr) {
                  console.error("AI Analysis failed", aiErr);
                  throw new Error(
                    language === 'zh'
                      ? `AI 生成失败：${aiErr instanceof Error ? aiErr.message : '服务暂不可用'}`
                      : `AI generation failed: ${aiErr instanceof Error ? aiErr.message : 'service unavailable'}`
                  );
                }
              }

              // 非 AI 路径下，也允许用 EXIF 填充地点（当选择了仅地点/标题+地点时）
              if (!runAi && needFrontLocation && !location && photo.exif) {
                location = getExifLocationName(photo.exif);
              }

              if (!needFrontTitle) title = '';
              if (!needFrontLocation) location = '';
              location = cleanLocationDisplay(location);
              if (!getExifLocationName(photo.exif) && isUnreliableInferredLocation(location)) {
                location = '';
              }
              const latitude = typeof photo.exif?.location?.lat === 'number' ? photo.exif.location.lat : undefined;
              const longitude = typeof photo.exif?.location?.lng === 'number' ? photo.exif.location.lng : undefined;
              const locationMeta = resolveLocationSource({
                displayLocation: location,
                city: photo.exif?.city,
                region: photo.exif?.region,
                country: photo.exif?.country,
                latitude,
                longitude,
                hasExifGps: !!photo.exif?.location,
                hasExifText: !!(photo.exif?.city || photo.exif?.region || photo.exif?.country),
              });

              const defaultFrontStyle: ProcessedPostcard['frontStyle'] = { fontSize: 5, color: '#ffffff', position: textPosition };
              const defaultBackStyle: ProcessedPostcard['backStyle'] = { fontSize: 3.2, color: '#44403c' };
              
              let dateStr = "";
              if (photo.exif?.date) {
                dateStr = photo.exif.date.replace(/-/g, '.');
              } else if (photo.file?.lastModified) {
                const captureDate = new Date(photo.file.lastModified);
                if (!isNaN(captureDate.getTime())) {
                  const y = captureDate.getFullYear();
                  const m = String(captureDate.getMonth() + 1).padStart(2, '0');
                  const d = String(captureDate.getDate()).padStart(2, '0');
                  dateStr = `${y}.${m}.${d}`;
                }
              }
              if (!dateStr) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                dateStr = `${y}.${m}.${d}`;
              }
              const authorStr = settings.authorName || '';
              const displayDate = settings.showDate === false ? '' : dateStr;
              
              const useWatermark = watermarkByPhotoId.get(photo.id) === true;
              const frontDataUrl = await generateFront(img, title, location, theme, settings, defaultFrontStyle, authorStr, displayDate, useWatermark && backMode === 'none');
              const backDataUrl = backMode === 'none'
                ? ''
                : await generateBack(
                    img,
                    message,
                    location,
                    postmark,
                    theme,
                    settings,
                    defaultBackStyle,
                    authorStr,
                    dateStr,
                    artisticIcons,
                    generatedBackImageBase64 || undefined,
                    useWatermark
                  );

              newResults.push({
                id: photo.id,
                frontUrl: frontDataUrl,
                backUrl: backDataUrl,
                timestamp: Date.now(),
                originalPhotoId: photo.id,
                frontDataUrl,
                backDataUrl,
                title,
                location,
                message,
                theme,
                iconEmoji: '',
                decorativeIcons: artisticIcons,
                postmark,
                author: authorStr,
                date: displayDate,
                draftTitle: title,
                draftLocation: location,
                draftMessage: message,
                draftAuthor: authorStr,
                draftDate: displayDate,
                selected: true,
                imgUrl: imgBase64,
                settings: settings,
                createdAt: Date.now(),
                frontStyle: defaultFrontStyle,
                backStyle: defaultBackStyle,
                draftFrontStyle: defaultFrontStyle,
                draftBackStyle: defaultBackStyle,
                generatedBackImage: generatedBackImageBase64 || undefined,
                watermark: useWatermark,
                city: photo.exif?.city || undefined,
                country: photo.exif?.country || undefined,
                latitude,
                longitude,
                theme_slug: slugifyTheme(theme),
                locationSource: locationMeta.locationSource,
                rawLocationLabel: locationMeta.rawLocationLabel,
                locationConfidence: locationMeta.locationConfidence,
                mapEligible: locationMeta.mapEligible,
                rejectedLocationReason: locationMeta.rejectedLocationReason,
              });
            } catch (e: any) {
              console.error("AI Generation failed for image", i, e);
              throw new Error(`AI Processing failed for Image ${i + 1}: ${e.message || e}`);
            }
          }

          completedCount++;
          setProgress(Math.round((completedCount / configuredPhotos.length) * 100));
          activeCount--;
          await processNext();
        };

        const workers = [];
        for (let i = 0; i < Math.min(concurrencyLimit, configuredPhotos.length); i++) {
          workers.push(processNext());
        }
        await Promise.all(workers);

        if (isMounted) {
          setHistory(prev => [...newResults, ...prev]);
          setCurrentBatchIds(newResults.map(r => r.id));
          setPhotos([]);
          setIsProcessing(false);

          // 记录一次完整成功生成，用于后台 SYSTEM ACTIVITY 统计
          const durationMs = Date.now() - processStart;
          logEvent('generation_completed', {
            total_photos: configuredPhotos.length,
            ai_photos: aiPhotosCount,
            duration_ms: durationMs,
          }).catch(() => {});

          const totalUse = totalNeed;

          // 调用统一积分函数，扣减本次生成消耗
          const uid = user.id;
          if (uid && isSupabaseConnected && totalUse > 0) {
            updateUserCredits(uid, -totalUse, 'generation_cost', {
              referenceId: newResults[0]?.id,
              notes: `Generate ${configuredPhotos.length} postcards`,
              operator: 'system',
              bucket: null,
            })
              .then((res) => {
                if (!res.ok || !res.data) return;
                const newCount = (user.generatedCount ?? 0) + configuredPhotos.length;
                syncGeneratedCount(uid, newCount, { lastActiveAt: new Date() }).catch(() => {});
                setUser((prev) => ({
                  ...prev,
                  credits: res.data!.total_credits,
                  promo_credits: res.data!.promo_credits,
                  paid_credits: res.data!.paid_credits,
                  generatedCount: newCount,
                }));
              })
              .catch((e) => {
                console.error('[credits] generation_cost update failed:', e);
              });
          } else {
            // 本地降级：至少更新前端显示的积分
            setUser((prev) => {
              const newCredits = Math.max(0, (prev.credits ?? 0) - totalUse);
              return {
                ...prev,
                credits: newCredits,
                generatedCount: (prev.generatedCount || 0) + configuredPhotos.length,
              };
            });
          }
        }
      } catch (err: any) {
        console.error(err);
        // 失败时记录事件，便于后台统计失败次数
        logEvent('generation_failed', {
          message: err?.message || 'unknown_error',
        }).catch(() => {});
        if (isMounted) {
          setError(err.message || "An error occurred during processing. Please check your API key or try a smaller image.");
          setIsProcessing(false);
        }
      }
    };

    processPhotos();

    return () => {
      isMounted = false;
    };
  }, [photos, configGroups, editId]);

  const getDimensions = (settings: SettingsType) => {
    if (settings.size === 'custom') {
      return { w: Math.round((settings.customWidth || 6) * 300), h: Math.round((settings.customHeight || 4) * 300) };
    }
    const sizeMap: Record<string, { w: number; h: number }> = {
      '3.5x5.5': { w: 1650, h: 1050 },
      '4x6': { w: 1800, h: 1200 },
      '4.1x5.8': { w: 1740, h: 1230 },
      '4.1x5.9': { w: 1770, h: 1230 },
      '4.7x6.7': { w: 2010, h: 1410 },
      '5x7': { w: 2100, h: 1500 },
      '5.8x8.3': { w: 2490, h: 1740 },
      square: { w: 1500, h: 1500 },
      polaroid: { w: 1024, h: 1280 },
    };
    return sizeMap[settings.size] ?? { w: 1800, h: 1200 };
  };

  const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const detectMainSubjectFocus = async (img: HTMLImageElement) => {
    const fallback = { x: img.width * 0.5, y: img.height * 0.45 };
    try {
      const FaceDetectorCtor = (window as any).FaceDetector;
      if (!FaceDetectorCtor) return fallback;

      const maxProbe = 640;
      const scale = Math.min(1, maxProbe / Math.max(img.width, img.height));
      const probeW = Math.max(1, Math.round(img.width * scale));
      const probeH = Math.max(1, Math.round(img.height * scale));
      const probe = document.createElement('canvas');
      probe.width = probeW;
      probe.height = probeH;
      const probeCtx = probe.getContext('2d');
      if (!probeCtx) return fallback;
      probeCtx.drawImage(img, 0, 0, probeW, probeH);

      const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 3 });
      const faces = await detector.detect(probe);
      if (!Array.isArray(faces) || faces.length === 0) return fallback;

      const normalizedFaces = faces
        .map((f: any) => {
          const bb = f?.boundingBox || {};
          const x = Number(bb.x ?? bb.left ?? 0);
          const y = Number(bb.y ?? bb.top ?? 0);
          const w = Number(bb.width ?? 0);
          const h = Number(bb.height ?? 0);
          return { x, y, w, h, score: w * h };
        })
        .filter((f: any) => isFinite(f.score) && f.score > 0);
      if (normalizedFaces.length === 0) return fallback;

      let faceFocusX = 0;
      let faceFocusY = 0;
      if (normalizedFaces.length === 1) {
        const bestFace = normalizedFaces[0];
        faceFocusX = (bestFace.x + bestFace.w / 2) / scale;
        faceFocusY = (bestFace.y + bestFace.h * 0.38) / scale;
      } else {
        const minX = Math.min(...normalizedFaces.map((f: any) => f.x));
        const minY = Math.min(...normalizedFaces.map((f: any) => f.y));
        const maxX = Math.max(...normalizedFaces.map((f: any) => f.x + f.w));
        const maxY = Math.max(...normalizedFaces.map((f: any) => f.y + f.h));
        faceFocusX = (minX + (maxX - minX) / 2) / scale;
        faceFocusY = (minY + (maxY - minY) * 0.4) / scale;
      }

      // 人脸检测只作为引导，不做绝对中心，避免把另一个主体裁掉
      const centerX = img.width * 0.5;
      const centerY = img.height * 0.45;
      const multiFace = normalizedFaces.length > 1;
      const maxShiftX = img.width * (multiFace ? 0.24 : 0.16);
      const maxShiftY = img.height * (multiFace ? 0.18 : 0.14);
      const mixedX = centerX * (multiFace ? 0.2 : 0.35) + faceFocusX * (multiFace ? 0.8 : 0.65);
      const mixedY = centerY * (multiFace ? 0.25 : 0.4) + faceFocusY * (multiFace ? 0.75 : 0.6);
      return {
        x: clampNumber(mixedX, centerX - maxShiftX, centerX + maxShiftX),
        y: clampNumber(mixedY, centerY - maxShiftY, centerY + maxShiftY),
      };
    } catch {
      return fallback;
    }
  };

  const computeCropArea4by5 = (
    imgW: number,
    imgH: number,
    focus: { x: number; y: number }
  ) => {
    const targetRatio = 4 / 5;
    const currentRatio = imgW / imgH;
    let cropW = imgW;
    let cropH = imgH;

    if (currentRatio > targetRatio) {
      cropW = imgH * targetRatio;
      cropH = imgH;
    } else {
      cropW = imgW;
      cropH = imgW / targetRatio;
    }

    const cropX = clampNumber(focus.x - cropW / 2, 0, imgW - cropW);
    const cropY = clampNumber(focus.y - cropH * 0.42, 0, imgH - cropH);
    return { x: cropX, y: cropY, w: cropW, h: cropH };
  };

  const drawBrandMark = async (
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    options: {
      position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';
      compact?: boolean;
      subtle?: boolean;
      opacity?: number;
      scale?: number;
      padding?: number;
      locale?: 'zh' | 'en';
    }
  ) => {
    const brandName = brandConfig.brandName(options.locale || (language.startsWith('zh') ? 'zh' : 'en'));
    const domain = brandConfig.domain();
    const logoUrl = brandConfig.logoUrl();
    if (!brandName && !logoUrl) return;

    const shortSide = Math.min(cw, ch);
    const relScale = options.scale ?? 1;
    const compact = options.compact === true;
    const subtle = options.subtle === true;
    const padding = options.padding ?? shortSide * 0.045;
    const opacity = options.opacity ?? (subtle ? 0.42 : brandConfig.watermarkOpacity());
    const logoSize = compact
      ? Math.max(24, Math.min(54, shortSide * 0.055 * relScale))
      : Math.max(62, Math.min(150, shortSide * 0.125 * relScale));
    const gap = compact ? Math.max(8, logoSize * 0.22) : Math.max(16, logoSize * 0.3);
    const fontSize1 = compact
      ? Math.max(11, Math.min(20, shortSide * 0.019 * relScale))
      : Math.max(18, Math.min(38, shortSide * 0.036 * relScale));
    const fontSize2 = compact
      ? Math.max(8, Math.min(14, shortSide * 0.013 * relScale))
      : Math.max(12, Math.min(23, shortSide * 0.021 * relScale));
    const urlText = domain.startsWith('http') ? domain : `https://${domain}/`;

    ctx.save();
    ctx.font = `${fontSize1}px "Inter", sans-serif`;
    const brandWidth = brandName ? ctx.measureText(brandName).width : 0;
    ctx.font = `${fontSize2}px "Inter", sans-serif`;
    const urlWidth = compact ? 0 : ctx.measureText(urlText).width;
    const line1W = (logoUrl ? logoSize + gap : 0) + brandWidth;
    const panelPadX = compact ? Math.max(10, logoSize * 0.22) : Math.max(20, logoSize * 0.26);
    const panelPadY = compact ? Math.max(6, logoSize * 0.12) : Math.max(12, logoSize * 0.18);
    const panelW = Math.min(cw - padding * 2, Math.max(line1W, urlWidth) + panelPadX * 2);
    const panelH = compact
      ? Math.max(logoSize + panelPadY * 2, fontSize1 + panelPadY * 2)
      : Math.max(logoSize + panelPadY * 2, logoSize + fontSize2 + panelPadY * 2.4);

    const position = options.position;
    const panelX = position.includes('right')
      ? cw - padding - panelW
      : position.includes('center')
        ? (cw - panelW) / 2
        : padding;
    const panelY = position.includes('top') ? padding : ch - padding - panelH;

    ctx.globalAlpha = subtle ? Math.min(0.58, opacity + 0.12) : Math.min(0.9, opacity + 0.16);
    ctx.fillStyle = subtle ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.74)';
    ctx.strokeStyle = subtle ? 'rgba(68,64,60,0.12)' : 'rgba(120,113,108,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, Math.min(18, panelH / 3));
    ctx.fill();
    ctx.stroke();

    let textX = panelX + panelPadX;
    const line1Y = compact ? panelY + panelH / 2 : panelY + panelPadY + logoSize * 0.45;
    ctx.globalAlpha = opacity;
    if (logoUrl) {
      try {
        const logoImg = await loadImage(logoUrl);
        ctx.drawImage(logoImg, panelX + panelPadX, line1Y - logoSize / 2, logoSize, logoSize);
        textX += logoSize + gap;
      } catch (_) {
        // Brand text is enough if the image fails.
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize1}px "Inter", sans-serif`;
    ctx.fillStyle = subtle ? '#57534e' : '#44403c';
    if (brandName) ctx.fillText(brandName, textX, line1Y);
    if (!compact) {
      ctx.font = `${fontSize2}px "Inter", sans-serif`;
      ctx.fillStyle = '#78716c';
      const urlX = position.includes('center')
        ? panelX + (panelW - urlWidth) / 2
        : position.includes('right')
          ? panelX + panelW - panelPadX - urlWidth
          : panelX + panelPadX;
      ctx.fillText(urlText, urlX, panelY + panelH - panelPadY - fontSize2 / 2);
    }
    ctx.restore();
  };

  const drawBackBrandSignature = async (
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    options: {
      anchor: 'left' | 'right';
      padding: number;
      locale?: 'zh' | 'en';
    }
  ) => {
    const brandName = brandConfig.brandName(options.locale || (language.startsWith('zh') ? 'zh' : 'en'));
    const domain = brandConfig.domain();
    const logoUrl = brandConfig.logoUrl();
    if (!brandName && !logoUrl) return;

    const shortSide = Math.min(cw, ch);
    const qrSize = Math.max(34, Math.min(58, shortSide * 0.058 * brandConfig.watermarkSize()));
    const logoSize = Math.max(18, Math.min(30, qrSize * 0.48));
    const gap = Math.max(7, qrSize * 0.18);
    const fontSize1 = Math.max(10, Math.min(16, shortSide * 0.016));
    const fontSize2 = Math.max(7, Math.min(10, shortSide * 0.01));
    const urlText = domain.startsWith('http') ? domain : `https://${domain}/`;
    const opacity = Math.min(0.5, Math.max(0.28, brandConfig.watermarkOpacity() * 0.72));

    ctx.save();
    ctx.font = `600 ${fontSize1}px "Inter", sans-serif`;
    const brandWidth = brandName ? ctx.measureText(brandName).width : 0;
    ctx.font = `${fontSize2}px "Inter", sans-serif`;
    const domainWidth = ctx.measureText(domain.replace(/^https?:\/\//, '').replace(/\/$/, '')).width;
    const contentW = qrSize + gap + Math.max((logoUrl ? logoSize + gap : 0) + brandWidth, domainWidth);
    const x = options.anchor === 'right'
      ? Math.max(options.padding, cw - options.padding - contentW)
      : options.padding;
    const y = ch - options.padding - qrSize;
    const textX = x + qrSize + gap;

    ctx.globalAlpha = opacity;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(urlText)}`;
      const qrImg = await loadImage(qrUrl);
      ctx.save();
      ctx.globalAlpha = Math.min(0.68, opacity + 0.18);
      ctx.fillStyle = 'rgba(255,255,255,0.76)';
      ctx.fillRect(x - 3, y - 3, qrSize + 6, qrSize + 6);
      ctx.drawImage(qrImg, x, y, qrSize, qrSize);
      ctx.restore();
    } catch (_) {
      ctx.save();
      ctx.globalAlpha = opacity * 0.9;
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, qrSize, qrSize);
      ctx.font = `600 ${fontSize2}px "Inter", sans-serif`;
      ctx.fillStyle = '#78716c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR', x + qrSize / 2, y + qrSize / 2);
      ctx.restore();
    }

    let nameX = textX;
    if (logoUrl) {
      try {
        const logoImg = await loadImage(logoUrl);
        ctx.drawImage(logoImg, textX, y + qrSize * 0.1, logoSize, logoSize);
        nameX = textX + logoSize + gap * 0.75;
      } catch (_) {
        // Text fallback below.
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 ${fontSize1}px "Inter", sans-serif`;
    ctx.fillStyle = '#57534e';
    if (brandName) ctx.fillText(brandName, nameX, y + qrSize * 0.1 + logoSize * 0.62);
    ctx.font = `${fontSize2}px "Inter", sans-serif`;
    ctx.fillStyle = '#78716c';
    ctx.globalAlpha = opacity * 0.72;
    ctx.fillText(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''), textX, y + qrSize * 0.1 + logoSize * 0.62 + fontSize2 * 1.5);
    ctx.restore();
  };

  const resolveBackTemplateVariant = (theme: string, generatedBackImage?: string) => {
    if (theme === 'modern') return 'sidebar';
    if (theme === 'vintage' || generatedBackImage) return 'gallery';
    return 'classic';
  };

  const generateFront = async (img: HTMLImageElement, title: string, location: string, theme: string, settings: SettingsType, frontStyle?: ProcessedPostcard['frontStyle'], author?: string, date?: string, useFrontWatermark?: boolean) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const safeSettings = settings || { size: '4x6', fill: 'fill', aiTitle: true, aiLanguage: 'English' };
    const { w, h } = getDimensions(safeSettings);
    const isPolaroidMode = safeSettings.size === 'polaroid';
    
    const isPortrait = img.height > img.width && safeSettings.size !== 'square';
    canvas.width = isPolaroidMode ? w : (isPortrait ? h : w);
    canvas.height = isPolaroidMode ? h : (isPortrait ? w : h);
    
    const cw = canvas.width;
    const ch = canvas.height;
    const isSquare = cw === ch; // 拍立得/方形

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    const fillMode = safeSettings.fill || 'fill';
    const filterId = safeSettings.filter || 'original';
    const filterIntensity = safeSettings.filterIntensity ?? 0.8;

    if (isPolaroidMode) {
      const focus = await detectMainSubjectFocus(img);
      const crop = computeCropArea4by5(img.width, img.height, focus);

      const drawCropped = (dx: number, dy: number, dw: number, dh: number) => {
        ctx.drawImage(
          img,
          crop.x,
          crop.y,
          crop.w,
          crop.h,
          dx,
          dy,
          dw,
          dh
        );
      };

      let imgX = 0;
      let imgY = 0;
      let imgW = cw;
      let imgH = ch;

      if (fillMode === 'fill') {
        drawCropped(0, 0, cw, ch);
      } else if (fillMode === 'border') {
        const borderTop = ch * 0.04;
        const borderSide = cw * 0.04;
        const borderBottom = ch * 0.08;
        const frameW = cw - borderSide * 2;
        const frameH = ch - borderTop - borderBottom;

        const fitScale = Math.min(frameW / crop.w, frameH / crop.h);
        imgW = crop.w * fitScale;
        imgH = crop.h * fitScale;
        imgX = borderSide + (frameW - imgW) / 2;
        imgY = borderTop + (frameH - imgH) / 2;
        drawCropped(imgX, imgY, imgW, imgH);
      } else {
        // bottom-border
        const borderSide = cw * 0.02;
        const borderBottom = ch * 0.14;
        const frameW = cw - borderSide * 2;
        const frameH = ch - borderBottom;

        const fitScale = Math.min(frameW / crop.w, frameH / crop.h);
        imgW = crop.w * fitScale;
        imgH = crop.h * fitScale;
        imgX = borderSide + (frameW - imgW) / 2;
        imgY = 0; // 顶部对齐
        drawCropped(imgX, imgY, imgW, imgH);

        // caption zone separator
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(borderSide, frameH - 1, frameW, 1);
      }

      applyFilterById(filterId, ctx, imgW, imgH, filterIntensity, imgX, imgY);

      const renderPolaroidText = () => {
        const titleText = title || '';
        const line2 = [location, date].filter(Boolean).join('  •  ');
        if (!titleText && !line2) return;

        const style = frontStyle || { fontSize: 5, color: '#ffffff', position: 'bottom-left' };
        const customX = Number(style.xPct);
        const customY = Number(style.yPct);
        const hasCustomPosition = style.xPct != null && style.yPct != null
          && Number.isFinite(customX) && Number.isFinite(customY);

        ctx.textAlign = 'center';
        const fitFontSize = (
          text: string,
          maxWidth: number,
          preferred: number,
          min: number,
          family: string,
          weight: string
        ) => {
          if (!text) return min;
          let size = preferred;
          while (size > min) {
            ctx.font = `${weight} ${size}px ${family}`;
            if (ctx.measureText(text).width <= maxWidth) break;
            size -= 1;
          }
          return Math.max(min, size);
        };

        if (hasCustomPosition) {
          const maxTextWidth = cw * 0.76;
          const titleSize = titleText ? fitFontSize(
            titleText, maxTextWidth,
            Math.max(30, cw * (Number(style.fontSize) || 5) / 100),
            18, '"Playfair Display", serif', '700'
          ) : 0;
          const line2Size = line2 ? fitFontSize(
            line2, maxTextWidth, Math.max(18, titleSize * 0.58),
            13, '"Inter", sans-serif', '600'
          ) : 0;
          const gap = titleText && line2 ? Math.max(8, titleSize * 0.3) : 0;
          const totalHeight = titleSize + gap + line2Size;
          const x = cw * clampNumber(customX, 12, 88) / 100;
          let y = ch * clampNumber(customY, 10, 90) / 100 - totalHeight / 2;

          ctx.textAlign = 'center';
          ctx.fillStyle = style.color || (fillMode === 'fill' ? '#ffffff' : '#1c1917');
          ctx.shadowColor = fillMode === 'fill' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.8)';
          ctx.shadowBlur = Math.max(4, cw * 0.006);
          if (titleText) {
            ctx.font = `700 ${titleSize}px "Playfair Display", serif`;
            ctx.fillText(titleText, x, y + titleSize);
            y += titleSize + gap;
          }
          if (line2) {
            ctx.font = `600 ${line2Size}px "Inter", sans-serif`;
            ctx.fillText(line2, x, y + line2Size);
          }
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          return;
        }

        if (fillMode === 'fill') {
          // fill 模式无边框，在底部图片上叠加渐变文字，保证地点可见
          const gradientH = ch * 0.24;
          const maxTextWidth = cw * 0.9;
          const grad = ctx.createLinearGradient(0, ch - gradientH, 0, ch);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.62)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, ch - gradientH, cw, gradientH);

          ctx.fillStyle = '#ffffff';
          if (titleText) {
            const size = fitFontSize(
              titleText,
              maxTextWidth,
              Math.max(36, cw * 0.06),
              Math.max(24, cw * 0.034),
              '"Playfair Display", serif',
              '700'
            );
            ctx.font = `700 ${size}px "Playfair Display", serif`;
            ctx.fillText(titleText, cw * 0.5, ch - gradientH * 0.34);
          }
          if (line2) {
            const size = fitFontSize(
              line2,
              maxTextWidth,
              Math.max(24, cw * 0.038),
              Math.max(16, cw * 0.024),
              '"Inter", sans-serif',
              '600'
            );
            ctx.font = `600 ${size}px "Inter", sans-serif`;
            ctx.globalAlpha = 0.94;
            ctx.fillText(line2, cw * 0.5, ch - gradientH * 0.12);
            ctx.globalAlpha = 1;
          }
          return;
        }

        const borderBottom = fillMode === 'border' ? ch * 0.08 : ch * 0.14;
        const zoneTop = ch - borderBottom;
        const centerX = cw * 0.5;
        const textWidth = cw * (fillMode === 'border' ? 0.9 : 0.92);
        ctx.fillStyle = '#1c1917';
        if (titleText) {
          const preferred = fillMode === 'border' ? Math.max(30, borderBottom * 0.38) : Math.max(34, borderBottom * 0.3);
          const min = fillMode === 'border' ? Math.max(18, borderBottom * 0.2) : Math.max(20, borderBottom * 0.18);
          const size = fitFontSize(
            titleText,
            textWidth,
            preferred,
            min,
            '"Playfair Display", serif',
            '700'
          );
          ctx.font = `700 ${size}px "Playfair Display", serif`;
          ctx.fillText(titleText, centerX, zoneTop + borderBottom * 0.48);
        }
        if (line2) {
          const preferred = fillMode === 'border' ? Math.max(24, borderBottom * 0.28) : Math.max(26, borderBottom * 0.2);
          const min = fillMode === 'border' ? Math.max(14, borderBottom * 0.16) : Math.max(16, borderBottom * 0.14);
          const size = fitFontSize(
            line2,
            textWidth,
            preferred,
            min,
            '"Inter", sans-serif',
            '600'
          );
          ctx.font = `600 ${size}px "Inter", sans-serif`;
          ctx.globalAlpha = 0.86;
          ctx.fillText(line2, centerX, zoneTop + borderBottom * (titleText ? 0.76 : 0.62));
          ctx.globalAlpha = 1;
        }
      };
      renderPolaroidText();

      if (useFrontWatermark) {
        await drawBrandMark(ctx, cw, ch, {
          position: fillMode === 'fill' ? 'bottom-right' : 'bottom-left',
          compact: true,
          subtle: true,
          opacity: fillMode === 'fill' ? 0.36 : 0.46,
          scale: 0.9,
          padding: Math.min(cw, ch) * 0.035,
        });
      }

      return canvas.toDataURL('image/jpeg', 0.9);
    }

    const hasFrontText = !!(title || location || author || date);
    const bottomBorderRatio = isSquare
      ? (hasFrontText ? 0.18 : 0.1)
      : (hasFrontText ? 0.17 : 0.09);

    let imgX = 0, imgY = 0, imgW = cw, imgH = ch;

    const drawImageSmartFit = (
      boxX: number,
      boxY: number,
      boxW: number,
      boxH: number,
      maxCropRatio: number,
      verticalBias: number = 0
    ) => {
      const containScale = Math.min(boxW / img.width, boxH / img.height);
      const containW = img.width * containScale;
      const containH = img.height * containScale;
      const containX = boxX + (boxW - containW) / 2;
      const containY = boxY + (boxH - containH) / 2;

      const coverScale = Math.max(boxW / img.width, boxH / img.height);
      const coverW = img.width * coverScale;
      const coverH = img.height * coverScale;
      const coverX = boxX + (boxW - coverW) / 2;
      const centerCoverY = boxY + (boxH - coverH) / 2;
      const maxShiftY = Math.max(0, (coverH - boxH) / 2);
      const clampedBias = Math.max(-1, Math.min(1, verticalBias));
      const coverY = centerCoverY + clampedBias * maxShiftY;

      // 裁切率越高，代表为了铺满被裁掉越多画面
      const cropRatio = 1 - (boxW * boxH) / (coverW * coverH);
      const useCover = cropRatio <= maxCropRatio;

      if (useCover) {
        // 限制在目标框内，避免覆盖留白区域
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();
        ctx.drawImage(img, 0, 0, img.width, img.height, coverX, coverY, coverW, coverH);
        ctx.restore();
        return { x: boxX, y: boxY, w: boxW, h: boxH };
      }

      ctx.drawImage(img, 0, 0, img.width, img.height, containX, containY, containW, containH);
      return { x: containX, y: containY, w: containW, h: containH };
    };

    if (fillMode === 'fill') {
      // 满版模式：等比铺满（cover），不做拉伸变形
      const coverScale = Math.max(cw / img.width, ch / img.height);
      const drawW = img.width * coverScale;
      const drawH = img.height * coverScale;
      const drawX = (cw - drawW) / 2;
      const drawY = (ch - drawH) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);
      imgX = 0; imgY = 0; imgW = cw; imgH = ch;
    } else if (fillMode === 'border') {
      const paddingX = cw * 0.05;
      const paddingTop = cw * 0.05;
      const paddingBottom = ch * bottomBorderRatio;
      const availW = cw - paddingX * 2;
      const availH = ch - paddingTop - paddingBottom;
      const dx = paddingX;
      const dy = paddingTop;

      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      const drawn = drawImageSmartFit(dx, dy, availW, availH, isSquare ? 0.6 : 0.45, -0.08);
      imgX = drawn.x; imgY = drawn.y; imgW = drawn.w; imgH = drawn.h;
      ctx.shadowColor = 'transparent';
    } else if (fillMode === 'bottom-border') {
      const paddingBottom = ch * bottomBorderRatio;
      const availW = cw;
      const availH = ch - paddingBottom;
      // 底部留白模式：智能适配，优先减少白边，同时避免过度裁切
      const drawn = drawImageSmartFit(0, 0, availW, availH, isSquare ? 0.72 : 0.52, -0.12);
      imgX = drawn.x; imgY = drawn.y; imgW = drawn.w; imgH = drawn.h;

      // Add subtle shadow line at the bottom of the image
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, availH, cw, 2);
    } else {
      // Default: 拉伸/压缩至填满，图片完整不裁剪
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, cw, ch);
      imgX = 0; imgY = 0; imgW = cw; imgH = ch;
    }

    // 描述驱动的像素级滤镜：绘制后对图像区域应用
    applyFilterById(filterId, ctx, imgW, imgH, filterIntensity, imgX, imgY);

    // 只要有标题 / 地点 / 作者 / 日期，就在正面展示文字
    const shouldRenderText = !!(title || location || author || date);
    if (shouldRenderText) {
      const style = frontStyle || { fontSize: 5, color: '#ffffff', position: 'bottom-left' };
      const referenceSize = Math.min(cw, ch);
      const sizeScale = isSquare ? 0.85 : 1; // 方形略缩小以适配留白
      let locationSize = Math.max(referenceSize * (style.fontSize / 100) * 1.2 * sizeScale, 14);
      let titleSize = locationSize * 0.5;
      
      // 底部留白/四周留白时：限制文字不超出留白范围，统一各规格表现
      const isBottomBorder = settings.fill === 'bottom-border';
      const isBorder = settings.fill === 'border';
      const hasTextInBorderArea = isBottomBorder || isBorder;
      const hasCustomPosition = style.xPct != null && style.yPct != null
        && Number.isFinite(Number(style.xPct)) && Number.isFinite(Number(style.yPct));
      const maxTextWidth = cw * (hasTextInBorderArea ? 0.88 : 1); // 留白模式左右各留 6%
      
      if (hasTextInBorderArea && (location || title)) {
        const testTitle = (theme === 'modern' || theme === 'vintage') ? (title || '').toUpperCase() : (title || '');
        ctx.font = `500 ${locationSize}px "Inter", sans-serif`;
        const locW = location ? ctx.measureText(location.toUpperCase()).width : 0;
        ctx.font = `600 ${titleSize}px "Playfair Display", serif`;
        const titleW = testTitle ? ctx.measureText(testTitle).width : 0;
        const maxW = Math.max(locW, titleW, 1);
        if (maxW > maxTextWidth && maxW > 0) {
          const scale = maxTextWidth / maxW;
          locationSize = Math.max(12, locationSize * scale);
          titleSize = Math.max(10, titleSize * scale);
        }
      }
      
      // Draw gradient based on position (only if fill mode is 'fill' or 'border')
      const hasTextInBorder = hasTextInBorderArea && !hasCustomPosition;
      if (!hasTextInBorder) {
        const gradientHeight = ch * 0.4;
        let gradient;
        
        if (style.position.includes('bottom')) {
          gradient = ctx.createLinearGradient(0, ch - gradientHeight, 0, ch);
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, ch - gradientHeight, cw, gradientHeight);
        } else if (style.position.includes('top')) {
          gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight);
          gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, cw, gradientHeight);
        } else if (style.position === 'center') {
          gradient = ctx.createRadialGradient(cw/2, ch/2, 0, cw/2, ch/2, Math.max(cw, ch)/2);
          gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, cw, ch);
        }
      }

      // If text is in border, force text color to dark
      ctx.fillStyle = hasTextInBorder ? '#1c1917' : style.color;
      
      let titleFont = `"Playfair Display", "Georgia", serif`;
      let titleWeight = "600";
      let titleCase = title;
      
      if (theme === 'modern') {
        titleFont = `"Montserrat", sans-serif`;
        titleWeight = "800";
        titleCase = title.toUpperCase();
      } else if (theme === 'vintage') {
        titleFont = `"Cinzel", serif`;
        titleWeight = "700";
        titleCase = title.toUpperCase();
      } else if (theme === 'handwritten') {
        titleFont = `"Caveat", cursive`;
        titleWeight = "700";
      }

      let metaText = '';
      if (author) metaText += `Photo by ${author}`;
      if (author && date) metaText += ` • `;
      if (date) metaText += date;

      let metaSize = titleSize * 0.6;
      let spacing1 = locationSize * 0.42;
      let spacing2 = locationSize * 0.38;

      // Calculate positions
      let align: CanvasTextAlign = 'left';
      let x = cw * 0.05;
      
      let titleY = 0;
      let locY = 0;
      let metaY = 0;

      if (style.position.includes('right')) {
        align = 'right';
        x = cw * 0.95;
      } else if (style.position === 'center') {
        align = 'center';
        x = cw * 0.5;
      }

      // Calculate actual heights based on what's present
      let actualTitleHeight = titleCase ? titleSize : 0;
      let actualLocHeight = location ? locationSize : 0;
      let actualMetaHeight = metaText ? metaSize : 0;
      let actualSpacing1 = (titleCase && location) ? spacing1 : 0;
      let actualSpacing2 = (location && metaText) ? spacing2 : ((titleCase && metaText && !location) ? spacing1 : 0);
      let totalHeight = actualTitleHeight + actualSpacing1 + actualLocHeight + actualSpacing2 + actualMetaHeight;

      if (hasTextInBorder) {
        const bottomBorderHeight = ch * bottomBorderRatio;
        const availableTextHeight = bottomBorderHeight * 0.72;
        if (totalHeight > availableTextHeight && totalHeight > 0) {
          const fitScale = Math.max(0.62, availableTextHeight / totalHeight);
          titleSize *= fitScale;
          locationSize *= fitScale;
          metaSize *= fitScale;
          spacing1 *= fitScale;
          spacing2 *= fitScale;
          actualTitleHeight = titleCase ? titleSize : 0;
          actualLocHeight = location ? locationSize : 0;
          actualMetaHeight = metaText ? metaSize : 0;
          actualSpacing1 = (titleCase && location) ? spacing1 : 0;
          actualSpacing2 = (location && metaText) ? spacing2 : ((titleCase && metaText && !location) ? spacing1 : 0);
          totalHeight = actualTitleHeight + actualSpacing1 + actualLocHeight + actualSpacing2 + actualMetaHeight;
        }
      }

      if (hasCustomPosition) {
        align = 'center';
        const horizontalSafety = 12;
        const verticalSafety = Math.min(25, Math.max(8, (totalHeight / ch) * 50 + 2));
        x = cw * clampNumber(Number(style.xPct), horizontalSafety, 100 - horizontalSafety) / 100;
        let currentY = ch * clampNumber(Number(style.yPct), verticalSafety, 100 - verticalSafety) / 100 - totalHeight / 2;
        if (titleCase) {
          titleY = currentY + actualTitleHeight;
          currentY = titleY + actualSpacing1;
        }
        if (location) {
          locY = currentY + actualLocHeight;
          currentY = locY + actualSpacing2;
        }
        if (metaText) metaY = currentY + actualMetaHeight;
      } else if (hasTextInBorder) {
        // 与绘图一致的底部留白比例，避免文字与留白错位
        const bottomBorderHeight = ch * bottomBorderRatio;
        // 在留白区内再预留上下安全距离，避免贴边
        const innerPaddingY = Math.max(bottomBorderHeight * 0.12, (bottomBorderHeight - totalHeight) / 2);
        
        // 从留白区顶部 + 安全距离开始排布，保证与图片和底边都有间距
        let currentY = ch - bottomBorderHeight + innerPaddingY;
        
        if (titleCase) {
          titleY = currentY + actualTitleHeight;
          currentY = titleY + actualSpacing1;
        }
        if (location) {
          locY = currentY + actualLocHeight;
          currentY = locY + actualSpacing2;
        }
        if (metaText) {
          metaY = currentY + actualMetaHeight;
        }
        
        // Force center alignment for bottom border
        align = 'center';
        x = cw * 0.5;
      } else {
        if (style.position.includes('top')) {
          let currentY = ch * 0.05;
          if (titleCase) {
            titleY = currentY + actualTitleHeight;
            currentY = titleY + actualSpacing1;
          }
          if (location) {
            locY = currentY + actualLocHeight;
            currentY = locY + actualSpacing2;
          }
          if (metaText) {
            metaY = currentY + actualMetaHeight;
          }
        } else if (style.position === 'center') {
          let currentY = ch * 0.5 - totalHeight / 2;
          if (titleCase) {
            titleY = currentY + actualTitleHeight;
            currentY = titleY + actualSpacing1;
          }
          if (location) {
            locY = currentY + actualLocHeight;
            currentY = locY + actualSpacing2;
          }
          if (metaText) {
            metaY = currentY + actualMetaHeight;
          }
        } else {
          // bottom (default)
          let currentY = ch * 0.95;
          if (metaText) {
            metaY = currentY;
            currentY = metaY - actualMetaHeight - actualSpacing2;
          }
          if (location) {
            locY = currentY;
            currentY = locY - actualLocHeight - actualSpacing1;
          }
          if (titleCase) {
            titleY = currentY;
          }
        }
      }

      ctx.textAlign = align;
      
      ctx.font = `500 ${locationSize}px "Inter", sans-serif`;
      // 对中文等非拉丁文字，4px 的字距会导致宽度严重低估，容易出边缘，这里统一收紧
      const isCJK = !!(location && /[\u4e00-\u9fff]/.test(location));
      ctx.letterSpacing = isCJK ? "1px" : "3px";
      if (location) {
        ctx.fillText(location.toUpperCase(), x, locY);
      }
      
      ctx.font = `${titleWeight} ${titleSize}px ${titleFont}`;
      ctx.letterSpacing = "0px";
      if (titleCase) {
        ctx.fillText(titleCase, x, titleY);
      }

      if (metaText) {
        ctx.font = `italic ${metaSize}px "Playfair Display", serif`;
        ctx.fillStyle = style.color;
        ctx.globalAlpha = 0.8;
        ctx.fillText(metaText, x, metaY);
        ctx.globalAlpha = 1.0;
      }
    }

    if (useFrontWatermark) {
      const preferredPosition =
        fillMode === 'fill'
          ? 'bottom-right'
          : fillMode === 'border'
            ? 'bottom-left'
            : 'bottom-right';
      await drawBrandMark(ctx, cw, ch, {
        position: preferredPosition,
        compact: true,
        subtle: true,
        opacity: fillMode === 'fill' ? 0.34 : 0.44,
        scale: 0.92,
        padding: Math.min(cw, ch) * 0.035,
      });
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const drawArtisticIcon = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const s = size;
    
    switch (type.toLowerCase()) {
      case 'mountain':
        ctx.beginPath();
        ctx.moveTo(0, s * 0.8);
        ctx.lineTo(s * 0.4, s * 0.2);
        ctx.lineTo(s * 0.6, s * 0.5);
        ctx.lineTo(s * 0.8, s * 0.3);
        ctx.lineTo(s, s * 0.8);
        ctx.stroke();
        break;
      case 'compass':
        ctx.beginPath();
        ctx.arc(s/2, s/2, s/2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s/2, s/4);
        ctx.lineTo(s/2, s*0.75);
        ctx.moveTo(s/4, s/2);
        ctx.lineTo(s*0.75, s/2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s/2, s/3);
        ctx.lineTo(s/2.4, s/2);
        ctx.lineTo(s/2, s*0.66);
        ctx.lineTo(s/1.66, s/2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'camera':
        ctx.strokeRect(s * 0.1, s * 0.3, s * 0.8, s * 0.5);
        ctx.strokeRect(s * 0.35, s * 0.2, s * 0.3, s * 0.1);
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.55, s * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'leaf':
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * 0.9);
        ctx.bezierCurveTo(s * 0.1, s * 0.6, s * 0.1, s * 0.2, s * 0.5, s * 0.1);
        ctx.bezierCurveTo(s * 0.9, s * 0.2, s * 0.9, s * 0.6, s * 0.5, s * 0.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * 0.9);
        ctx.lineTo(s * 0.5, s * 0.1);
        ctx.stroke();
        break;
      case 'anchor':
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * 0.2);
        ctx.lineTo(s * 0.5, s * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.15, s * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.6);
        ctx.bezierCurveTo(s * 0.2, s * 0.9, s * 0.8, s * 0.9, s * 0.8, s * 0.6);
        ctx.stroke();
        break;
      case 'sun':
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.5, s * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          ctx.moveTo(s * 0.5 + Math.cos(angle) * s * 0.25, s * 0.5 + Math.sin(angle) * s * 0.25);
          ctx.lineTo(s * 0.5 + Math.cos(angle) * s * 0.4, s * 0.5 + Math.sin(angle) * s * 0.4);
        }
        ctx.stroke();
        break;
      case 'building':
        ctx.strokeRect(s * 0.2, s * 0.2, s * 0.6, s * 0.7);
        ctx.strokeRect(s * 0.4, s * 0.7, s * 0.2, s * 0.2);
        for (let i = 0; i < 3; i++) {
          ctx.strokeRect(s * 0.3, s * 0.3 + i * s * 0.15, s * 0.1, s * 0.08);
          ctx.strokeRect(s * 0.6, s * 0.3 + i * s * 0.15, s * 0.1, s * 0.08);
        }
        break;
      case 'bridge':
        ctx.beginPath();
        ctx.moveTo(s * 0.1, s * 0.7);
        ctx.lineTo(s * 0.9, s * 0.7);
        ctx.moveTo(s * 0.3, s * 0.7);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.moveTo(s * 0.7, s * 0.7);
        ctx.lineTo(s * 0.7, s * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.1, s * 0.5);
        ctx.quadraticCurveTo(s * 0.3, s * 0.3, s * 0.5, s * 0.5);
        ctx.quadraticCurveTo(s * 0.7, s * 0.3, s * 0.9, s * 0.5);
        ctx.stroke();
        break;
      case 'train':
      case 'subway':
        ctx.strokeRect(s * 0.2, s * 0.3, s * 0.6, s * 0.5);
        ctx.strokeRect(s * 0.25, s * 0.35, s * 0.5, s * 0.2);
        ctx.beginPath();
        ctx.arc(s * 0.35, s * 0.7, s * 0.05, 0, Math.PI * 2);
        ctx.arc(s * 0.65, s * 0.7, s * 0.05, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'moon':
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.5, s * 0.3, 0.5, Math.PI * 1.5);
        ctx.quadraticCurveTo(s * 0.4, s * 0.5, s * 0.5, s * 0.5 + Math.sin(0.5) * s * 0.3);
        ctx.stroke();
        break;
      case 'star':
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          ctx.lineTo(s * 0.5 + Math.cos(angle) * s * 0.4, s * 0.5 + Math.sin(angle) * s * 0.4);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      case 'cloud':
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.7);
        ctx.bezierCurveTo(s * 0.05, s * 0.7, s * 0.05, s * 0.4, s * 0.25, s * 0.4);
        ctx.bezierCurveTo(s * 0.3, s * 0.2, s * 0.6, s * 0.2, s * 0.7, s * 0.4);
        ctx.bezierCurveTo(s * 0.9, s * 0.4, s * 0.9, s * 0.7, s * 0.75, s * 0.7);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'tree':
        ctx.strokeRect(s * 0.45, s * 0.6, s * 0.1, s * 0.3);
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * 0.1);
        ctx.lineTo(s * 0.2, s * 0.6);
        ctx.lineTo(s * 0.8, s * 0.6);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'flower':
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.5, s * 0.1, 0, Math.PI * 2);
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.moveTo(s * 0.5 + Math.cos(angle) * s * 0.1, s * 0.5 + Math.sin(angle) * s * 0.1);
          ctx.arc(s * 0.5 + Math.cos(angle) * s * 0.25, s * 0.5 + Math.sin(angle) * s * 0.25, s * 0.15, 0, Math.PI * 2);
        }
        ctx.stroke();
        break;
      case 'bird':
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.4);
        ctx.quadraticCurveTo(s * 0.35, s * 0.3, s * 0.5, s * 0.4);
        ctx.quadraticCurveTo(s * 0.65, s * 0.3, s * 0.8, s * 0.4);
        ctx.stroke();
        break;
      case 'heart':
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * 0.8);
        ctx.bezierCurveTo(s * 0.2, s * 0.6, s * 0.1, s * 0.4, s * 0.1, s * 0.3);
        ctx.arc(s * 0.3, s * 0.3, s * 0.2, Math.PI, 0, false);
        ctx.arc(s * 0.7, s * 0.3, s * 0.2, Math.PI, 0, false);
        ctx.bezierCurveTo(s * 0.9, s * 0.4, s * 0.8, s * 0.6, s * 0.5, s * 0.8);
        ctx.stroke();
        break;
      case 'plane':
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.5);
        ctx.lineTo(s * 0.8, s * 0.5);
        ctx.moveTo(s * 0.5, s * 0.2);
        ctx.lineTo(s * 0.5, s * 0.8);
        ctx.moveTo(s * 0.4, s * 0.5);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.moveTo(s * 0.4, s * 0.5);
        ctx.lineTo(s * 0.3, s * 0.7);
        ctx.stroke();
        break;
      case 'car':
        ctx.strokeRect(s * 0.2, s * 0.5, s * 0.6, s * 0.3);
        ctx.beginPath();
        ctx.moveTo(s * 0.3, s * 0.5);
        ctx.lineTo(s * 0.4, s * 0.3);
        ctx.lineTo(s * 0.6, s * 0.3);
        ctx.lineTo(s * 0.7, s * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.35, s * 0.8, s * 0.08, 0, Math.PI * 2);
        ctx.arc(s * 0.65, s * 0.8, s * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'map':
      case 'globe':
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.5, s * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.1, s * 0.5);
        ctx.quadraticCurveTo(s * 0.5, s * 0.4, s * 0.9, s * 0.5);
        ctx.moveTo(s * 0.5, s * 0.1);
        ctx.quadraticCurveTo(s * 0.4, s * 0.5, s * 0.5, s * 0.9);
        ctx.stroke();
        break;
      case 'clock':
        ctx.beginPath();
        ctx.arc(s * 0.5, s * 0.5, s * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.5, s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.25);
        ctx.moveTo(s * 0.5, s * 0.5);
        ctx.lineTo(s * 0.7, s * 0.5);
        ctx.stroke();
        break;
      case 'snowflake':
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.moveTo(s * 0.5, s * 0.5);
          ctx.lineTo(s * 0.5 + Math.cos(angle) * s * 0.4, s * 0.5 + Math.sin(angle) * s * 0.4);
          const x2 = s * 0.5 + Math.cos(angle) * s * 0.25;
          const y2 = s * 0.5 + Math.sin(angle) * s * 0.25;
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 + Math.cos(angle + 0.5) * s * 0.1, y2 + Math.sin(angle + 0.5) * s * 0.1);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 + Math.cos(angle - 0.5) * s * 0.1, y2 + Math.sin(angle - 0.5) * s * 0.1);
        }
        ctx.stroke();
        break;
      case 'fire':
        ctx.beginPath();
        ctx.moveTo(s * 0.2, s * 0.8);
        ctx.quadraticCurveTo(s * 0.1, s * 0.5, s * 0.3, s * 0.4);
        ctx.quadraticCurveTo(s * 0.4, s * 0.1, s * 0.5, s * 0.4);
        ctx.quadraticCurveTo(s * 0.6, s * 0.1, s * 0.7, s * 0.4);
        ctx.quadraticCurveTo(s * 0.9, s * 0.5, s * 0.8, s * 0.8);
        ctx.closePath();
        ctx.stroke();
        break;
      case 'wave':
        ctx.beginPath();
        for (let i = 0; i < 2; i++) {
          const yOff = i * s * 0.2;
          ctx.moveTo(s * 0.1, s * 0.5 + yOff);
          ctx.bezierCurveTo(s * 0.3, s * 0.3 + yOff, s * 0.4, s * 0.7 + yOff, s * 0.6, s * 0.5 + yOff);
          ctx.bezierCurveTo(s * 0.8, s * 0.3 + yOff, s * 0.9, s * 0.7 + yOff, s * 1.1, s * 0.5 + yOff);
        }
        ctx.stroke();
        break;
      default:
        // Default star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          ctx.lineTo(s * 0.5 + Math.cos(angle) * s * 0.4, s * 0.5 + Math.sin(angle) * s * 0.4);
        }
        ctx.closePath();
        ctx.stroke();
    }
    ctx.restore();
  };

  const generateBack = async (img: HTMLImageElement, message: string, location: string, _postmark: string, theme: string, settings: SettingsType, backStyle?: ProcessedPostcard['backStyle'], author?: string, date?: string, artisticIcons: string[] = [], generatedBackImage?: string, useWatermark?: boolean) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const safeSettings = settings || { size: '4x6', fill: 'fill', aiTitle: true, aiLanguage: 'English' };
    const { w, h } = getDimensions(safeSettings);
    const isChinese =
      language.startsWith('zh') || (safeSettings.aiLanguage || 'English').includes('Chinese');
    
    const isPortrait = img.height > img.width && safeSettings.size !== 'square';
    canvas.width = isPortrait ? h : w;
    canvas.height = isPortrait ? w : h;
    const cw = canvas.width;
    const ch = canvas.height;

    // Background color based on theme
    let bgColor = '#fdfbf7'; // Default cream
    if (theme === 'vintage') bgColor = '#f4f1ea';
    if (theme === 'modern') bgColor = '#ffffff';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);

    const stampSize = Math.min(cw, ch) * 0.12;
    const padding = Math.min(cw, ch) * 0.04;

    const backMode = settings.backDesignMode ?? (settings.aiBackTemplate ? 'ai' : 'template');
    const templateVariant = resolveBackTemplateVariant(theme, generatedBackImage);
    const dividerX = templateVariant === 'sidebar' ? cw * 0.62 : templateVariant === 'gallery' ? cw * 0.58 : cw * 0.5;
    const messageMaxWidth = templateVariant === 'sidebar'
      ? dividerX - padding * 2.4
      : templateVariant === 'gallery'
        ? dividerX - padding * 2
        : cw / 2 - padding * 2;
    const addressLineStart = templateVariant === 'sidebar' ? cw * 0.68 : dividerX + padding;

    if (templateVariant === 'gallery') {
      ctx.save();
      ctx.strokeStyle = theme === 'vintage' ? 'rgba(139,69,19,0.16)' : 'rgba(68,64,60,0.12)';
      ctx.lineWidth = Math.max(1, Math.min(cw, ch) * 0.003);
      ctx.beginPath();
      ctx.roundRect(padding * 0.8, padding * 0.8, cw - padding * 1.6, ch - padding * 1.6, Math.min(28, padding * 0.9));
      ctx.stroke();
      ctx.globalAlpha = 0.08;
      drawArtisticIcon(ctx, artisticIcons[0] || 'camera', padding * 1.4, padding * 1.1, Math.min(cw, ch) * 0.12, '#44403c');
      ctx.restore();
    } else if (templateVariant === 'sidebar') {
      ctx.save();
      const panel = ctx.createLinearGradient(dividerX, 0, cw, 0);
      panel.addColorStop(0, 'rgba(248,250,252,0.72)');
      panel.addColorStop(1, 'rgba(255,255,255,0.92)');
      ctx.fillStyle = panel;
      ctx.fillRect(dividerX, 0, cw - dividerX, ch);
      ctx.restore();
    }

    // 1. AI Illustration (subtle decorative layer)
    if (generatedBackImage) {
      try {
        const backImg = await loadImage(generatedBackImage);
        ctx.save();
        const motifW = cw * 0.46;
        const motifH = Math.min(ch * 0.54, motifW);
        const motifX = padding * 1.1;
        const motifY = ch - motifH - padding * 1.2;
        ctx.globalAlpha = 0.28;
        ctx.filter = 'saturate(0.78) contrast(0.9) brightness(1.08)';
        ctx.drawImage(backImg, motifX, motifY, motifW, motifH);
        ctx.filter = 'none';
        ctx.globalAlpha = 0.72;
        const paperWash = ctx.createLinearGradient(0, 0, cw, ch);
        paperWash.addColorStop(0, 'rgba(253,251,247,0.38)');
        paperWash.addColorStop(0.55, 'rgba(255,255,255,0.68)');
        paperWash.addColorStop(1, 'rgba(253,251,247,0.84)');
        ctx.fillStyle = paperWash;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      } catch (e) {
        console.warn("Failed to load generated back image for decorative layer", e);
      }
    } else if (backMode === 'ai') {
      // Visible local fallback for AI-back mode. This prevents the UI from looking
      // identical to the fixed template while the remote AI image is missing.
      ctx.save();
      const scale = Math.max(cw / img.width, ch / img.height);
      const sw = cw / scale;
      const sh = ch / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.globalAlpha = 0.28;
      ctx.filter = 'grayscale(0.75) sepia(0.18) blur(1.5px) brightness(1.15)';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      ctx.filter = 'none';
      ctx.globalAlpha = 0.62;
      const wash = ctx.createLinearGradient(0, 0, cw, ch);
      wash.addColorStop(0, 'rgba(255,255,255,0.78)');
      wash.addColorStop(0.45, 'rgba(255,255,255,0.50)');
      wash.addColorStop(1, 'rgba(255,255,255,0.82)');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
    }
    
    // 1. Draw Stamp based on theme
    ctx.save();
    const stampX = cw - padding - stampSize;
    const stampY = padding;
    
    if (theme === 'modern') {
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(stampX, stampY, stampSize, stampSize);
      ctx.fillStyle = '#262626';
      ctx.font = `bold ${stampSize * 0.15}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      const postageText = isChinese ? '邮资' : 'POSTAGE';
      ctx.fillText(postageText, stampX + stampSize / 2, stampY + stampSize * 0.9);
      // Modern icon in stamp
      drawArtisticIcon(ctx, artisticIcons[0] || 'sun', stampX + stampSize * 0.25, stampY + stampSize * 0.2, stampSize * 0.5, '#262626');
    } else if (theme === 'vintage') {
      // Ornate stamp border
      ctx.strokeStyle = '#8b4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const r = 4; // scallop radius
      for(let x = stampX; x <= stampX + stampSize; x += r*2) {
        ctx.arc(x, stampY, r, 0, Math.PI, true);
        ctx.arc(x, stampY + stampSize * 1.2, r, 0, Math.PI, false);
      }
      for(let y = stampY; y <= stampY + stampSize * 1.2; y += r*2) {
        ctx.arc(stampX, y, r, Math.PI/2, Math.PI*1.5, false);
        ctx.arc(stampX + stampSize, y, r, Math.PI/2, Math.PI*1.5, true);
      }
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(139, 69, 19, 0.05)';
      ctx.fillRect(stampX, stampY, stampSize, stampSize * 1.2);
      
      // Vintage icon
      drawArtisticIcon(ctx, artisticIcons[0] || 'compass', stampX + stampSize * 0.2, stampY + stampSize * 0.3, stampSize * 0.6, '#8b4513');
    } else {
      // Classic / Handwritten (Artistic Stamp)
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(stampX, stampY, stampSize, stampSize * 1.2);
      ctx.shadowColor = 'transparent';

      const innerPadding = stampSize * 0.1;
      const stampInnerW = stampSize - innerPadding * 2;
      const stampInnerH = stampSize * 1.2 - innerPadding * 2;
      
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(stampX + innerPadding, stampY + innerPadding, stampInnerW, stampInnerH);
      
      drawArtisticIcon(ctx, artisticIcons[0] || 'mountain', stampX + stampSize * 0.2, stampY + stampSize * 0.3, stampSize * 0.6, '#78716c');
    }
    
    // Wavy postmark lines
    ctx.strokeStyle = theme === 'vintage' ? 'rgba(139, 69, 19, 0.3)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for(let i=0; i<4; i++) {
      const lineY = padding + stampSize * 0.4 + i * (stampSize * 0.15);
      ctx.moveTo(stampX - stampSize * 0.5, lineY);
      for(let x = stampX - stampSize * 0.5; x < stampX + stampSize * 1.2; x += 10) {
        ctx.lineTo(x, lineY + Math.sin(x * 0.2) * 3);
      }
    }
    ctx.stroke();
    ctx.restore();

    // 2. Postmark Circle
    if (settings.aiBackTemplate) {
      const postmarkX = cw - padding - stampSize * 2.2;
      const postmarkY = padding + stampSize * 0.6;
      const postmarkRadius = stampSize * 0.7;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(postmarkX, postmarkY, postmarkRadius, 0, Math.PI * 2);
      ctx.strokeStyle = theme === 'vintage' ? 'rgba(139, 69, 19, 0.4)' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      if (theme !== 'modern') {
        ctx.beginPath();
        ctx.arc(postmarkX, postmarkY, postmarkRadius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.font = `bold ${stampSize * 0.15}px ${theme === 'modern' ? '"Inter", sans-serif' : '"Cinzel", serif'}`;
      ctx.fillStyle = theme === 'vintage' ? 'rgba(139, 69, 19, 0.6)' : 'rgba(0,0,0,0.4)';
      ctx.textAlign = 'center';
      ctx.fillText(location.substring(0, 15).toUpperCase(), postmarkX, postmarkY - stampSize * 0.05);
      ctx.font = `${stampSize * 0.1}px "Inter", sans-serif`;
      ctx.fillText(date || new Date().toLocaleDateString(), postmarkX, postmarkY + stampSize * 0.15);
      ctx.restore();
    }

    // 3. Layout & Divider Line
    if (templateVariant === 'sidebar') {
      // Modern layout: No center divider, instead a subtle left border for address
      ctx.beginPath();
      ctx.moveTo(dividerX, padding * 1.35);
      ctx.lineTo(dividerX, ch - padding * 1.35);
      ctx.strokeStyle = 'rgba(15,23,42,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(dividerX, padding * 1.2);
      ctx.lineTo(dividerX, ch - padding * 1.2);
      ctx.strokeStyle = theme === 'vintage' ? '#d2b48c' : '#e7e5e4';
      ctx.lineWidth = 1;
      
      if (theme === 'handwritten') {
        ctx.beginPath();
        for (let y = padding * 1.2; y < ch - padding * 1.2; y += 10) {
          ctx.lineTo(dividerX + Math.sin(y * 0.05) * 3, y);
        }
      } else if (theme === 'vintage') {
        ctx.setLineDash([5, 5]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      if (theme === 'classic' || theme === 'vintage') {
        ctx.save();
        ctx.translate(dividerX, ch / 2);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = theme === 'vintage' ? '#8b4513' : '#d6d3d1';
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      }
    }

    // 4. Address Lines
    ctx.strokeStyle = theme === 'vintage' ? '#d2b48c' : '#d6d3d1';
    ctx.lineWidth = 1.5;
    const startY = ch * 0.55;
    const lineSpacing = ch * 0.08;
    const lineCount = theme === 'modern' ? 3 : 4;
    
    for (let i = 0; i < lineCount; i++) {
      ctx.beginPath();
      const lineXStart = addressLineStart;
      ctx.moveTo(lineXStart, startY + (i * lineSpacing));
      ctx.lineTo(cw - padding, startY + (i * lineSpacing));
      ctx.stroke();
    }

    // 6. Artistic Icons from AI
    if (artisticIcons && artisticIcons.length > 0) {
      const iconColor = theme === 'vintage' ? 'rgba(139, 69, 19, 0.3)' : 'rgba(0,0,0,0.15)';
      const iconSize = ch * 0.08;
      
      // Draw one icon near the message area
      drawArtisticIcon(ctx, artisticIcons[0], padding, ch - padding * 2.5, iconSize, iconColor);
      
      // If there's a second icon, place it elsewhere
      if (artisticIcons[1]) {
        drawArtisticIcon(ctx, artisticIcons[1], cw * 0.4, padding * 1.2, iconSize * 0.8, iconColor);
      }
    }

    // 7. Author and Date
    ctx.save();
    ctx.textAlign = 'left';

    if (theme === 'modern') {
      ctx.font = `600 ${ch * 0.018}px "Inter", sans-serif`;
      ctx.fillStyle = '#a8a29e';
      ctx.letterSpacing = "2px";
      if (author) {
        const byText = isChinese ? `摄：${author.toUpperCase()}` : `BY ${author.toUpperCase()}`;
        ctx.fillText(byText, padding, ch - padding);
      }
      if (date) {
        ctx.fillText(date, padding + cw * 0.2, ch - padding);
      }
    } else if (theme === 'vintage') {
      ctx.font = `italic ${ch * 0.022}px "Cinzel", serif`;
      ctx.fillStyle = '#8b4513';
      ctx.globalAlpha = 0.7;
      if (author) {
        const photoByText = isChinese ? `摄影：${author}` : `Photographed by ${author}`;
        ctx.fillText(photoByText, padding, ch - padding - ch * 0.03);
      }
      if (date) {
        const dateLabel = isChinese ? `日期：` : `Date: `;
        ctx.font = `${ch * 0.018}px "Inter", sans-serif`;
        ctx.fillText(`${dateLabel}${date}`, padding, ch - padding);
      }
    } else {
      ctx.font = `italic ${ch * 0.025}px "Playfair Display", serif`;
      ctx.fillStyle = '#78716c';
      if (author) {
        const photoByText = isChinese ? `摄影：${author}` : `Photographed by ${author}`;
        ctx.fillText(photoByText, padding, ch - padding - ch * 0.03);
      }
      if (date) {
        const dateLabel = isChinese ? `日期：` : `Date: `;
        ctx.font = `${ch * 0.02}px "Inter", sans-serif`;
        ctx.fillText(`${dateLabel}${date}`, padding, ch - padding);
      }
    }
    ctx.restore();

    // 8. Message
    if (settings.aiBackTemplate) {
      const style = backStyle || { fontSize: 3.2, color: '#44403c' };
      const fontSize = ch * (style.fontSize / 100);
      let lineHeight = fontSize * 1.6;
      
      ctx.fillStyle = style.color;
      
      let messageFont = '"Inter", sans-serif';
      if (theme === 'modern') messageFont = '"Inter", sans-serif';
      if (theme === 'vintage') messageFont = '"Playfair Display", serif';
      if (theme === 'handwritten') messageFont = '"Caveat", cursive';
      
      ctx.font = `${theme === 'vintage' ? 'italic' : ''} ${fontSize}px ${messageFont}`;
      ctx.textAlign = 'left';
      
      const formattedMessage = message.trim();
      const paragraphs = formattedMessage.split('\n');
      
      let y = templateVariant === 'gallery' ? ch * 0.25 : ch * 0.22; // Reset to default Y as illustration is now background
      const maxWidth = messageMaxWidth;
      const x = padding;

      // Dynamic font size adjustment for short texts to prevent awkward orphans
      let currentFontSize = fontSize;
      if (paragraphs.length === 1) {
        let totalWidth = ctx.measureText(paragraphs[0]).width;
        if (totalWidth > maxWidth && totalWidth < maxWidth * 1.4) {
          // Shrink font slightly so it fits on one line instead of wrapping 1-2 words
          currentFontSize = currentFontSize * (maxWidth / totalWidth) * 0.95;
          ctx.font = `${theme === 'vintage' ? 'italic' : ''} ${currentFontSize}px ${messageFont}`;
          lineHeight = currentFontSize * 1.6;
        }
      }

      // Draw horizontal lines for handwritten theme
      if (theme === 'handwritten') {
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        for(let ly = y + fontSize; ly < ch - padding * 2; ly += lineHeight) {
          ctx.beginPath();
          ctx.moveTo(x, ly);
          ctx.lineTo(x + maxWidth, ly);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) {
          y += lineHeight * 0.5;
          continue;
        }
        
        let line = '';
        const words = paragraph.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          let word = words[i];
          
          if (ctx.measureText(word).width > maxWidth) {
            for (const char of word) {
              const testLine = line + char;
              if (ctx.measureText(testLine).width > maxWidth && line !== '') {
                ctx.fillText(line, x, y);
                line = char;
                y += lineHeight;
              } else {
                line = testLine;
              }
            }
            line += ' ';
          } else {
            const testLine = line + word + ' ';
            if (ctx.measureText(testLine).width > maxWidth && line !== '') {
              ctx.fillText(line, x, y);
              line = word + ' ';
              y += lineHeight;
            } else {
              line = testLine;
            }
          }
        }
        if (line.trim() !== '') {
          ctx.fillText(line.trim(), x, y);
        }
        y += lineHeight;
      }
    }

    // 9. Watermark (Logo + 服务名 + 网址) - 使用 promo 积分或后台开启品牌信息时显示
    const watermark = useWatermark && (brandConfig.logoUrl() || brandConfig.brandName('zh'));
    if (watermark) {
      const locale = language.startsWith('zh') ? 'zh' : (isChinese ? 'zh' : 'en');
      await drawBackBrandSignature(ctx, cw, ch, {
        anchor: templateVariant === 'sidebar' ? 'right' : 'left',
        padding: padding * 1.1,
        locale,
      });
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const getCompressedBase64 = (img: HTMLImageElement, maxDim = 600, quality = 0.6): string => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    
    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }
    return canvas.toDataURL('image/jpeg', quality);
  };

  const displayedHistory = editId 
    ? history.filter(r => r.id === editId) 
    : history.filter(r => currentBatchIds.includes(r.id));

  const handleDownloadAll = async () => {
    const selectedResults = displayedHistory.filter(r => r.selected);
    if (selectedResults.length === 0) return;

    const zip = new JSZip();
    
    for (let i = 0; i < selectedResults.length; i++) {
      const result = selectedResults[i];
      try {
        const safeTitle = (result.draftTitle || result.title || `postcard`).replace(/[<>:"/\\|?*]/g, '_');
        // Add a short unique ID suffix to prevent filename collisions
        const uniqueSuffix = result.id.substring(0, 4);
        const fileNameBase = `${safeTitle}_${uniqueSuffix}`;
        
        const frontBase64 = (result.frontDataUrl || result.frontUrl).split(',')[1];
        const backValue = result.backDataUrl || result.backUrl;
        
        zip.file(`${fileNameBase}_front.jpg`, frontBase64, { base64: true });
        if (backValue) {
          const backBase64 = backValue.split(',')[1];
          zip.file(`${fileNameBase}_back.jpg`, backBase64, { base64: true });
        }
      } catch (e) {
        console.error("Failed to add to batch download", e);
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `postcards_batch_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleDownloadSingle = async (result: ProcessedPostcard) => {
    try {
      const safeTitle = (result.draftTitle || result.title || 'postcard').replace(/[<>:"/\\|?*]/g, '_');
      
      const a1 = document.createElement('a');
      a1.href = result.frontDataUrl || result.frontUrl;
      a1.download = `${safeTitle}_front.jpg`;
      a1.click();

      if (result.backDataUrl || result.backUrl) {
        setTimeout(() => {
          const a2 = document.createElement('a');
          a2.href = result.backDataUrl || result.backUrl;
          a2.download = `${safeTitle}_back.jpg`;
          a2.click();
        }, 300);
      }
    } catch (e) {
      console.error("Failed to download postcard", e);
      alert("Failed to download. Please try again.");
    }
  };

  const handleShareExport = async (result: ProcessedPostcard, shareType: ShareType) => {
    try {
      setSharingId(`${result.id}:${shareType}`);
      const brandingCfg = await getShareBranding();
      const shouldBrand = shareType === 'front_only' && result.watermark === true && brandingCfg.enabled;
      const blob = await buildShareCardBlob(
        result.frontDataUrl || result.frontUrl,
        result.backDataUrl || result.backUrl,
        shareType,
        {
          enabled: shouldBrand,
          text: brandingCfg.text,
          opacity: brandingCfg.opacity,
          sizeRatio: brandingCfg.sizeRatio,
        }
      );
      const filenameBase = (result.draftTitle || result.title || 'postcard').replace(/[<>:"/\\|?*]/g, '_');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filenameBase}_${shareType}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      // Best-effort cloud record for share images (does not block user download)
      if (user.id && isSupabaseConnected) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          const dataUrl = await blobToDataUrl(blob);
          await fetch('/api/share-card/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              postcardLocalId: result.id,
              shareType,
              dataUrl,
            }),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('Failed to export share card', e);
      alert(language === 'zh' ? '分享图导出失败，请重试。' : 'Failed to export share image.');
    } finally {
      setSharingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setHistory(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const updateDraft = (field: 'draftTitle' | 'draftLocation' | 'draftMessage' | 'draftAuthor' | 'draftDate', value: string) => {
    setEditingDraft(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateDraftStyle = (side: 'front' | 'back', field: string, value: any) => {
    setEditingDraft(prev => {
      if (!prev) return prev;
      if (side === 'front') {
        return { ...prev, draftFrontStyle: { ...prev.draftFrontStyle, [field]: value } };
      } else {
        return { ...prev, draftBackStyle: { ...prev.draftBackStyle, [field]: value } };
      }
    });
  };

  const updateFrontPositionPreset = (position: string) => {
    setEditingDraft((prev) => prev ? {
      ...prev,
      draftFrontStyle: {
        ...prev.draftFrontStyle,
        position,
        ...(position === 'custom' ? {} : { xPct: undefined, yPct: undefined }),
      },
    } : prev);
  };

  const getFrontTextPosition = (style: ProcessedPostcard['frontStyle']) => {
    const x = Number(style?.xPct);
    const y = Number(style?.yPct);
    if (style?.xPct != null && style?.yPct != null && Number.isFinite(x) && Number.isFinite(y)) {
      return { x, y };
    }
    const positions: Record<string, { x: number; y: number }> = {
      'top-left': { x: 18, y: 18 },
      'top-right': { x: 82, y: 18 },
      'bottom-left': { x: 18, y: 80 },
      'bottom-right': { x: 82, y: 80 },
      center: { x: 50, y: 50 },
    };
    return positions[style?.position] || positions['bottom-left'];
  };

  const updateFrontTextPosition = (axis: 'xPct' | 'yPct', value: number) => {
    setEditingDraft((prev) => {
      if (!prev) return prev;
      const current = getFrontTextPosition(prev.draftFrontStyle);
      return {
        ...prev,
        draftFrontStyle: {
          ...prev.draftFrontStyle,
          position: 'custom',
          xPct: axis === 'xPct' ? value : current.x,
          yPct: axis === 'yPct' ? value : current.y,
        },
      };
    });
  };

  const handleFrontTextDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!editingDraft) return;
    if (event.type === 'pointerdown') {
      isDraggingFrontText.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (event.type === 'pointermove' && !isDraggingFrontText.current) return;
    const preview = event.currentTarget.parentElement;
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    const xPct = clampNumber(((event.clientX - rect.left) / rect.width) * 100, 10, 90);
    const yPct = clampNumber(((event.clientY - rect.top) / rect.height) * 100, 10, 90);
    setEditingDraft((prev) => prev ? {
      ...prev,
      draftFrontStyle: {
        ...prev.draftFrontStyle,
        position: 'custom',
        xPct,
        yPct,
      },
    } : prev);
  };

  const handleRegenerate = async (id: string, saveAsNew: boolean = false) => {
    const result = editingDraft;
    if (!result || result.id !== id) return;

    try {
      const img = await loadImage(result.imgUrl || '');
      const useWatermark = result.watermark === true || (result.settings.backBrandingEnabled !== false && result.settings.backDesignMode !== 'none');
      const backMode = result.settings.backDesignMode ?? (result.settings.aiBackTemplate ? 'ai' : 'template');
      const newFront = await generateFront(img, result.draftTitle || '', result.draftLocation || '', result.theme || 'standard', result.settings, result.draftFrontStyle, result.draftAuthor, result.draftDate, result.watermark === true && backMode === 'none');
      const newBack = backMode === 'none'
        ? ''
        : await generateBack(
            img,
            result.draftMessage || '',
            result.draftLocation || '',
            result.postmark || '',
            result.theme || 'standard',
            result.settings,
            result.draftBackStyle,
            result.draftAuthor,
            result.draftDate,
            result.decorativeIcons,
            result.generatedBackImage,
            useWatermark
          );

      const updatedPostcard = { 
        ...result, 
        title: result.draftTitle, 
        location: result.draftLocation, 
        message: result.draftMessage, 
        author: result.draftAuthor,
        date: result.draftDate,
        frontDataUrl: newFront, 
        backDataUrl: newBack,
        frontStyle: result.draftFrontStyle,
        backStyle: result.draftBackStyle
      };

      if (saveAsNew) {
        const newId = Date.now().toString();
        setHistory(prev => [{ ...updatedPostcard, id: newId, createdAt: Date.now() }, ...prev]);
        setCurrentBatchIds(prev => [newId, ...prev]);
        setEditingResultId(null);
        if (onClearEdit) onClearEdit();
      } else {
        setHistory(prev => prev.map(r => r.id === id ? updatedPostcard : r));
        setEditingResultId(null);
        if (onClearEdit) onClearEdit();
      }
    } catch (e: any) {
      console.error("Failed to regenerate canvas", e);
      if (e.message?.includes('Failed to load image')) {
        alert("Cannot edit this older postcard because the original image data is no longer available. Please create a new postcard with the original photo.");
      } else {
        alert("Failed to apply changes. Please try again.");
      }
    }
  };

  const getRetentionText = () => {
    if (user.level === 'vip') return vipRetentionDays === 0 ? 'Permanent' : `${vipRetentionDays} Days`;
    return `${freeRetentionDays} Days`;
  };

  const getBackMode = (settings: SettingsType) =>
    settings.backDesignMode ?? (settings.aiBackTemplate ? 'ai' : 'template');

  const generateAiBackImageForDraft = async (result: ProcessedPostcard) => {
    const prompt = `Create a subtle decorative illustration for the back of a postcard.
This is not a full image remake. Do not redraw the photo literally. Extract only the mood and one or two small symbolic details from the scene.
Target language/context: ${result.settings.aiLanguage || 'Chinese'}.
Title: ${result.draftTitle || result.title || ''}
Location: ${result.draftLocation || result.location || ''}
Date: ${result.draftDate || result.date || ''}
Message: ${result.draftMessage || result.message || ''}
Visual direction: refined pencil sketch, soft pastel accents, airy white background, generous negative space, understated corner vignette or faint paper-texture motif, premium travel postcard back, no photorealism, no full-bleed scene, no readable text, no watermark, no logo.`;

    const response = await withTimeout(
      invokePostcardAi('image', {
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      }),
      90000,
      "AI back redraw timed out."
    );

    const generatedImage = getGeneratedImageSource(response);
    if (!generatedImage) throw new Error('AI did not return an image.');
    return generatedImage;
  };

  const ensureAiBackImage = async (result: ProcessedPostcard, force = false) => {
    if (getBackMode(result.settings) !== 'ai') return result;
    if (!force && result.generatedBackImage) return result;
    if (user.credits < 1) {
      setShowPricing(true);
      throw new Error(language === 'zh' ? '积分不足，无法生成 AI 背面图。' : 'Not enough credits to generate AI back image.');
    }

    setRewritingState({ id: result.id, field: 'back' });
    try {
      const generatedBackImage = await generateAiBackImageForDraft(result);
      const nextDraft = { ...result, generatedBackImage };
      setEditingDraft(nextDraft);
      if (user.id && isSupabaseConnected) {
        const creditRes = await updateUserCredits(user.id, -1, 'generation_cost', {
          referenceId: result.id,
          notes: 'Generate AI back decorative image',
          operator: 'system',
          bucket: null,
        });
        if (creditRes.ok && creditRes.data) {
          setUser(prev => ({
            ...prev,
            credits: creditRes.data!.total_credits,
            promo_credits: creditRes.data!.promo_credits,
            paid_credits: creditRes.data!.paid_credits,
          }));
        } else {
          setUser(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
        }
      } else {
        setUser(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
      }
      return nextDraft;
    } finally {
      setRewritingState(null);
    }
  };

  const handleUpdatePreview = async (
    draftToUse?: ProcessedPostcard,
    options: { generateMissingAiBack?: boolean } = { generateMissingAiBack: false }
  ) => {
    if (!editingResultId) return;
    let result = draftToUse || editingDraft;
    if (!result || !result.imgUrl) return;
    const sourceImageUrl = result.imgUrl;

    try {
      const backMode = getBackMode(result.settings);
      if (options.generateMissingAiBack !== false && backMode === 'ai' && !result.generatedBackImage) {
        result = await ensureAiBackImage(result);
      }
      const img = await loadImage(sourceImageUrl);
      const useWatermark = result.watermark === true || (result.settings.backBrandingEnabled !== false && result.settings.backDesignMode !== 'none');
      const newFront = await generateFront(img, result.draftTitle || '', result.draftLocation || '', result.theme || 'standard', result.settings, result.draftFrontStyle, result.draftAuthor, result.draftDate, result.watermark === true && backMode === 'none');
      const newBack = backMode === 'none'
        ? ''
        : await generateBack(
            img,
            result.draftMessage || '',
            result.draftLocation || '',
            result.postmark || '',
            result.theme || 'standard',
            result.settings,
            result.draftBackStyle,
            result.draftAuthor,
            result.draftDate,
            result.decorativeIcons,
            result.generatedBackImage,
            useWatermark
          );
      setLivePreview({ front: newFront, back: newBack });
    } catch (e) {
      console.error("Failed to generate live preview", e);
      alert(language === 'zh'
        ? `预览更新失败：${e instanceof Error ? e.message : '请稍后再试'}`
        : `Failed to update preview: ${e instanceof Error ? e.message : 'Please try again.'}`);
    }
  };

  const handleRegenerateBackImage = async (photoId: string) => {
    const result = editingDraft && editingDraft.id === photoId ? editingDraft : history.find(r => r.id === photoId);
    if (!result) return;
    const backMode = getBackMode(result.settings);
    if (backMode !== 'ai') {
      alert(language === 'zh' ? '当前不是 AI 背面模式，请先在全局设置中选择 AI 重绘背面。' : 'AI back mode is not enabled.');
      return;
    }
    if (user.credits < 1) {
      setShowPricing(true);
      return;
    }

    try {
      const nextDraft = await ensureAiBackImage(result, true);
      await handleUpdatePreview(nextDraft);
    } catch (e: any) {
      console.error('Failed to redraw back image', e);
      alert(language === 'zh'
        ? `AI 背面重绘失败：${e?.message || '请稍后再试'}`
        : `Failed to redraw the back: ${e?.message || 'Please try again.'}`);
    }
  };

  const handleBatchGenerateBackImages = async () => {
    if (batchBackState.running) return;
    const targets = displayedHistory.filter((result) =>
      result.selected &&
      getBackMode(result.settings) === 'ai' &&
      !result.generatedBackImage &&
      !!result.imgUrl
    );
    if (targets.length === 0) {
      alert(language === 'zh'
        ? '没有需要生成 AI 背面图的已选明信片。'
        : 'No selected postcards need an AI back image.');
      return;
    }
    if (user.credits < targets.length) {
      setShowPricing(true);
      alert(language === 'zh'
        ? `批量生成需要 ${targets.length} 积分，当前只有 ${user.credits}。`
        : `Batch generation needs ${targets.length} credits, but you only have ${user.credits}.`);
      return;
    }

    setBatchBackState({ running: true, done: 0, total: targets.length });
    let successCount = 0;
    let failedCount = 0;

    for (const target of targets) {
      setRewritingState({ id: target.id, field: 'back' });
      try {
        const generatedBackImage = await generateAiBackImageForDraft(target);
        const img = await loadImage(target.imgUrl || '');
        const backMode = getBackMode(target.settings);
        const useWatermark = target.watermark === true || (target.settings.backBrandingEnabled !== false && backMode !== 'none');
        const newBack = backMode === 'none'
          ? ''
          : await generateBack(
              img,
              target.draftMessage || target.message || '',
              target.draftLocation || target.location || '',
              target.postmark || '',
              target.theme || 'standard',
              target.settings,
              target.draftBackStyle || target.backStyle,
              target.draftAuthor || target.author,
              target.draftDate || target.date,
              target.decorativeIcons,
              generatedBackImage,
              useWatermark
            );
        const updated = {
          ...target,
          generatedBackImage,
          backDataUrl: newBack,
          backUrl: newBack || target.backUrl,
        };
        setHistory(prev => prev.map(item => item.id === target.id ? updated : item));
        setEditingDraft(prev => prev?.id === target.id ? { ...prev, ...updated } : prev);

        if (user.id && isSupabaseConnected) {
          const creditRes = await updateUserCredits(user.id, -1, 'generation_cost', {
            referenceId: target.id,
            notes: 'Batch generate AI back decorative image',
            operator: 'system',
            bucket: null,
          });
          if (creditRes.ok && creditRes.data) {
            setUser(prev => ({
              ...prev,
              credits: creditRes.data!.total_credits,
              promo_credits: creditRes.data!.promo_credits,
              paid_credits: creditRes.data!.paid_credits,
            }));
          } else {
            setUser(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
          }
        } else {
          setUser(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
        }
        successCount += 1;
      } catch (e) {
        failedCount += 1;
        console.error('Batch AI back generation failed', target.id, e);
      } finally {
        setBatchBackState(prev => ({ ...prev, done: prev.done + 1 }));
      }
    }

    setRewritingState(null);
    setBatchBackState(prev => ({ ...prev, running: false }));
    if (failedCount > 0) {
      alert(language === 'zh'
        ? `批量生成完成：成功 ${successCount} 张，失败 ${failedCount} 张。`
        : `Batch finished: ${successCount} succeeded, ${failedCount} failed.`);
    }
  };

  const handleCancelEdit = () => {
    setEditingResultId(null);
    if (onClearEdit) onClearEdit();
  };

  useEffect(() => {
    if (!editingResultId) {
      setLivePreview(null);
      setEditingDraft(null);
      return;
    }
    const result = history.find(r => r.id === editingResultId);
    if (!result) return;
    
    setEditingDraft({ ...result });
    // Initial load of live preview when opening modal
    handleUpdatePreview({ ...result }, { generateMissingAiBack: false });
  }, [editingResultId]);

  const handleRewriteField = async (photoId: string, field: 'title' | 'location' | 'message') => {
    if (user.credits < 1) {
      setShowPricing(true);
      return;
    }

    const result = editingDraft && editingDraft.id === photoId ? editingDraft : history.find(r => r.id === photoId);
    if (!result) return;
    
    setRewritingState({ id: photoId, field });
    try {
      const img = await loadImage(result.imgUrl || '');
      const base64Data = getCompressedBase64(img);
      
      let prompt = `You are a postcard copywriter. Rewrite the postcard ${field} based on the image.
Language MUST BE: ${result.settings.aiLanguage || 'Chinese'}. Do NOT output any other language. If the language is Chinese, do NOT use English.
Current ${field}: "${result[`draft${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof ProcessedPostcard]}"
Make it creative, new, and fitting for a postcard.
OUTPUT ONLY THE NEW TEXT. No quotes, no markdown, no explanations.`;

      if (field === 'message') {
        prompt += `\nKeep it concise and elegant (max 2 sentences). Style: '信雅达' (faithful, expressive, elegant). Split into paragraphs using \\n\\n if necessary.`;
      } else if (field === 'title') {
        prompt += `\nMake it a very short, elegant, and poetic phrase (max 4-6 words). Style: '信雅达' (faithful, expressive, elegant).`;
      } else if (field === 'location') {
        prompt += `\nKeep it to just a real public location name (city, country, region, or landmark). If the image has no recognizable public place, output nothing. Never output vague/private guesses such as "家中", "家里", "室内", "房间", "home", or "indoors".`;
      }

      const response = await withTimeout(
        invokePostcardAi('chat', {
          model: "gpt-4o",
          temperature: 0.8,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: base64Data } },
              ],
            },
          ],
        }),
        60000,
        "AI Rewrite timed out."
      );
      let newText = response.choices?.[0]?.message?.content || '';
      
      newText = newText.trim().replace(/^["']|["']$/g, '');
      
      if (field === 'message') {
        newText = newText.trim();
      } else if (field === 'location') {
        newText = cleanInferredLocation(newText);
      }
      
      if (editingDraft && editingDraft.id === photoId) {
        updateDraft(`draft${field.charAt(0).toUpperCase() + field.slice(1)}` as 'draftTitle' | 'draftLocation' | 'draftMessage', newText);
      } else {
        setHistory(prev => prev.map(r => r.id === photoId ? { ...r, [`draft${field.charAt(0).toUpperCase() + field.slice(1)}`]: newText } : r));
      }
      
      setUser(prev => ({ ...prev, credits: Math.max(0, prev.credits - 1) }));
    } catch (e: any) {
      console.error(`Failed to rewrite ${field}`, e);
      if (e.message?.includes('Failed to load image')) {
        alert("Cannot rewrite this older postcard because the original image data is no longer available. Please create a new postcard with the original photo.");
      } else {
        alert(`Failed to rewrite ${field}. Please try again.`);
      }
    } finally {
      setRewritingState(null);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <div className="relative mb-12">
          <div className="w-32 h-32 border-4 border-stone-100 rounded-full"></div>
          <div 
            className="absolute inset-0 border-4 border-stone-900 rounded-full border-t-transparent animate-spin"
            style={{ clipPath: `conic-gradient(from 0deg, transparent ${progress}%, black ${progress}%)` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-stone-900">{progress}%</span>
          </div>
        </div>
        <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold text-stone-900 mb-4 tracking-tight">{t.processing}</h2>
        <p className="text-stone-500 max-w-md mx-auto leading-relaxed text-[clamp(0.875rem,2vw,1rem)]">
          {t.wait}
        </p>
        <div className="mt-12 flex items-center gap-8 text-stone-400">
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-widest font-bold">{t.encrypted}</span>
          </div>
          <div className="w-px h-8 bg-stone-100"></div>
          <div className="flex flex-col items-center gap-2">
            <Clock className="w-6 h-6" />
            <span className="text-[10px] uppercase tracking-widest font-bold">{t.retention}: {getRetentionText()}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full flex-1 py-20">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2 text-stone-900">{t.error}</h2>
        <p className="text-stone-500 mb-8 text-center max-w-md break-words">{error}</p>
        <button
          onClick={onBack}
          className="bg-stone-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors"
        >
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[clamp(1.25rem,4vw,1.5rem)] font-semibold tracking-tight mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            {t.results}
          </h2>
          <p className="text-stone-500 text-[clamp(0.875rem,2vw,1rem)]">{t.resultsDesc.replace('{count}', displayedHistory.length.toString())}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onFeedback}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
            title="Questions or Feedback?"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-stone-500" />
            <span className="bg-transparent text-sm font-medium text-stone-700">
              {user.level === 'vip' ? t.vip : t.free}
            </span>
          </div>
          {displayedHistory.some(r => r.selected && getBackMode(r.settings) === 'ai' && !r.generatedBackImage) && (
            <button
              onClick={handleBatchGenerateBackImages}
              disabled={batchBackState.running}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {batchBackState.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {batchBackState.running
                ? `${batchBackState.done}/${batchBackState.total}`
                : (language === 'zh' ? '批量 AI 背面' : 'Batch AI Back')}
            </button>
          )}
          <button
            onClick={handleDownloadAll}
            disabled={displayedHistory.filter(r => r.selected).length === 0}
            className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {t.downloadAll} ({displayedHistory.filter(r => r.selected).length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {displayedHistory.map((result, idx) => {
            return (
              <div key={result.id} className={cn("relative group rounded-2xl border-2 transition-all overflow-hidden flex flex-col bg-white", result.selected ? "border-stone-900 shadow-md" : "border-stone-200 hover:border-stone-300")}>
                <button
                  type="button"
                  aria-label={`${t.edit}: ${result.title || `Postcard ${idx + 1}`}`}
                  className="relative block aspect-[3/2] w-full bg-stone-100 overflow-hidden cursor-pointer text-left"
                  onClick={() => setEditingResultId(result.id)}
                >
                  <img src={result.frontDataUrl} alt="Front" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm text-stone-900 px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-sm">
                      <Edit3 className="w-4 h-4" /> {t.edit}
                    </div>
                  </div>
                </button>
                
                  <div className="p-3 flex items-center justify-between bg-white border-t border-stone-100">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={result.selected}
                        onChange={() => toggleSelect(result.id)}
                      />
                      <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0", result.selected ? "bg-stone-900 border-stone-900 text-white" : "border-stone-300 bg-white")}>
                        {result.selected && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-sm font-medium text-stone-700 truncate">{result.draftTitle || `Postcard ${idx + 1}`}</span>
                    </label>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareExport(result, 'front_only');
                        }}
                        disabled={sharingId === `${result.id}:front_only`}
                        className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                        title={language === 'zh' ? '分享图（仅正面）' : 'Share card (front only)'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareExport(result, 'front_back');
                        }}
                        disabled={sharingId === `${result.id}:front_back`}
                        className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                        title={language === 'zh' ? '分享图（正反面）' : 'Share card (front + back)'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSingle(result);
                        }}
                        className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                        title={t.download}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              </div>
            );
          })}
        </div>

      </div>

      <div className="mt-auto pt-6 flex items-center justify-between border-t border-stone-100">
        <button
          onClick={onBack}
          className="text-stone-500 hover:text-stone-900 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.startOver}
        </button>
        <button
          onClick={() => {
            if (onOpenHistory) onOpenHistory();
            else if (onClearEdit) onClearEdit();
          }}
          className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Clock className="w-4 h-4" />
          {t.viewHistory || 'View History'}
        </button>
      </div>

      {/* Edit Modal */}
      {editingResultId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 lg:p-6">
          <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[96dvh] sm:rounded-2xl lg:rounded-3xl shadow-2xl sm:max-w-7xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {(() => {
              const result = editingDraft;
              if (!result) return null;
              const originalResult = history.find(r => r.id === editingResultId);
              const hasChanges = originalResult && (
                (originalResult.title || '') !== (result.draftTitle || '') || 
                (originalResult.location || '') !== (result.draftLocation || '') || 
                (originalResult.message || '') !== (result.draftMessage || '') ||
                (originalResult.author || '') !== (result.draftAuthor || '') ||
                (originalResult.date || '') !== (result.draftDate || '') ||
                JSON.stringify(originalResult.frontStyle) !== JSON.stringify(result.draftFrontStyle) ||
                JSON.stringify(originalResult.backStyle) !== JSON.stringify(result.draftBackStyle)
              );
              
              return (
                <>
                  <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/95 backdrop-blur">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-6">
                      <h3 className="font-semibold text-base sm:text-lg text-stone-900 flex items-center gap-2 shrink-0">
                        <Edit3 className="w-5 h-5 text-stone-500" />
                        {t.edit}
                      </h3>
                      <div className="flex bg-stone-200/50 p-1 rounded-lg min-w-0">
                        <button
                          onClick={() => setEditTab('content')}
                          className={cn("px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors", editTab === 'content' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700")}
                        >
                          {t.content}
                        </button>
                        <button
                          onClick={() => setEditTab('style')}
                          className={cn("px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors", editTab === 'style' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700")}
                        >
                          {t.style}
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleCancelEdit}
                      aria-label={t.cancel}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-8">
                      {/* Previews */}
                      <div className="order-2 lg:order-1 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-6 self-start lg:sticky lg:top-0">
                          <div className="relative rounded-xl overflow-hidden shadow-sm border border-stone-200 bg-stone-100">
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md z-10">
                              {t.front}
                            </div>
                            <img src={livePreview?.front || result.frontDataUrl} alt="Front" className="w-full aspect-[3/2] object-contain" />
                            {(result.draftTitle || result.draftLocation || result.draftAuthor || result.draftDate) && (() => {
                              const pos = getFrontTextPosition(result.draftFrontStyle);
                              return (
                                <button
                                  type="button"
                                  title={language === 'zh' ? '拖动文字位置' : 'Drag text position'}
                                  aria-label={language === 'zh' ? '拖动正面文字位置' : 'Drag front text position'}
                                  onPointerDown={handleFrontTextDrag}
                                  onPointerMove={handleFrontTextDrag}
                                  onPointerUp={() => { isDraggingFrontText.current = false; }}
                                  onPointerCancel={() => { isDraggingFrontText.current = false; }}
                                  className="absolute z-20 max-w-[62%] cursor-grab touch-none select-none rounded-lg border border-white/70 bg-black/45 px-2.5 py-1.5 text-center text-white shadow-md ring-1 ring-black/10 active:cursor-grabbing"
                                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                  <span className="pointer-events-none absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/80 bg-white text-stone-700 shadow-sm">
                                    <Move className="h-3 w-3" />
                                  </span>
                                  {result.draftTitle && <span className="block text-xs font-semibold leading-tight sm:text-sm">{result.draftTitle}</span>}
                                  {result.draftLocation && <span className="mt-0.5 block text-[10px] leading-tight opacity-90 sm:text-xs">{result.draftLocation}</span>}
                                </button>
                              );
                            })()}
                          </div>
                          <div className="relative rounded-xl overflow-hidden shadow-sm border border-stone-200 bg-stone-100">
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md z-10">
                              {t.backSide}
                            </div>
                            {getBackMode(result.settings) === 'ai' && (
                              <button
                                type="button"
                                onClick={() => handleRegenerateBackImage(result.id)}
                                disabled={rewritingState?.id === result.id && rewritingState?.field === 'back'}
                                className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                              >
                                {rewritingState?.id === result.id && rewritingState?.field === 'back'
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Wand2 className="h-3.5 w-3.5" />}
                                {result.generatedBackImage
                                  ? (language === 'zh' ? '重新生成' : 'Regenerate')
                                  : (language === 'zh' ? '生成 AI 背面图（1积分）' : 'Generate AI Back (1 credit)')}
                              </button>
                            )}
                            {(livePreview?.back || result.backDataUrl || result.backUrl) ? (
                              <img src={livePreview?.back || result.backDataUrl || result.backUrl} alt="Back" className="w-full aspect-[3/2] object-contain" />
                            ) : (
                              <div className="w-full aspect-[3/2] flex items-center justify-center text-stone-500 text-sm">
                                {language === 'zh' ? '已关闭背面输出（仅正面）' : 'Back output disabled (front only)'}
                              </div>
                            )}
                          </div>
                      </div>

                      {/* Edit Form */}
                      <div className="order-1 lg:order-2 bg-white flex flex-col h-full min-w-0">
                        {editTab === 'content' ? (
                          <div className="space-y-5 flex-1">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-stone-700">{t.title}</label>
                                <button 
                                  onClick={() => handleRewriteField(result.id, 'title')}
                                  disabled={rewritingState?.id === result.id && rewritingState?.field === 'title'}
                                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                >
                                  {rewritingState?.id === result.id && rewritingState?.field === 'title' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                  AI Rewrite
                                </button>
                              </div>
                              <input
                                type="text"
                                value={result.draftTitle}
                                onChange={(e) => updateDraft('draftTitle', e.target.value)}
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50 focus:bg-white transition-colors"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-stone-700">{t.location}</label>
                                <button 
                                  onClick={() => handleRewriteField(result.id, 'location')}
                                  disabled={rewritingState?.id === result.id && rewritingState?.field === 'location'}
                                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                >
                                  {rewritingState?.id === result.id && rewritingState?.field === 'location' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                  AI Rewrite
                                </button>
                              </div>
                              <input
                                type="text"
                                value={result.draftLocation}
                                onChange={(e) => updateDraft('draftLocation', e.target.value)}
                                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50 focus:bg-white transition-colors"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.author}</label>
                                <input
                                  type="text"
                                  value={result.draftAuthor || ''}
                                  onChange={(e) => updateDraft('draftAuthor', e.target.value)}
                                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50 focus:bg-white transition-colors"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.date}</label>
                                <input
                                  type="text"
                                  value={result.draftDate || ''}
                                  onChange={(e) => updateDraft('draftDate', e.target.value)}
                                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-stone-50 focus:bg-white transition-colors"
                                />
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col min-h-[160px]">
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-stone-700">{t.message}</label>
                                <button 
                                  onClick={() => handleRewriteField(result.id, 'message')}
                                  disabled={rewritingState?.id === result.id && rewritingState?.field === 'message'}
                                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                >
                                  {rewritingState?.id === result.id && rewritingState?.field === 'message' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                  AI Rewrite
                                </button>
                              </div>
                              <textarea
                                value={result.draftMessage}
                                onChange={(e) => updateDraft('draftMessage', e.target.value)}
                                className="w-full flex-1 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 resize-none bg-stone-50 focus:bg-white transition-colors leading-relaxed"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 flex-1">
                            <div className="space-y-4">
                              <h4 className="font-medium text-stone-900 pb-2 border-b border-stone-100">{t.front} {t.style}</h4>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.fontSize} (%)</label>
                                  <input
                                    type="number"
                                    min="2" max="20" step="0.5"
                                    value={result.draftFrontStyle.fontSize}
                                    onChange={(e) => updateDraftStyle('front', 'fontSize', parseFloat(e.target.value))}
                                    className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.color}</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={result.draftFrontStyle.color}
                                      onChange={(e) => updateDraftStyle('front', 'color', e.target.value)}
                                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={result.draftFrontStyle.color}
                                      onChange={(e) => updateDraftStyle('front', 'color', e.target.value)}
                                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.position}</label>
                                <select
                                  value={result.draftFrontStyle.position}
                                  onChange={(e) => updateFrontPositionPreset(e.target.value)}
                                  className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
                                >
                                  <option value="bottom-left">Bottom Left</option>
                                  <option value="bottom-right">Bottom Right</option>
                                  <option value="top-left">Top Left</option>
                                  <option value="top-right">Top Right</option>
                                  <option value="center">Center</option>
                                  <option value="custom">Custom</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="block text-sm font-medium text-stone-700">
                                  <span className="mb-1.5 flex items-center justify-between">
                                    <span>{language === 'zh' ? '水平位置' : 'Horizontal'}</span>
                                    <span className="font-normal text-stone-500">{Math.round(getFrontTextPosition(result.draftFrontStyle).x)}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min="5"
                                    max="95"
                                    value={getFrontTextPosition(result.draftFrontStyle).x}
                                    onChange={(e) => updateFrontTextPosition('xPct', Number(e.target.value))}
                                    className="w-full accent-stone-900"
                                  />
                                </label>
                                <label className="block text-sm font-medium text-stone-700">
                                  <span className="mb-1.5 flex items-center justify-between">
                                    <span>{language === 'zh' ? '垂直位置' : 'Vertical'}</span>
                                    <span className="font-normal text-stone-500">{Math.round(getFrontTextPosition(result.draftFrontStyle).y)}%</span>
                                  </span>
                                  <input
                                    type="range"
                                    min="8"
                                    max="92"
                                    value={getFrontTextPosition(result.draftFrontStyle).y}
                                    onChange={(e) => updateFrontTextPosition('yPct', Number(e.target.value))}
                                    className="w-full accent-stone-900"
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-medium text-stone-900 pb-2 border-b border-stone-100">{t.backSide} {t.style}</h4>
                              <button
                                type="button"
                                onClick={() => handleRegenerateBackImage(result.id)}
                                disabled={rewritingState?.id === result.id && rewritingState?.field === 'back'}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                              >
                                {rewritingState?.id === result.id && rewritingState?.field === 'back'
                                  ? <Loader2 className="h-4 w-4 animate-spin" />
                                  : <Wand2 className="h-4 w-4" />}
                                {language === 'zh' ? 'AI 重绘背面图（1积分）' : 'Redraw AI Back (1 credit)'}
                              </button>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.fontSize} (%)</label>
                                  <input
                                    type="number"
                                    min="1" max="10" step="0.5"
                                    value={result.draftBackStyle.fontSize}
                                    onChange={(e) => updateDraftStyle('back', 'fontSize', parseFloat(e.target.value))}
                                    className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-stone-700 mb-1.5">{t.color}</label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="color"
                                      value={result.draftBackStyle.color}
                                      onChange={(e) => updateDraftStyle('back', 'color', e.target.value)}
                                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                      type="text"
                                      value={result.draftBackStyle.color}
                                      onChange={(e) => updateDraftStyle('back', 'color', e.target.value)}
                                      className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 mt-6 px-4 sm:px-0 pt-4 sm:pt-6 pb-[max(4px,env(safe-area-inset-bottom))] border-t border-stone-100 bg-white/95 backdrop-blur flex flex-wrap justify-end gap-2 sm:gap-3">
                          <button
                            onClick={() => handleUpdatePreview()}
                            className="px-3 sm:px-5 py-2.5 rounded-lg sm:rounded-xl font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors sm:mr-auto flex items-center gap-2 text-sm"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Update Preview
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 sm:px-5 py-2.5 rounded-lg sm:rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors text-sm"
                          >
                            {t.cancel}
                          </button>
                          <button
                            onClick={() => handleRegenerate(result.id, true)}
                            disabled={!hasChanges}
                            className={cn(
                              "px-3 sm:px-6 py-2.5 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm",
                              hasChanges 
                                ? "bg-stone-100 text-stone-900 hover:bg-stone-200" 
                                : "bg-stone-50 text-stone-400 cursor-not-allowed"
                            )}
                          >
                            {t.saveAsNew}
                          </button>
                          <button
                            onClick={() => handleRegenerate(result.id, false)}
                            disabled={!hasChanges}
                            className={cn(
                              "px-3 sm:px-6 py-2.5 rounded-lg sm:rounded-xl font-medium transition-colors flex items-center gap-2 text-sm",
                              hasChanges 
                                ? "bg-stone-900 text-white hover:bg-stone-800" 
                                : "bg-stone-100 text-stone-400 cursor-not-allowed"
                            )}
                          >
                            <RefreshCw className={cn("w-4 h-4", hasChanges ? "" : "opacity-50")} />
                            {t.saveOverwrite}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
