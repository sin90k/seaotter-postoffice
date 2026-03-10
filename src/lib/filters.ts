/**
 * 照片滤镜算法库 - 像素级处理
 * 不依赖第三方库，纯 Canvas ImageData 操作
 */

/**
 * 对比度调整
 * @param value - 原始值 0-255
 * @param contrast - 对比度系数，1 为原样，>1 增强，<1 减弱
 */
export const adjustContrast = (value: number, contrast: number): number => {
  const v = value / 255;
  const c = (v - 0.5) * contrast + 0.5;
  return Math.round(Math.max(0, Math.min(255, c * 255)));
};

/**
 * 饱和度调整
 * @param r, g, b - RGB 0-255
 * @param saturation - 饱和度系数，1 原样，0 灰，>1 增强
 */
export const adjustSaturation = (
  r: number,
  g: number,
  b: number,
  saturation: number
): [number, number, number] => {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return [
    Math.round(Math.max(0, Math.min(255, gray + (r - gray) * saturation))),
    Math.round(Math.max(0, Math.min(255, gray + (g - gray) * saturation))),
    Math.round(Math.max(0, Math.min(255, gray + (b - gray) * saturation))),
  ];
};

/**
 * 色温调整（暖色/冷色）
 * @param r, g, b - RGB 0-255
 * @param warmth - >0 暖色(偏黄红)，<0 冷色(偏蓝)
 */
export const adjustWarmth = (
  r: number,
  g: number,
  b: number,
  warmth: number
): [number, number, number] => {
  if (warmth > 0) {
    r = Math.min(255, r + warmth * 1.2);
    b = Math.max(0, b - warmth * 0.8);
  } else {
    r = Math.max(0, r + warmth * 0.8);
    b = Math.min(255, b - warmth * 1.2);
  }
  return [Math.round(r), Math.round(g), Math.round(b)];
};

/**
 * 胶片颗粒 - 随机噪声叠加
 * @param imageData
 * @param intensity - 0-20
 */
export const addFilmGrain = (
  imageData: ImageData,
  intensity: number
): void => {
  const { data } = imageData;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const noise = (Math.random() - 0.5) * 2 * intensity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
};

/**
 * 暗角效果 - 根据到中心距离渐暗
 * @param imageData
 * @param width
 * @param height
 * @param strength - 0-1，越大暗角越明显
 */
export const addVignette = (
  imageData: ImageData,
  width: number,
  height: number,
  strength: number
): void => {
  const { data } = imageData;
  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const factor = 1 - (dist / maxDist) * strength;
      const i = (y * width + x) * 4;
      data[i] = Math.round(data[i] * factor);
      data[i + 1] = Math.round(data[i + 1] * factor);
      data[i + 2] = Math.round(data[i + 2] * factor);
    }
  }
};

/**
 * 高光柔化 - 降低高光区域对比
 */
const softenHighlights = (imageData: ImageData, amount: number): void => {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3 / 255;
    if (brightness > 0.7) {
      const blend = ((brightness - 0.7) / 0.3) * amount;
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i] * (1 - blend) + gray * blend;
      data[i + 1] = data[i + 1] * (1 - blend) + gray * blend;
      data[i + 2] = data[i + 2] * (1 - blend) + gray * blend;
    }
  }
};

/**
 * 锐化 - 简单拉普拉斯卷积
 */
const sharpen = (
  imageData: ImageData,
  width: number,
  height: number,
  amount: number
): void => {
  const { data } = imageData;
  const out = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const i = (y * width + x) * 4 + c;
        out[i] = Math.max(
          0,
          Math.min(255, data[i] + (sum - data[i]) * amount)
        );
      }
    }
  }
  for (let i = 0; i < data.length; i++) data[i] = out[i];
};

/**
 * 数码噪点 - 随机彩色噪声
 */
const addDigitalNoise = (
  imageData: ImageData,
  intensity: number
): void => {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(
      0,
      Math.min(255, data[i] + (Math.random() - 0.5) * intensity)
    );
    data[i + 1] = Math.max(
      0,
      Math.min(255, data[i + 1] + (Math.random() - 0.5) * intensity)
    );
    data[i + 2] = Math.max(
      0,
      Math.min(255, data[i + 2] + (Math.random() - 0.5) * intensity)
    );
  }
};

/** 文本描述解析后得到的统一调整参数（非按滤镜硬编码） */
export interface DynamicAdjustments {
  contrast: number;
  saturation: number;
  warmth: number;
  fade: number;
  grain: number;
  vignette: number;
  softenHighlights: number;
  sharpenAmount: number;
  digitalNoise: number;
  toBlackWhite: boolean;
}

/** 从说明文字中解析出基础调色趋势（不含强度，后续再与滑杆 intensity 混合） */
const parseDescriptionToAdjustments = (description: string): DynamicAdjustments => {
  const text = description.toLowerCase();

  // 全局基准：全部为“中性”
  let contrast = 1;
  let saturation = 1;
  let warmth = 0;
  let fade = 0;
  let grain = 0;
  let vignette = 0;
  let softenHighlights = 0;
  let sharpenAmount = 0;
  let digitalNoise = 0;
  let toBlackWhite = false;

  const hasAny = (words: string[]) => words.some((w) => text.includes(w));

  // 对比度趋势
  if (hasAny(['high contrast', 'strong contrast', 'deep contrast', 'dramatic'])) {
    contrast = 1.25;
  } else if (hasAny(['soft contrast', 'gentle contrast', 'low contrast', 'faded'])) {
    contrast = 0.85;
  }

  // 饱和度趋势
  if (hasAny(['vivid', 'vibrant', 'rich color', 'punchy color'])) {
    saturation = 1.3;
  } else if (hasAny(['muted', 'pastel', 'low saturation', 'desaturated', 'faded'])) {
    saturation = 0.8;
  }

  // 色温趋势
  if (hasAny(['warm', 'golden', 'sunset'])) {
    warmth = 0.12;
  } else if (hasAny(['cool', 'cold', 'blue', 'nordic', 'night'])) {
    warmth = -0.1;
  }

  // 褪色 / 复古感
  if (hasAny(['faded', 'vintage', 'pastel', 'hazy', 'soft'])) {
    fade = 0.12;
  }

  // 颗粒
  if (hasAny(['film', 'grain', 'analog'])) {
    grain = 8;
  }

  // 暗角
  if (hasAny(['vignette', 'focus', 'edge darkening'])) {
    vignette = 0.25;
  }

  // 高光柔化
  if (hasAny(['soft highlight', 'glow', 'bloom', 'dreamy'])) {
    softenHighlights = 0.6;
  }

  // 锐化
  if (hasAny(['crisp details', 'sharp detail', 'micro-contrast'])) {
    sharpenAmount = 0.35;
  }

  // 数码噪点 / 夜景颗粒
  if (hasAny(['digital noise', 'neon', 'night'])) {
    digitalNoise = 6;
  }

  // 黑白
  if (hasAny(['black and white', 'monochrome', 'b&w'])) {
    toBlackWhite = true;
    saturation = 0; // 基础趋势为去色，具体强度再受滑杆控制
  }

  return {
    contrast,
    saturation,
    warmth,
    fade,
    grain,
    vignette,
    softenHighlights,
    sharpenAmount,
    digitalNoise,
    toBlackWhite,
  };
};

/**
 * 单次循环应用基础调整（对比度、饱和度、色温、褪色、黑白）到整个 ImageData
 * intensity ∈ [0,1]，0 表示无变化，1 表示使用解析出的完整风格。
 */
const applyDynamicBaseAdjustments = (
  imageData: ImageData,
  descAdjust: DynamicAdjustments,
  intensity: number
): void => {
  const { data } = imageData;

  // 将解析出的参数与“中性”之间按 intensity 做插值
  const contrast = 1 + (descAdjust.contrast - 1) * intensity;
  const saturation = 1 + (descAdjust.saturation - 1) * intensity;
  const warmth = descAdjust.warmth * intensity;
  const fade = descAdjust.fade * intensity;
  const toBWStrength = descAdjust.toBlackWhite ? intensity : 0;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = adjustContrast(r, contrast);
    g = adjustContrast(g, contrast);
    b = adjustContrast(b, contrast);

    [r, g, b] = adjustSaturation(r, g, b, saturation);
    [r, g, b] = adjustWarmth(r, g, b, warmth);

    if (fade > 0) {
      r = r + (255 - r) * fade;
      g = g + (255 - g) * fade;
      b = b + (255 - b) * fade;
    }

    if (toBWStrength > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray * toBWStrength + r * (1 - toBWStrength);
      g = gray * toBWStrength + g * (1 - toBWStrength);
      b = gray * toBWStrength + b * (1 - toBWStrength);
    }

    data[i] = Math.round(Math.max(0, Math.min(255, r)));
    data[i + 1] = Math.round(Math.max(0, Math.min(255, g)));
    data[i + 2] = Math.round(Math.max(0, Math.min(255, b)));
  }
};

/**
 * 根据「风格描述 + 强度」动态应用滤镜。
 * 所有滤镜共用这套逻辑，避免为单个滤镜写死参数。
 */
export const applyDynamicStyleToImageData = (
  imageData: ImageData,
  width: number,
  height: number,
  description: string,
  intensity: number
): void => {
  const safeIntensity = Math.max(0, Math.min(1, intensity));
  if (safeIntensity === 0 || !description.trim()) return;

  const descAdjust = parseDescriptionToAdjustments(description);

  applyDynamicBaseAdjustments(imageData, descAdjust, safeIntensity);

  // 次级效果（颗粒 / 暗角 / 高光柔化 / 锐化 / 噪点）也按 intensity 缩放
  if (descAdjust.grain > 0) {
    addFilmGrain(imageData, descAdjust.grain * safeIntensity);
  }
  if (descAdjust.vignette > 0) {
    addVignette(imageData, width, height, descAdjust.vignette * safeIntensity);
  }
  if (descAdjust.softenHighlights > 0) {
    softenHighlights(imageData, descAdjust.softenHighlights * safeIntensity);
  }
  if (descAdjust.sharpenAmount > 0) {
    sharpen(imageData, width, height, descAdjust.sharpenAmount * safeIntensity);
  }
  if (descAdjust.digitalNoise > 0) {
    addDigitalNoise(imageData, descAdjust.digitalNoise * safeIntensity);
  }
};

