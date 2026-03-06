import { useState, Dispatch, SetStateAction } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, ImagePlus, X, Loader2, HelpCircle } from 'lucide-react';
import JSZip from 'jszip';
import exifr from 'exifr';
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
  },
  ja: {
    title: '写真をアップロード',
    desc: 'デバイスから写真をアップロードします。',
    dropzone: 'クリックまたはドラッグしてアップロード',
    processing: '処理中...',
    supports: 'JPG, PNG, HEIC, LIVP に対応',
    added: '追加された写真',
    clearAll: 'すべて削除',
    continue: '次へ',
  },
  ko: {
    title: '사진 업로드',
    desc: '기기에서 사진을 업로드하세요.',
    dropzone: '여기를 클릭하거나 사진을 드래그하세요',
    processing: '처리 중...',
    supports: 'JPG, PNG, HEIC, LIVP 지원',
    added: '추가된 사진',
    clearAll: '모두 지우기',
    continue: '계속하기',
  }
};

export default function Step1Upload({ photos, setPhotos, onNext, language, onFeedback }: Props) {
  const t = translations[language] || translations.en;
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const processFile = async (file: File): Promise<Photo[]> => {
    const results: Photo[] = [];
    
    const isImage = (name: string) => {
      const ext = name.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
    };

    const handleSingleFile = async (f: File | Blob, name: string): Promise<Photo | null> => {
      try {
        let finalBlob: Blob = f;
        let finalName = name;

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
      if (file.name.toLowerCase().endsWith('.livp') || file.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const files = Object.values(zip.files).filter(f => !f.dir && isImage(f.name));
        
        for (const zipFile of files) {
          const blob = await zipFile.async('blob');
          const photo = await handleSingleFile(blob, zipFile.name);
          if (photo) results.push(photo);
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
      setIsProcessingFiles(true);
      const allProcessed = await Promise.all(acceptedFiles.map(processFile));
      const validPhotos = allProcessed.flat();
      setPhotos((prev) => [...prev, ...validPhotos]);
      setIsProcessingFiles(false);
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/zip': ['.zip', '.livp'],
      'application/x-zip-compressed': ['.zip']
    }
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
          onClick={onFeedback}
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
            "border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-colors h-full min-h-[300px]",
            isDragActive ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
            {isProcessingFiles ? (
              <Loader2 className="w-10 h-10 text-stone-600 animate-spin" />
            ) : (
              <UploadCloud className="w-10 h-10 text-stone-600" />
            )}
          </div>
          <p className="font-medium text-lg text-stone-900 mb-2">
            {isProcessingFiles ? t.processing : t.dropzone}
          </p>
          <p className="text-stone-500">{t.supports}</p>
          
          <div className="mt-6 flex items-center gap-4">
            <div className="h-px w-12 bg-stone-200"></div>
            <span className="text-xs text-stone-400 uppercase tracking-widest font-medium">or</span>
            <div className="h-px w-12 bg-stone-200"></div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const input = document.createElement('input');
              input.type = 'file';
              input.webkitdirectory = true;
              input.onchange = async (ev: any) => {
                const files = Array.from(ev.target.files) as File[];
                if (files.length > 0) {
                  setIsProcessingFiles(true);
                  const allProcessed = await Promise.all(files.map(processFile));
                  const validPhotos = allProcessed.flat();
                  setPhotos((prev) => [...prev, ...validPhotos]);
                  setIsProcessingFiles(false);
                }
              };
              input.click();
            }}
            className="mt-6 px-4 py-2 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            {t.uploadFolder}
          </button>
        </div>
      </div>

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
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-500 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={photos.length === 0}
          className="bg-stone-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {t.continue}
          <ImagePlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
