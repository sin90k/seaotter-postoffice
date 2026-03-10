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

/** 滤镜预设参数类型 */
export interface FilterPreset {
  contrast?: number;
  saturation?: number;
  warmth?: number;
  fade?: number;
  grain?: number;
  vignette?: number;
  softenHighlights?: number;
  sharpen?: number;
  digitalNoise?: number;
}

/**
 * 滤镜预设：各滤镜的参数
 */
export const FILTER_PRESETS: Record<string, FilterPreset> = {
  polaroid: {
    contrast: 0.9,
    saturation: 0.95,
    warmth: 0.05,
    fade: 0.03,
    grain: 6,
    vignette: 0.2,
  },
  film: {
    contrast: 1.15,
    saturation: 1.1,
    warmth: 0,
    fade: 0,
    grain: 10,
    vignette: 0.15,
    softenHighlights: 0.4,
  },
  ccd: {
    contrast: 1.25,
    saturation: 1,
    warmth: -0.08,
    fade: 0,
    grain: 0,
    vignette: 0.1,
    sharpen: 0.3,
    digitalNoise: 4,
  },
  vintageTravel: {
    contrast: 0.85,
    saturation: 0.8,
    warmth: 0.12,
    fade: 0.12,
    grain: 5,
    vignette: 0.35,
  },
};

/**
 * 单次循环应用基础调整（对比度、饱和度、色温、褪色）到整个 ImageData
 * 避免多次遍历，提升性能
 */
const applyBaseAdjustments = (
  imageData: ImageData,
  opts: { contrast?: number; saturation?: number; warmth?: number; fade?: number }
): void => {
  const { data } = imageData;
  const {
    contrast = 1,
    saturation = 1,
    warmth = 0,
    fade = 0,
  } = opts;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i],
      g = data[i + 1],
      b = data[i + 2];
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
    data[i] = Math.round(Math.max(0, Math.min(255, r)));
    data[i + 1] = Math.round(Math.max(0, Math.min(255, g)));
    data[i + 2] = Math.round(Math.max(0, Math.min(255, b)));
  }
};

/**
 * 应用指定预设滤镜到 ImageData
 * @param imageData
 * @param width
 * @param height
 * @param type - polaroid | film | ccd | vintageTravel
 */
export const applyPresetToImageData = (
  imageData: ImageData,
  width: number,
  height: number,
  type: string
): void => {
  const preset = FILTER_PRESETS[type];
  if (!preset) return;
  applyBaseAdjustments(imageData, {
    contrast: preset.contrast,
    saturation: preset.saturation,
    warmth: preset.warmth,
    fade: preset.fade,
  });
  if (preset.grain) addFilmGrain(imageData, preset.grain);
  if (preset.vignette) addVignette(imageData, width, height, preset.vignette);
  if (preset.softenHighlights)
    softenHighlights(imageData, preset.softenHighlights);
  if (preset.sharpen) sharpen(imageData, width, height, preset.sharpen);
  if (preset.digitalNoise) addDigitalNoise(imageData, preset.digitalNoise);
};
