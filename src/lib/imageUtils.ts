export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'Anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
};

export type CompressedImage = {
  blob: Blob;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Failed to compress image.')),
      type,
      quality,
    );
  });

/** Creates the only processing copy retained by the app after EXIF has been read. */
export const compressImageForProcessing = async (
  source: Blob,
  options: { maxDimension?: number; quality?: number } = {},
): Promise<CompressedImage> => {
  const maxDimension = options.maxDimension ?? 2048;
  const quality = options.quality ?? 0.82;
  const sourceUrl = URL.createObjectURL(source);

  try {
    const image = await loadImage(sourceUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) throw new Error('Image has invalid dimensions.');

    const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');

    // JPEG has no alpha channel; use postcard-white instead of turning transparent pixels black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    return {
      blob,
      width,
      height,
      originalBytes: source.size,
      compressedBytes: blob.size,
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
};

export const mergePostcard = async (frontUrl: string, backUrl: string): Promise<string> => {
  const front = await loadImage(frontUrl);
  const back = await loadImage(backUrl);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Vertical merge
  canvas.width = Math.max(front.width, back.width);
  canvas.height = front.height + back.height + 40; // 40px gap
  
  ctx.fillStyle = '#f5f5f4'; // Stone-100 background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.drawImage(front, (canvas.width - front.width) / 2, 0);
  ctx.drawImage(back, (canvas.width - back.width) / 2, front.height + 40);
  
  return canvas.toDataURL('image/jpeg', 0.9);
};
