/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { Photo, ConfigGroup, SettingsType, ProcessedPostcard, User, defaultSettings } from '../App';
import { ArrowLeft, Download, Loader2, CheckCircle2, RefreshCw, Check, Edit3, Clock, ShieldCheck, Wand2, X, HelpCircle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import OpenAI from 'openai';
import JSZip from 'jszip';
import exifr from 'exifr';
import { cn } from '../lib/utils';
import { loadImage } from '../lib/imageUtils';
import { brandConfig } from '../config/brand';
import { applyFilterById } from '../lib/filter-engine';
import { syncCreditsToSupabase, recordPostcardConsumption } from '../lib/profileSync';
import { isSupabaseConnected } from '../lib/supabaseClient';
import { logEvent } from '../lib/events';

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
  language,
  onFeedback
}: Props) {
  const t = translations[language] || translations.en;
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [vipLevel, setVipLevel] = useState('free');
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<ProcessedPostcard | null>(null);
  const [editTab, setEditTab] = useState<'content' | 'style'>('content');
  const [currentBatchIds, setCurrentBatchIds] = useState<string[]>([]);
  const [livePreview, setLivePreview] = useState<{ front: string, back: string } | null>(null);
  const [rewritingState, setRewritingState] = useState<{ id: string, field: string } | null>(null);

  useEffect(() => {
    if (editId) {
      setEditingResultId(editId);
    }
  }, [editId]);

  useEffect(() => {
    let isMounted = true;
    
    const processPhotos = async () => {
      const processStart = Date.now();
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

      const creditsPerCard = (() => {
        const v = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_credits_per_postcard') : null;
        const n = v != null ? parseInt(v, 10) : NaN;
        return Number.isFinite(n) && n >= 0 ? n : 1;
      })();
      const aiPhotosCount = configuredPhotos.reduce((count, photo) => {
        const group = configGroups.find(g => g.id === photo.groupId);
        const settings = { ...defaultSettings, ...(group?.settings || {}) };
        const usesAi = settings.aiTitle !== false || settings.aiBackTemplate !== false;
        return count + (usesAi ? 1 : 0);
      }, 0);
      const totalNeed = creditsPerCard * aiPhotosCount;
      if (user.credits < totalNeed) {
        setError(t.creditsError.replace('{need}', totalNeed.toString()).replace('{have}', user.credits.toString()));
        setIsProcessing(false);
        setShowPricing(true);
        return;
      }

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
              
              // 2. EXIF Data
              let exifData: any = null;
              let gpsData: { latitude: number, longitude: number } | null = null;
              
              if (photo.exif?.location) {
                gpsData = { latitude: photo.exif.location.lat, longitude: photo.exif.location.lng };
              }

              if (photo.file) {
                try {
                  exifData = await exifr.parse(photo.file);
                  if (!gpsData) {
                    gpsData = await exifr.gps(photo.file);
                  }
                } catch (e) {
                  console.warn("EXIF parsing failed", e);
                }
              }

              // 3. AI Analysis
              let title = "";
              let location = "";
              let message = "";
              let theme = "elegant";
              let postmark = "";
              let artisticIcons: string[] = [];
              let generatedBackImageBase64: string | null = null;
              let textPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-left';
              
              // AI 开关：任一项启用则运行 AI；纯滤镜模式（都关闭）不调用 AI。
              const runAi = settings.aiTitle !== false || settings.aiBackTemplate !== false;
              if (runAi) {
                const base64Data = getCompressedBase64(img);
                
                try {
                  const envKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
                  const adminKey = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_openai_key') : null;
                  // 优先使用 Vercel/Supabase 构建时注入的环境变量，其次才是 Admin 面板里填的本地 key
                  const openAiKey = (typeof envKey === 'string' && envKey.trim())
                    ? envKey.trim()
                    : (adminKey && adminKey.trim()) || null;
                  const baseUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_openai_base_url') : null;
                  if (typeof window !== 'undefined') {
                    console.log('[SeaOtter][AI] envKey:', !!envKey, 'adminKey:', !!adminKey);
                  }
                  if (!openAiKey) {
                    throw new Error(language === 'zh' 
                      ? "OpenAI API Key 未配置。请在 Admin 后台填写，或设置 VITE_OPENAI_API_KEY 环境变量。" 
                      : "OpenAI API Key is missing. Please set it in Admin panel or VITE_OPENAI_API_KEY env.");
                  }
                  const openai = new OpenAI({
                    apiKey: openAiKey,
                    baseURL: (typeof baseUrl === 'string' && baseUrl.trim()) ? baseUrl.trim() : undefined,
                    dangerouslyAllowBrowser: true
                  });

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
4. Back Image Prompt: Write a prompt for a complementary pencil sketch.

MANDATORY STYLE: ${currentStyle}`;

                  if (gpsData) {
                    analysisPrompt += `\nGPS Coordinates: Latitude ${gpsData.latitude}, Longitude ${gpsData.longitude}. Use these to identify the real location.`;
                  }

                  analysisPrompt += `
IMPORTANT: All generated text MUST be strictly in ${settings.aiLanguage} language. 
If the target language is Chinese:
- Do NOT include any English characters.
- The 'title' (front) MUST be a short phrase (max 12 chars) in ${settings.copywritingStyle} style.
- The 'message' (back) MUST be a natural observation (max 25 words) in ${settings.copywritingStyle} style, tightly connected to the title.
- AVOID clichés like "愿你...", "在这个喧嚣的世界里". 
- ONLY describe what is ACTUALLY visible in the photo.
- For 'location_name': Use real-world location if possible, otherwise a poetic generic one (e.g., "街角", "海边").
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
  "theme": "One of: 'classic', 'modern', 'vintage', 'handwritten'",
  "postmark": "Short postmark text",
  "artistic_icons": ["icon1", "icon2"],
  "text_position": "One of: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'",
  "back_image_prompt": "Prompt for pencil sketch"
}`;

                  const analysisResponse = await withTimeout(
                    openai.chat.completions.create({
                      model: "gpt-4o",
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

                  const analysisData = JSON.parse(analysisResponse.choices[0]?.message?.content || "{}");

                  // 3. 根据开关和 EXIF 更新文字与位置
                  if (settings.aiTitle !== false && analysisData.title) {
                    title = analysisData.title;
                  }

                  let analysisLocation = "";
                  if (analysisData.location_name) {
                    analysisLocation = analysisData.location_name;
                  }

                  // 尝试从 EXIF 提取地点信息，优先使用真实位置而不是模型臆测
                  let exifLocationName = "";
                  if (exifData) {
                    const city = (exifData.city || exifData.City || exifData.SubLocation) as string | undefined;
                    const region = (exifData.state || exifData.State || exifData.Province || exifData.Region) as string | undefined;
                    const country = (exifData.country || exifData.Country || exifData.CountryCode) as string | undefined;
                    const parts = [city, region, country].filter(Boolean) as string[];
                    if (parts.length > 0) {
                      exifLocationName = parts.join(', ');
                    }
                  }
                  if (settings.aiTitle !== false) {
                    if (exifLocationName) {
                      location = exifLocationName;
                    } else if (analysisLocation) {
                      location = analysisLocation;
                    }
                  } else if (exifLocationName) {
                    // 即使没开 AI 标题，如果有真实 EXIF 地点也可以用
                    location = exifLocationName;
                  }

                  // 背面文案与背面图：仅在开启 AI 背面模板时生成，避免浪费 token
                  if (settings.aiBackTemplate !== false) {
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

                    // 2. Generate Back Image（仅在启用 AI 背面时调用 DALL·E）
                    let backImagePrompt = analysisData.back_image_prompt || "";
                    
                    if (!backImagePrompt) {
                      const subject = analysisData.subject;
                      const context = analysisData.context;
                      const general = analysisData.general_elements;

                      const styleDesc =
                        "finely detailed pencil sketch with soft pastel colors, delicate lines, white background, high quality, artistic, elegant, subtle shading, watermark style";
                      
                      if (subject && context) {
                        backImagePrompt = `A ${styleDesc} of ${subject} in ${context}.`;
                      } else if (subject) {
                        backImagePrompt = `A ${styleDesc} of ${subject}.`;
                      } else if (context) {
                        backImagePrompt = `A ${styleDesc} of ${context}.`;
                      } else {
                        backImagePrompt = `A ${styleDesc} of ${general || "scenery"}.`;
                      }
                    }

                    try {
                      const response = await openai.images.generate({
                        model: "dall-e-3",
                        prompt: backImagePrompt,
                        n: 1,
                        size: "1024x1024",
                        response_format: "b64_json",
                        style: "natural"
                      });

                      if (response.data && response.data[0] && response.data[0].b64_json) {
                        generatedBackImageBase64 = `data:image/png;base64,${response.data[0].b64_json}`;
                      }
                    } catch (openAiErr) {
                      console.warn("OpenAI image generation failed, trying fallback prompt", openAiErr);
                      try {
                        const fallbackResponse = await openai.images.generate({
                          model: "dall-e-3",
                          prompt:
                            "A finely detailed pencil sketch of a beautiful landscape, soft pastel colors, delicate lines, pure white background, elegant, watermark style.",
                          n: 1,
                          size: "1024x1024",
                          response_format: "b64_json",
                          style: "natural"
                        });
                        if (fallbackResponse.data && fallbackResponse.data[0] && fallbackResponse.data[0].b64_json) {
                          generatedBackImageBase64 = `data:image/png;base64,${fallbackResponse.data[0].b64_json}`;
                        }
                      } catch (fallbackErr) {
                        console.warn("Fallback image generation also failed", fallbackErr);
                      }
                    }
                  }
                } catch (aiErr) {
                  console.warn("AI Analysis failed, using default empty values", aiErr);
                }
              }

              const defaultFrontStyle: ProcessedPostcard['frontStyle'] = { fontSize: 5, color: '#ffffff', position: textPosition };
              const defaultBackStyle: ProcessedPostcard['backStyle'] = { fontSize: 3.2, color: '#44403c' };
              
              let dateStr = "";
              let captureDate: Date | null = null;

              if (photo.exif?.date) {
                dateStr = photo.exif.date.replace(/-/g, '.');
              } else {
                if (exifData?.DateTimeOriginal) {
                  captureDate = new Date(exifData.DateTimeOriginal);
                } else if (exifData?.CreateDate) {
                  captureDate = new Date(exifData.CreateDate);
                } else if (photo.file?.lastModified) {
                   captureDate = new Date(photo.file.lastModified);
                }

                if (captureDate && !isNaN(captureDate.getTime())) {
                   const y = captureDate.getFullYear();
                   const m = String(captureDate.getMonth() + 1).padStart(2, '0');
                   const d = String(captureDate.getDate()).padStart(2, '0');
                   dateStr = `${y}.${m}.${d}`;
                } else {
                   const now = new Date();
                   const y = now.getFullYear();
                   const m = String(now.getMonth() + 1).padStart(2, '0');
                   const d = String(now.getDate()).padStart(2, '0');
                   dateStr = `${y}.${m}.${d}`;
                }
              }
              const authorStr = settings.authorName || '';
              
              const useWatermark = (user.promo_credits ?? 0) > 0;
              const frontDataUrl = generateFront(img, title, location, theme, settings, defaultFrontStyle, authorStr, dateStr);
              const backDataUrl = await generateBack(img, message, location, postmark, theme, settings, defaultBackStyle, authorStr, dateStr, artisticIcons, generatedBackImageBase64 || undefined, useWatermark);

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
                date: dateStr,
                draftTitle: title,
                draftLocation: location,
                draftMessage: message,
                draftAuthor: authorStr,
                draftDate: dateStr,
                selected: true,
                imgUrl: imgBase64,
                settings: settings,
                createdAt: Date.now(),
                frontStyle: defaultFrontStyle,
                backStyle: defaultBackStyle,
                draftFrontStyle: defaultFrontStyle,
                draftBackStyle: defaultBackStyle,
                generatedBackImage: generatedBackImageBase64 || undefined
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

          setUser(prev => {
            // 优先消耗赠送积分，再消耗付费积分
            const currentPromo = prev.promo_credits ?? 0;
            const currentPaid = prev.paid_credits ?? 0;
            const promoUsed = Math.min(currentPromo, totalUse);
            const paidUsed = Math.max(0, totalUse - promoUsed);
            const newPromo = currentPromo - promoUsed;
            const newPaid = currentPaid - paidUsed;
            const newGenerated = (prev.generatedCount || 0) + configuredPhotos.length;
            const newCredits = Math.max(0, newPromo + newPaid);

            if (prev.id && isSupabaseConnected) {
              // 同步最新积分到 Supabase，并记录本次消耗
              syncCreditsToSupabase(prev.id, newPromo, newPaid, newGenerated).catch(console.error);
              recordPostcardConsumption(prev.id, promoUsed, paidUsed).catch(console.error);
            }

            return {
              ...prev,
              credits: newCredits,
              promo_credits: newPromo,
              paid_credits: newPaid,
              generatedCount: newGenerated,
            };
          });
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
  }, [photos, configGroups]);

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
      polaroid: { w: 1500, h: 1500 },
    };
    return sizeMap[settings.size] ?? { w: 1800, h: 1200 };
  };

  const generateFront = (img: HTMLImageElement, title: string, location: string, theme: string, settings: SettingsType, frontStyle?: ProcessedPostcard['frontStyle'], author?: string, date?: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const safeSettings = settings || { size: '4x6', fill: 'fill', aiTitle: true, aiLanguage: 'English' };
    const { w, h } = getDimensions(safeSettings);
    
    const isPortrait = img.height > img.width && safeSettings.size !== 'square';
    canvas.width = isPortrait ? h : w;
    canvas.height = isPortrait ? w : h;
    
    const cw = canvas.width;
    const ch = canvas.height;
    const isSquare = cw === ch; // 拍立得/方形

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    const fillMode = safeSettings.fill || 'fill';
    const filterId = safeSettings.filter || 'original';
    const filterIntensity = safeSettings.filterIntensity ?? 0.8;

    let imgX = 0, imgY = 0, imgW = cw, imgH = ch;

    if (fillMode === 'fill') {
      // 拉伸/压缩至填满画布，图片完整不裁剪
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, cw, ch);
      imgX = 0; imgY = 0; imgW = cw; imgH = ch;
    } else if (fillMode === 'border') {
      const paddingX = cw * 0.05;
      const paddingTop = cw * 0.05;
      const paddingBottom = ch * 0.15;
      const availW = cw - paddingX * 2;
      const availH = ch - paddingTop - paddingBottom;
      const dx = paddingX;
      const dy = paddingTop;
      imgX = dx; imgY = dy; imgW = availW; imgH = availH;

      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, availW, availH);
      ctx.shadowColor = 'transparent';
    } else if (fillMode === 'bottom-border') {
      const paddingBottom = isSquare ? ch * 0.18 : ch * 0.15; // 拍立得底部留白稍大
      const availW = cw;
      const availH = ch - paddingBottom;
      imgX = 0; imgY = 0; imgW = availW; imgH = availH;
      // 拉伸/压缩至填满可用区域，确保图片完整显示不裁剪（仅缩放变换）
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, availW, availH);

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
      const hasTextInBorder = hasTextInBorderArea;
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

      const metaSize = titleSize * 0.6; // Increased from 0.4
      const spacing1 = locationSize * 0.5; // Increased space between title and location
      const spacing2 = locationSize * 0.5; // Increased space between location and meta

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
      const actualTitleHeight = titleCase ? titleSize : 0;
      const actualLocHeight = location ? locationSize : 0;
      const actualMetaHeight = metaText ? metaSize : 0;
      
      const actualSpacing1 = (titleCase && location) ? spacing1 : 0;
      const actualSpacing2 = (location && metaText) ? spacing2 : ((titleCase && metaText && !location) ? spacing1 : 0);

      const totalHeight = actualTitleHeight + actualSpacing1 + actualLocHeight + actualSpacing2 + actualMetaHeight;

      if (hasTextInBorder) {
        // 拍立得/方形：底部留白稍大(18%)以容纳标题；其他规格 15%
        const bottomBorderHeight = isSquare ? ch * 0.18 : ch * 0.15;
        // 在留白区内再预留上下安全距离，避免贴边
        const innerPaddingY = bottomBorderHeight * 0.15;
        
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
      ctx.letterSpacing = "4px";
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

    if (user.level !== 'vip') {
      // Watermark removed from front as requested
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
    const ctx = canvas.getContext('2d')!;
    const safeSettings = settings || { size: '4x6', fill: 'fill', aiTitle: true, aiLanguage: 'English' };
    const { w, h } = getDimensions(safeSettings);
    const isChinese = (safeSettings.aiLanguage || 'English').includes('Chinese');
    
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

    // 1. AI Illustration (Full Background) - "拉伸顶格"
    // This is the artistically constructed image based on the front content, now as a full background
    if (generatedBackImage) {
      try {
        const backImg = await loadImage(generatedBackImage);
        ctx.save();
        // Use a balanced alpha so it's visible but doesn't drown out the handwriting/text
        ctx.globalAlpha = 0.45; 
        ctx.drawImage(backImg, 0, 0, cw, ch);
        ctx.restore();
      } catch (e) {
        console.warn("Failed to load generated back image for full background", e);
      }
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
    if (theme === 'modern') {
      // Modern layout: No center divider, instead a subtle left border for address
      ctx.beginPath();
      ctx.moveTo(cw * 0.55, padding * 1.5);
      ctx.lineTo(cw * 0.55, ch - padding * 1.5);
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cw / 2, padding * 1.2);
      ctx.lineTo(cw / 2, ch - padding * 1.2);
      ctx.strokeStyle = theme === 'vintage' ? '#d2b48c' : '#e7e5e4';
      ctx.lineWidth = 1;
      
      if (theme === 'handwritten') {
        ctx.beginPath();
        for (let y = padding * 1.2; y < ch - padding * 1.2; y += 10) {
          ctx.lineTo(cw / 2 + Math.sin(y * 0.05) * 3, y);
        }
      } else if (theme === 'vintage') {
        ctx.setLineDash([5, 5]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      
      if (theme === 'classic' || theme === 'vintage') {
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
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
      const lineXStart = theme === 'modern' ? cw * 0.6 : cw * 0.55;
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
      
      let y = ch * 0.22; // Reset to default Y as illustration is now background
      const maxWidth = theme === 'modern' ? (cw * 0.55 - padding * 2) : (cw / 2 - padding * 2);
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

    // 9. Watermark (Logo + 服务名 + 网址) - 使用 promo 积分时显示，布局：第一行 Logo 服务名，第二行 网址
    const watermark = useWatermark && (brandConfig.logoUrl() || brandConfig.brandName('zh'));
    if (watermark) {
      const locale = isChinese ? 'zh' : 'en';
      const brandName = brandConfig.brandName(locale);
      const domain = brandConfig.domain();
      const logoUrl = brandConfig.logoUrl();
      const pos = brandConfig.watermarkPosition() || 'bottom-center';
      const opacity = brandConfig.watermarkOpacity();
      const relSize = brandConfig.watermarkSize();
      const shortSide = Math.min(cw, ch);
      const wmPadding = padding * 2;
      // Logo 随画布尺寸缩放，适中大小：短边的 5%~10%， clamp 32~80
      const logoSize = Math.max(32, Math.min(80, shortSide * 0.06 * relSize));
      const gap = Math.max(logoSize * 0.8, 16); // 足够间距避免重叠
      const lineHeight = shortSide * 0.04;
      const fontSize1 = Math.max(12, shortSide * 0.022);
      const fontSize2 = Math.max(10, shortSide * 0.018);
      ctx.save();
      ctx.font = `${fontSize1}px "Inter", sans-serif`;
      const brandWidth = ctx.measureText(brandName).width;
      const totalLine1W = logoUrl ? logoSize + gap + brandWidth : brandWidth;
      ctx.globalAlpha = opacity;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      let line1StartX = wmPadding;
      if (pos.includes('center')) {
        line1StartX = Math.max(wmPadding, (cw - totalLine1W) / 2);
      } else if (pos.includes('right')) {
        line1StartX = Math.max(wmPadding, cw - wmPadding - totalLine1W);
      }
      const line1Y = ch - wmPadding - lineHeight - fontSize2 - lineHeight * 0.5 - fontSize1 / 2;
      const line2Y = ch - wmPadding - fontSize2 / 2 - lineHeight * 0.5;
      const baseStartX = line1StartX;
      let textX = line1StartX;
      if (logoUrl) {
        try {
          const logoImg = await loadImage(logoUrl);
          ctx.drawImage(logoImg, line1StartX, line1Y - logoSize / 2, logoSize, logoSize);
          textX = line1StartX + logoSize + gap;
        } catch (_) {}
      }
      ctx.font = `${fontSize1}px "Inter", sans-serif`;
      ctx.fillStyle = '#44403c';
      ctx.fillText(brandName, textX, line1Y);
      ctx.font = `${fontSize2}px "Inter", sans-serif`;
      ctx.fillStyle = '#78716c';
      const urlText = domain.startsWith('http') ? domain : `https://${domain}/`;
      const urlWidth = ctx.measureText(urlText).width;
      let urlX = baseStartX;
      if (pos.includes('center')) urlX = (cw - urlWidth) / 2;
      else if (pos.includes('right')) urlX = cw - wmPadding - urlWidth;
      ctx.fillText(urlText, urlX, line2Y);
      ctx.restore();
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
        const backBase64 = (result.backDataUrl || result.backUrl).split(',')[1];
        
        zip.file(`${fileNameBase}_front.jpg`, frontBase64, { base64: true });
        zip.file(`${fileNameBase}_back.jpg`, backBase64, { base64: true });
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

      setTimeout(() => {
        const a2 = document.createElement('a');
        a2.href = result.backDataUrl || result.backUrl;
        a2.download = `${safeTitle}_back.jpg`;
        a2.click();
      }, 300);
    } catch (e) {
      console.error("Failed to download postcard", e);
      alert("Failed to download. Please try again.");
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

  const handleRegenerate = async (id: string, saveAsNew: boolean = false) => {
    const result = editingDraft;
    if (!result || result.id !== id) return;

    try {
      const img = await loadImage(result.imgUrl || '');
      const useWatermark = (user.promo_credits ?? 0) > 0;
      const newFront = generateFront(img, result.draftTitle || '', result.draftLocation || '', result.theme || 'standard', result.settings, result.draftFrontStyle, result.draftAuthor, result.draftDate);
      const newBack = await generateBack(img, result.draftMessage || '', result.draftLocation || '', result.postmark || '', result.theme || 'standard', result.settings, result.draftBackStyle, result.draftAuthor, result.draftDate, result.decorativeIcons, result.generatedBackImage, useWatermark);

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
    switch(vipLevel) {
      case 'free': return '1 Day';
      case 'pro': return '3 Months';
      case 'supreme': return 'Permanent';
      default: return '1 Day';
    }
  };

  const handleUpdatePreview = async (draftToUse?: ProcessedPostcard) => {
    if (!editingResultId) return;
    const result = draftToUse || editingDraft;
    if (!result || !result.imgUrl) return;

    try {
      const img = await loadImage(result.imgUrl);
      const useWatermark = (user.promo_credits ?? 0) > 0;
      const newFront = generateFront(img, result.draftTitle || '', result.draftLocation || '', result.theme || 'standard', result.settings, result.draftFrontStyle, result.draftAuthor, result.draftDate);
      const newBack = await generateBack(img, result.draftMessage || '', result.draftLocation || '', result.postmark || '', result.theme || 'standard', result.settings, result.draftBackStyle, result.draftAuthor, result.draftDate, result.decorativeIcons, result.generatedBackImage, useWatermark);
      setLivePreview({ front: newFront, back: newBack });
    } catch (e) {
      console.error("Failed to generate live preview", e);
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
    handleUpdatePreview({ ...result });
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
        prompt += `\nKeep it to just the location name (e.g., city, country, or landmark).`;
      }

      let newText = '';
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Data.split(',')[1] } },
              { text: prompt }
            ]
          }
        }),
        60000,
        "AI Rewrite timed out."
      );
      newText = response.text || '';
      
      newText = newText.trim().replace(/^["']|["']$/g, '');
      
      if (field === 'message') {
        newText = newText.trim();
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
            <select 
              value={vipLevel} 
              onChange={(e) => setVipLevel(e.target.value)}
              className="bg-transparent text-sm font-medium text-stone-700 focus:outline-none cursor-pointer"
            >
              <option value="free">{t.free}</option>
              <option value="pro">{t.pro}</option>
              <option value="supreme">{t.supreme}</option>
            </select>
          </div>
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
                <div className="relative aspect-[3/2] w-full bg-stone-100 overflow-hidden cursor-pointer" onClick={() => setEditingResultId(result.id)}>
                  <img src={result.frontDataUrl} alt="Front" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-sm text-stone-900 px-3 py-1.5 rounded-lg font-medium text-sm flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-sm">
                      <Edit3 className="w-4 h-4" /> {t.edit}
                    </div>
                  </div>
                </div>
                
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingle(result);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors ml-2"
                      title={t.download}
                    >
                      <Download className="w-4 h-4" />
                    </button>
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
            if (onClearEdit) {
              onClearEdit(); // This will trigger setShowHistory(true) in App.tsx
            }
          }}
          className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Clock className="w-4 h-4" />
          {t.viewHistory || 'View History'}
        </button>
      </div>

      {/* Edit Modal */}
      {editingResultId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-6">
                      <h3 className="font-semibold text-lg text-stone-900 flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-stone-500" />
                        {t.edit}
                      </h3>
                      <div className="flex bg-stone-200/50 p-1 rounded-lg">
                        <button
                          onClick={() => setEditTab('content')}
                          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", editTab === 'content' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700")}
                        >
                          {t.content}
                        </button>
                        <button
                          onClick={() => setEditTab('style')}
                          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", editTab === 'style' ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700")}
                        >
                          {t.style}
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={handleCancelEdit}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Previews */}
                      <div className="space-y-6">
                          <div className="relative rounded-xl overflow-hidden shadow-sm border border-stone-200 bg-stone-100">
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md z-10">
                              {t.front}
                            </div>
                            <img src={livePreview?.front || result.frontDataUrl} alt="Front" className="w-full h-auto" />
                          </div>
                          <div className="relative rounded-xl overflow-hidden shadow-sm border border-stone-200 bg-stone-100">
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-md z-10">
                              {t.backSide}
                            </div>
                            <img src={livePreview?.back || result.backDataUrl} alt="Back" className="w-full h-auto" />
                          </div>
                      </div>

                      {/* Edit Form */}
                      <div className="bg-white flex flex-col h-full">
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
                                  onChange={(e) => updateDraftStyle('front', 'position', e.target.value)}
                                  className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
                                >
                                  <option value="bottom-left">Bottom Left</option>
                                  <option value="bottom-right">Bottom Right</option>
                                  <option value="top-left">Top Left</option>
                                  <option value="top-right">Top Right</option>
                                  <option value="center">Center</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="font-medium text-stone-900 pb-2 border-b border-stone-100">{t.backSide} {t.style}</h4>
                              
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

                        <div className="mt-6 pt-6 border-t border-stone-100 flex justify-end gap-3">
                          <button
                            onClick={() => handleUpdatePreview()}
                            className="px-5 py-2.5 rounded-xl font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors mr-auto flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Update Preview
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                          >
                            {t.cancel}
                          </button>
                          <button
                            onClick={() => handleRegenerate(result.id, true)}
                            disabled={!hasChanges}
                            className={cn(
                              "px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2",
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
                              "px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2",
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
