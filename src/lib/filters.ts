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

/** 数值滤镜参数（-100 ~ +100），与 config/travelFilters.ts 对应 */
export interface FilterParams {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  fade: number;
  grain: number;
  vignette: number;
  sharpness: number;
  highlight: number;
  shadow: number;
}

/**
 * 根据数值参数 + intensity 应用滤镜。
 * final_value = preset_value * intensity（按需映射到实际效果）。
 */
export const applyParamsStyleToImageData = (
  imageData: ImageData,
  width: number,
  height: number,
  params: FilterParams,
  intensity: number
): void => {
  const safeIntensity = Math.max(0, Math.min(1, intensity));
  if (safeIntensity === 0) return;

  const { data } = imageData;

  // 归一化参数：[-100, 100] → 实际效果强度
  const norm = (v: number, scale: number) => {
    const clamped = Math.max(-100, Math.min(100, v));
    return (clamped / 100) * scale * safeIntensity;
  };

  const exposureOffset = norm(params.exposure, 40); // 亮度偏移，最多 ±40
  const contrastFactor = 1 + norm(params.contrast, 0.8); // 对比度系数 ~ [0.2, 1.8]
  const saturationFactor = 1 + norm(params.saturation, 1.0); // 饱和度
  const warmthDelta = norm(params.temperature, 30); // 色温：红蓝通道偏移
  const tintDelta = norm(params.tint, 30); // 色调：绿品红偏移
  const fadeAmount = Math.max(0, norm(params.fade, 0.8)); // 褪色 0~0.8
  const grainAmount = Math.max(0, norm(params.grain, 25)); // 颗粒 0~25
  const vignetteStrength = Math.max(0, norm(params.vignette, 0.8)); // 暗角 0~0.8
  const sharpenAmount = norm(params.sharpness, 0.8); // 锐化系数，可正可负
  const highlightAdj = norm(params.highlight, 1.0); // 高光调整
  const shadowAdj = norm(params.shadow, 1.0); // 阴影调整

  // 一次遍历：曝光 / 对比度 / 饱和度 / 色温 / 褪色 / 高光阴影 / 色调
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 曝光（整体亮度偏移）
    r = r + exposureOffset;
    g = g + exposureOffset;
    b = b + exposureOffset;

    // 对比度
    r = adjustContrast(r, contrastFactor);
    g = adjustContrast(g, contrastFactor);
    b = adjustContrast(b, contrastFactor);

    // 饱和度
    [r, g, b] = adjustSaturation(r, g, b, saturationFactor);

    // 色温：红蓝通道相反方向偏移
    r += warmthDelta;
    b -= warmthDelta;

    // Tint：绿通道 vs 品红（R+B）
    g += tintDelta;
    r -= tintDelta * 0.5;
    b -= tintDelta * 0.5;

    // 高光 / 阴影：对亮 / 暗区域做不同调节
    const brightness = (r + g + b) / 3;
    const bNorm = brightness / 255;
    let shadowBoost = 0;
    let highlightCut = 0;
    if (shadowAdj !== 0 && bNorm < 0.5) {
      shadowBoost = (0.5 - bNorm) * shadowAdj * 1.2;
    }
    if (highlightAdj !== 0 && bNorm > 0.5) {
      highlightCut = (bNorm - 0.5) * highlightAdj * 1.2;
    }
    const toneDelta = shadowBoost - highlightCut;
    r += toneDelta;
    g += toneDelta;
    b += toneDelta;

    // 褪色：向白色靠拢
    if (fadeAmount > 0) {
      r = r + (255 - r) * fadeAmount;
      g = g + (255 - g) * fadeAmount;
      b = b + (255 - b) * fadeAmount;
    }

    data[i] = Math.round(Math.max(0, Math.min(255, r)));
    data[i + 1] = Math.round(Math.max(0, Math.min(255, g)));
    data[i + 2] = Math.round(Math.max(0, Math.min(255, b)));
  }

  // 颗粒 / 暗角 / 锐化 / 数码噪点（单独 pass）
  if (grainAmount > 0) {
    addFilmGrain(imageData, grainAmount);
  }
  if (vignetteStrength > 0) {
    addVignette(imageData, width, height, vignetteStrength);
  }
  if (sharpenAmount !== 0) {
    if (sharpenAmount > 0) {
      sharpen(imageData, width, height, sharpenAmount);
    } else {
      // 负锐度：使用轻微褪色 + 高光柔化近似“柔焦”
      softenHighlights(imageData, -sharpenAmount * 0.8);
    }
  }
  // 高参数场景可以稍加数码噪点，保持细节质感
  const noiseBase = Math.max(0, (Math.abs(params.sharpness) + params.contrast + params.grain) / 3);
  if (noiseBase > 10) {
    addDigitalNoise(imageData, norm(noiseBase, 2));
  }
};


