/**
 * Share Card：根据正/背面图生成 4:5 分享图
 * - front_only：仅正面；若为免费积分生成则底部加品牌（branding）
 * - front_back：正+背，横向图上下排，竖向图左右排，不额外加品牌
 */

export type ShareType = 'front_only' | 'front_back';

export type ShareBrandingOptions = {
  enabled: boolean;
  text: string;
  opacity: number;
  /** 字体高度占图片高度的比例，如 0.02 = 2% */
  sizeRatio: number;
};

const OUTPUT_RATIO = 4 / 5; // 4:5

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/** 根据图片宽高判断横向(true) 或 竖向(false)。横向用上下布局，竖向用左右布局 */
function isLandscape(width: number, height: number): boolean {
  return width > height;
}

/**
 * 生成 Share Card 为 Blob（PNG）
 * @param frontImageUrl 正面图 URL（dataUrl 或 signed URL）
 * @param backImageUrl 背面图 URL（front_only 时可传空）
 * @param shareType front_only | front_back
 * @param branding 仅 front_only 且为免费积分生成时使用；付费生成传 enabled: false
 */
export async function buildShareCardBlob(
  frontImageUrl: string,
  backImageUrl: string | undefined,
  shareType: ShareType,
  branding: ShareBrandingOptions
): Promise<Blob> {
  const frontImg = await loadImage(frontImageUrl);
  const fw = frontImg.naturalWidth || frontImg.width;
  const fh = frontImg.naturalHeight || frontImg.height;
  const landscape = isLandscape(fw, fh);

  let backImg: HTMLImageElement | null = null;
  if (shareType === 'front_back' && backImageUrl) {
    backImg = await loadImage(backImageUrl);
  }

  // 内容区：正面 + 背面（若有）的布局尺寸
  let contentWidth: number, contentHeight: number;
  if (shareType === 'front_only') {
    contentWidth = fw;
    contentHeight = fh;
  } else if (shareType === 'front_back' && backImg) {
    const bw = backImg.naturalWidth || backImg.width;
    const bh = backImg.naturalHeight || backImg.height;
    if (landscape) {
      // 上下：宽度取 max，高度相加
      contentWidth = Math.max(fw, bw);
      contentHeight = fh + bh;
    } else {
      // 左右：宽度相加，高度取 max
      contentWidth = fw + bw;
      contentHeight = Math.max(fh, bh);
    }
  } else {
    contentWidth = fw;
    contentHeight = fh;
  }

  // 目标 4:5，用 padding 补齐
  let outWidth: number, outHeight: number, padLeft: number, padTop: number;
  const wantRatio = OUTPUT_RATIO;
  const contentRatio = contentWidth / contentHeight;
  if (contentRatio > wantRatio) {
    outWidth = contentWidth;
    outHeight = Math.round(contentWidth / wantRatio);
    padLeft = 0;
    padTop = (outHeight - contentHeight) / 2;
  } else {
    outHeight = contentHeight;
    outWidth = Math.round(contentHeight * wantRatio);
    padLeft = (outWidth - contentWidth) / 2;
    padTop = 0;
  }

  const canvas = document.createElement('canvas');
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2d not available');

  const bg = '#f5f5f5';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, outWidth, outHeight);

  let drawY = padTop;
  let drawX = padLeft;

  if (shareType === 'front_only') {
    ctx.drawImage(frontImg, drawX, drawY, fw, fh);
    drawY += fh;
  } else if (shareType === 'front_back' && backImg) {
    const bw = backImg.naturalWidth || backImg.width;
    const bh = backImg.naturalHeight || backImg.height;
    if (landscape) {
      ctx.drawImage(frontImg, drawX, drawY, fw, fh);
      drawY += fh;
      ctx.drawImage(backImg, drawX, drawY, bw, bh);
    } else {
      ctx.drawImage(frontImg, drawX, drawY, fw, fh);
      drawX += fw;
      ctx.drawImage(backImg, drawX, drawY, bw, bh);
    }
  }

  // Front Only + 免费积分生成：底部加品牌
  if (shareType === 'front_only' && branding.enabled && branding.text) {
    const fontSize = Math.max(12, outHeight * branding.sizeRatio);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = branding.opacity;
    ctx.fillStyle = '#333';
    ctx.fillText(branding.text, outWidth / 2, outHeight - fontSize * 0.5);
    ctx.globalAlpha = 1;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png',
      0.92
    );
  });
}
