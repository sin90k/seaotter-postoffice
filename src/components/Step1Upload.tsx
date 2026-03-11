import { useState, Dispatch, SetStateAction } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ImagePlus, X, Loader2, HelpCircle, FolderUp } from 'lucide-react';
import JSZip from 'jszip';
import exifr from 'exifr';
import heic2any from 'heic2any';
import { Photo } from '../App';
import { cn } from '../lib/utils';

interface Props {
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
  onNext: () => void;
  language: string;
  onFeedback: () => void;
}

const translations: Record<string, any> = {
  en: {
    title: 'Upload Photos',
    desc: 'Upload photos from your device.',
    dropzone: 'Click or drag photos here',
    processing: 'Processing...',
    supports: 'Supports JPG, PNG, LIVP, ZIP, Folders',
    added: 'Added Photos',
    clearAll: 'Clear All',
    continue: 'Continue',
    uploadFolder: 'Upload Folder',
    parseError: 'Could not read the selected files. Please check format and try again.',
    feedbackHint: 'Feedback & help',
  },
  zh: {
    title: '上传照片',
    desc: '从您的设备上传照片。',
    dropzone: '点击或拖拽照片到这里',
    processing: '处理中...',
    supports: '支持 JPG, PNG, LIVP, ZIP, 文件夹',
    added: '已添加照片',
    clearAll: '一键清除',
    continue: '继续',
    uploadFolder: '上传文件夹',
    parseError: '无法解析所选文件，请确认格式后重试。',
    feedbackHint: '意见与帮助',
  },
  ja: {
    title: '写真をアップロード',
    desc: 'デバイスから写真をアップロードします。',
    dropzone: 'クリックまたはドラッグしてアップロード',
    processing: '処理中...',
    supports: 'JPG, PNG, LIVP, ZIP, フォルダ対応',
    added: '追加された写真',
    clearAll: 'すべて削除',
    continue: '次へ',
    parseError: '選択したファイルを読み込めませんでした。形式を確認して再試行してください。',
  },
  ko: {
    title: '사진 업로드',
    desc: '기기에서 사진을 업로드하세요.',
    dropzone: '여기를 클릭하거나 사진을 드래그하세요',
    processing: '처리 중...',
    supports: 'JPG, PNG, LIVP, ZIP, 폴더 지원',
    added: '추가된 사진',
    clearAll: '모두 지우기',
    continue: '계속하기',
    parseError: '선택한 파일을 읽을 수 없습니다. 형식을 확인한 후 다시 시도해 주세요.',
    feedbackHint: '피드백 및 도움말',
  },
  fr: { title: 'Télécharger des photos', desc: 'Téléchargez des photos depuis votre appareil.', dropzone: 'Cliquez ou glissez des photos ici', processing: 'Traitement...', supports: 'JPG, PNG, LIVP, ZIP, dossiers', added: 'Photos ajoutées', clearAll: 'Tout effacer', continue: 'Continuer', uploadFolder: 'Dossier', parseError: 'Impossible de lire les fichiers. Vérifiez le format.', feedbackHint: 'Aide' },
  de: { title: 'Fotos hochladen', desc: 'Fotos von Ihrem Gerät hochladen.', dropzone: 'Klicken oder Fotos hierher ziehen', processing: 'Wird verarbeitet...', supports: 'JPG, PNG, LIVP, ZIP, Ordner', added: 'Fotos hinzugefügt', clearAll: 'Alle löschen', continue: 'Weiter', uploadFolder: 'Ordner', parseError: 'Dateien konnten nicht gelesen werden.', feedbackHint: 'Hilfe' },
  es: { title: 'Subir fotos', desc: 'Sube fotos desde tu dispositivo.', dropzone: 'Haz clic o arrastra fotos aquí', processing: 'Procesando...', supports: 'JPG, PNG, LIVP, ZIP, carpetas', added: 'Fotos añadidas', clearAll: 'Borrar todo', continue: 'Continuar', uploadFolder: 'Carpeta', parseError: 'No se pudieron leer los archivos.', feedbackHint: 'Ayuda' },
  it: { title: 'Carica foto', desc: 'Carica foto dal tuo dispositivo.', dropzone: 'Clicca o trascina le foto qui', processing: 'Elaborazione...', supports: 'JPG, PNG, LIVP, ZIP, cartelle', added: 'Foto aggiunte', clearAll: 'Cancella tutto', continue: 'Continua', uploadFolder: 'Cartella', parseError: 'Impossibile leggere i file.', feedbackHint: 'Aiuto' },
  th: { title: 'อัปโหลดรูปภาพ', desc: 'อัปโหลดรูปจากอุปกรณ์ของคุณ', dropzone: 'คลิกหรือลากรูปมาที่นี่', processing: 'กำลังประมวลผล...', supports: 'รองรับ JPG, PNG, LIVP, ZIP', added: 'รูปที่เพิ่ม', clearAll: 'ล้างทั้งหมด', continue: 'ดำเนินการต่อ', uploadFolder: 'โฟลเดอร์', parseError: 'อ่านไฟล์ไม่ได้', feedbackHint: 'ความช่วยเหลือ' },
  vi: { title: 'Tải ảnh lên', desc: 'Tải ảnh từ thiết bị của bạn.', dropzone: 'Nhấp hoặc kéo ảnh vào đây', processing: 'Đang xử lý...', supports: 'Hỗ trợ JPG, PNG, LIVP, ZIP', added: 'Ảnh đã thêm', clearAll: 'Xóa tất cả', continue: 'Tiếp tục', uploadFolder: 'Thư mục', parseError: 'Không đọc được tệp.', feedbackHint: 'Trợ giúp' },
  id: { title: 'Unggah foto', desc: 'Unggah foto dari perangkat Anda.', dropzone: 'Klik atau seret foto ke sini', processing: 'Memproses...', supports: 'JPG, PNG, LIVP, ZIP', added: 'Foto ditambahkan', clearAll: 'Hapus semua', continue: 'Lanjutkan', uploadFolder: 'Folder', parseError: 'Tidak dapat membaca file.', feedbackHint: 'Bantuan' },
  ms: { title: 'Muat naik foto', desc: 'Muat naik foto dari peranti anda.', dropzone: 'Klik atau seret foto ke sini', processing: 'Memproses...', supports: 'JPG, PNG, LIVP, ZIP', added: 'Foto ditambah', clearAll: 'Padam semua', continue: 'Teruskan', uploadFolder: 'Folder', parseError: 'Tidak dapat membaca fail.', feedbackHint: 'Bantuan' },
};

export default function Step1Upload({ photos, setPhotos, onNext, language, onFeedback }: Props) {
  const t = { ...translations.en, ...(translations[language] || {}) };
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFile = async (file: File): Promise<Photo[]> => {
    const results: Photo[] = [];
    
    const isImage = (name: string) => {
      const ext = name.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext || '');
    };

    const handleSingleFile = async (f: File | Blob, name: string): Promise<Photo | null> => {
      try {
        let finalBlob: Blob = f;
        let finalName = name;
        const ext = (name.split('.').pop() || '').toLowerCase();
        if (ext === 'heic' || ext === 'heif') {
          try {
            const converted = await heic2any({
              blob: finalBlob as Blob,
              toType: 'image/jpeg',
              quality: 0.9,
            });
            finalBlob = Array.isArray(converted) ? converted[0] : converted;
            finalName = name.replace(/\.(heic|heif)$/i, '.jpg');
          } catch (heicErr) {
            console.warn('HEIC conversion failed, skipping', name, heicErr);
            return null;
          }
        }

        // Create preview URL
        let url = '';
        try {
          // Try createObjectURL first for performance with large images
          url = URL.createObjectURL(finalBlob);
          
          // Also try to read it to ensure it's a valid image blob
          const reader = new FileReader();
          reader.readAsArrayBuffer(finalBlob.slice(0, 100)); 
        } catch (readError) {
          console.error("URL.createObjectURL failed, falling back to FileReader", readError);
          url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(finalBlob);
          });
        }
        
        let exifData: any = {};
        try {
          exifData = await exifr.parse(finalBlob, { tiff: true, exif: true, gps: true });
        } catch (e) {
          console.warn("Failed to parse EXIF", e);
        }

        let dateStr: string | undefined;
        let locationData: { lat: number; lng: number } | undefined;

        if (exifData) {
          if (exifData.DateTimeOriginal || exifData.CreateDate) {
            const dateObj = new Date(exifData.DateTimeOriginal || exifData.CreateDate);
            try {
              if (!isNaN(dateObj.getTime())) {
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getDate()).padStart(2, '0');
                dateStr = `${y}.${m}.${d}`;
              }
            } catch (e) {
              console.warn("Invalid EXIF date", dateObj);
            }
          }
          if (exifData.latitude && exifData.longitude) {
            locationData = { lat: exifData.latitude, lng: exifData.longitude };
          }
        }

        let finalFile: File;
        if (f instanceof File) {
          finalFile = new File([finalBlob], finalName, { 
            type: finalBlob.type || 'image/jpeg',
            lastModified: f.lastModified 
          });
        } else {
          finalFile = new File([finalBlob], finalName, { 
            type: finalBlob.type || 'image/jpeg' 
          });
        }

        return {
          id: Math.random().toString(36).substring(7),
          url,
          file: finalFile,
          groupId: 'default',
          exif: {
            date: dateStr,
            location: locationData
          }
        };
      } catch (e) {
        console.error("Failed to process image", name, e);
        return null;
      }
    };

    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.livp') || lower.endsWith('.zip')) {
        let extracted = false;
        try {
          const zip = await JSZip.loadAsync(file);
          const files = Object.values(zip.files).filter(f => !f.dir && isImage(f.name));
          for (const zipFile of files) {
            const blob = await zipFile.async('blob');
            const photo = await handleSingleFile(blob, zipFile.name);
            if (photo) {
              results.push(photo);
              extracted = true;
            }
          }
        } catch (zipErr) {
          console.warn('LIVP/ZIP not a standard zip archive, fallback to single-file handling', zipErr);
        }
        // 如果 zip 解析失败或没有提取到任何图片，尝试直接按单张图片处理（部分环境可能直接支持 livp/heic）
        if (!extracted && isImage(file.name)) {
          const fallbackPhoto = await handleSingleFile(file, file.name);
          if (fallbackPhoto) results.push(fallbackPhoto);
        }
      } else if (isImage(file.name)) {
        const photo = await handleSingleFile(file, file.name);
        if (photo) results.push(photo);
      }
    } catch (e) {
      console.error("Failed to process file", file.name, e);
    }
    return results;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      setUploadError(null);
      setIsProcessingFiles(true);
      const allProcessed = await Promise.all(acceptedFiles.map(processFile));
      const validPhotos = allProcessed.flat();
      setPhotos((prev) => [...prev, ...validPhotos]);
      setIsProcessingFiles(false);
      if (acceptedFiles.length > 0 && validPhotos.length === 0) {
        setUploadError(t.parseError || 'Could not read the selected files. Please try again.');
      }
    },
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/heic': ['.heic', '.heif'],
      'application/zip': ['.zip', '.livp'],
      'application/x-zip-compressed': ['.zip', '.livp'],
      'application/octet-stream': ['.livp']
    },
    maxFiles: 100
  } as any);

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[clamp(1.25rem,4vw,1.5rem)] font-semibold tracking-tight mb-2">{t.title}</h2>
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

      <div className="flex-1">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl px-6 py-8 sm:px-10 sm:py-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[190px] sm:min-h-[220px]",
            isDragActive ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
            {isProcessingFiles ? (
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-stone-600 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-stone-600" />
            )}
          </div>
          <p className="font-medium text-base sm:text-lg text-stone-900 mb-1.5">
            {isProcessingFiles ? t.processing : t.dropzone}
          </p>
          <p className="text-sm text-stone-500">{t.supports}</p>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="h-px flex-1 max-w-16 bg-stone-200"></div>
            <span className="text-xs text-stone-400 uppercase tracking-widest font-medium">or</span>
            <div className="h-px flex-1 max-w-16 bg-stone-200"></div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setUploadError(null);
              const input = document.createElement('input');
              input.type = 'file';
              input.webkitdirectory = true;
              input.multiple = true;
              input.onchange = async (ev: Event) => {
                const target = ev.target as HTMLInputElement;
                const files = Array.from(target.files || []) as File[];
                if (files.length > 0) {
                  setIsProcessingFiles(true);
                  const allProcessed = await Promise.all(files.map(processFile));
                  const validPhotos = allProcessed.flat();
                  setPhotos((prev) => [...prev, ...validPhotos]);
                  setIsProcessingFiles(false);
                  if (validPhotos.length === 0) setUploadError(t.parseError || 'Could not read the selected files.');
                }
              };
              input.click();
            }}
            className="mt-4 px-5 py-3 rounded-xl border-2 border-dashed border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center gap-2 mx-auto min-h-[44px]"
          >
            <FolderUp className="w-5 h-5" />
            {t.uploadFolder}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError(null)} className="ml-auto p-1 rounded hover:bg-amber-100" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview Strip */}
      {photos.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">{t.added} ({photos.length})</h3>
            <button
              onClick={() => {
                setPhotos([]);
              }}
              className="px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              {t.clearAll}
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {photos.map((photo) => (
              <div key={photo.id} className="relative w-24 h-24 shrink-0 snap-start group">
                <img
                  src={photo.url}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-xl border border-stone-200"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-red-500 hover:border-red-200 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 pb-[max(8px,env(safe-area-inset-bottom))] flex justify-end">
        <button
          onClick={onNext}
          disabled={photos.length === 0}
          className="w-full sm:w-auto bg-stone-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[46px]"
        >
          {t.continue}
          <ImagePlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
