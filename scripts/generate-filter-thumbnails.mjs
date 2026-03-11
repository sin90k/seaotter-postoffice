/**
 * Generate filter thumbnails: reference image → apply each filter → 128x128 PNG in public/filter-thumbnails/.
 * Run: node scripts/generate-filter-thumbnails.mjs
 * Uses thumbnailStrength = 1.4 (scale preset params by 1.4, clamped to [-100,100], then intensity 1).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const thumbDir = path.join(publicDir, 'filter-thumbnails');

// Filter list and params (same order as travelFilters) — keep in sync with src/config/travelFilters.ts
const FILTER_PRESETS = [
  { id: 'original', params: { exposure: 0, contrast: 0, saturation: 0, temperature: 0, tint: 0, fade: 0, grain: 0, vignette: 0, sharpness: 0, highlight: 0, shadow: 0 } },
  { id: 'summer', params: { exposure: 35, contrast: 35, saturation: 60, temperature: 40, tint: 10, fade: 0, grain: 5, vignette: 10, sharpness: 15, highlight: -35, shadow: 35 } },
  { id: 'film', params: { exposure: 10, contrast: 45, saturation: 30, temperature: 25, tint: 10, fade: 20, grain: 60, vignette: 35, sharpness: -5, highlight: -40, shadow: 30 } },
  { id: 'goldenSunset', params: { exposure: 20, contrast: 50, saturation: 45, temperature: 70, tint: 25, fade: 10, grain: 10, vignette: 20, sharpness: 10, highlight: -60, shadow: 40 } },
  { id: 'tropical', params: { exposure: 30, contrast: 30, saturation: 70, temperature: 20, tint: -5, fade: 0, grain: 0, vignette: 5, sharpness: 20, highlight: -25, shadow: 25 } },
  { id: 'cinematic', params: { exposure: -10, contrast: 70, saturation: -10, temperature: -20, tint: 35, fade: 15, grain: 40, vignette: 60, sharpness: 20, highlight: -70, shadow: 50 } },
  { id: 'polaroid', params: { exposure: 25, contrast: -30, saturation: -20, temperature: 30, tint: 5, fade: 60, grain: 25, vignette: 15, sharpness: -15, highlight: -10, shadow: 35 } },
  { id: 'vintagePostcard', params: { exposure: 10, contrast: -20, saturation: -35, temperature: 25, tint: 10, fade: 55, grain: 45, vignette: 30, sharpness: -20, highlight: -25, shadow: 20 } },
  { id: 'nordic', params: { exposure: 15, contrast: 40, saturation: -30, temperature: -40, tint: -10, fade: 10, grain: 15, vignette: 15, sharpness: 15, highlight: -15, shadow: 20 } },
  { id: 'tokyoNight', params: { exposure: -25, contrast: 65, saturation: 20, temperature: -50, tint: 35, fade: 0, grain: 50, vignette: 50, sharpness: 25, highlight: -80, shadow: 35 } },
  { id: 'moody', params: { exposure: -35, contrast: 55, saturation: -15, temperature: -15, tint: 10, fade: 10, grain: 30, vignette: 45, sharpness: 10, highlight: -50, shadow: 25 } },
  { id: 'underwaterRestore', params: { exposure: 25, contrast: 20, saturation: 25, temperature: -10, tint: 40, fade: 0, grain: 5, vignette: 5, sharpness: 30, highlight: -15, shadow: 45 } },
];

const THUMB_STRENGTH = 1.4;
const REF_W = 256;
const REF_H = 256;
const THUMB_SIZE = 128;

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function scaleParams(p) {
  const out = {};
  for (const [k, v] of Object.entries(p)) out[k] = clamp(Math.round(v * THUMB_STRENGTH), -100, 100);
  return out;
}

// Inline filter logic (no ImageData in Node) — minimal copy of filters.ts behavior for thumbnail only
function adjustContrast(value, contrast) {
  const v = value / 255;
  const c = (v - 0.5) * contrast + 0.5;
  return Math.round(Math.max(0, Math.min(255, c * 255)));
}
function adjustSaturation(r, g, b, saturation) {
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  return [
    Math.round(Math.max(0, Math.min(255, gray + (r - gray) * saturation))),
    Math.round(Math.max(0, Math.min(255, gray + (g - gray) * saturation))),
    Math.round(Math.max(0, Math.min(255, gray + (b - gray) * saturation))),
  ];
}
function applyParamsStyleToImageData(data, width, height, params, intensity) {
  const safeIntensity = Math.max(0, Math.min(1, intensity));
  if (safeIntensity === 0) return;
  const norm = (v, scale) => {
    const clamped = Math.max(-100, Math.min(100, v));
    return (clamped / 100) * scale * safeIntensity;
  };
  const exposureOffset = norm(params.exposure, 40);
  const contrastFactor = 1 + norm(params.contrast, 0.8);
  const saturationFactor = 1 + norm(params.saturation, 1.0);
  const warmthDelta = norm(params.temperature, 30);
  const tintDelta = norm(params.tint, 30);
  const fadeAmount = Math.max(0, norm(params.fade, 0.8));
  const grainAmount = Math.max(0, norm(params.grain, 25));
  const vignetteStrength = Math.max(0, norm(params.vignette, 0.8));
  const sharpenAmount = norm(params.sharpness, 0.8);
  const highlightAdj = norm(params.highlight, 1.0);
  const shadowAdj = norm(params.shadow, 1.0);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    r = r + exposureOffset; g = g + exposureOffset; b = b + exposureOffset;
    r = adjustContrast(r, contrastFactor); g = adjustContrast(g, contrastFactor); b = adjustContrast(b, contrastFactor);
    [r, g, b] = adjustSaturation(r, g, b, saturationFactor);
    r += warmthDelta; b -= warmthDelta;
    g += tintDelta; r -= tintDelta * 0.5; b -= tintDelta * 0.5;
    const brightness = (r + g + b) / 3, bNorm = brightness / 255;
    let shadowBoost = 0, highlightCut = 0;
    if (shadowAdj !== 0 && bNorm < 0.5) shadowBoost = (0.5 - bNorm) * shadowAdj * 1.2;
    if (highlightAdj !== 0 && bNorm > 0.5) highlightCut = (bNorm - 0.5) * highlightAdj * 1.2;
    const toneDelta = shadowBoost - highlightCut;
    r += toneDelta; g += toneDelta; b += toneDelta;
    if (fadeAmount > 0) {
      r = r + (255 - r) * fadeAmount;
      g = g + (255 - g) * fadeAmount;
      b = b + (255 - b) * fadeAmount;
    }
    data[i] = Math.round(Math.max(0, Math.min(255, r)));
    data[i + 1] = Math.round(Math.max(0, Math.min(255, g)));
    data[i + 2] = Math.round(Math.max(0, Math.min(255, b)));
  }

  // Grain
  if (grainAmount > 0) {
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 2 * grainAmount;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }
  // Vignette
  if (vignetteStrength > 0) {
    const cx = width / 2, cy = height / 2, maxDist = Math.sqrt(cx * cx + cy * cy);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const factor = 1 - (dist / maxDist) * vignetteStrength;
        const i = (y * width + x) * 4;
        data[i] = Math.round(data[i] * factor);
        data[i + 1] = Math.round(data[i + 1] * factor);
        data[i + 2] = Math.round(data[i + 2] * factor);
      }
    }
  }
}

function createReferencePng() {
  const png = new PNG({ width: REF_W, height: REF_H, filterType: -1 });
  for (let y = 0; y < REF_H; y++) {
    for (let x = 0; x < REF_W; x++) {
      const i = (REF_W * y + x) << 2;
      const t = x / REF_W;
      const s = y / REF_H;
      png.data[i] = Math.round(80 + 120 * t + 40 * Math.sin(s * Math.PI));
      png.data[i + 1] = Math.round(100 + 80 * s + 30 * Math.cos(t * Math.PI));
      png.data[i + 2] = Math.round(140 + 60 * (1 - t) + 50 * (1 - s));
      png.data[i + 3] = 255;
    }
  }
  return png;
}

function resizeTo(data, w, h, outW, outH) {
  const out = new Uint8ClampedArray(outW * outH * 4);
  const xRatio = w / outW, yRatio = h / outH;
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const srcX = Math.min(Math.floor(x * xRatio), w - 1);
      const srcY = Math.min(Math.floor(y * yRatio), h - 1);
      const srcI = (srcY * w + srcX) * 4;
      const outI = (y * outW + x) * 4;
      out[outI] = data[srcI];
      out[outI + 1] = data[srcI + 1];
      out[outI + 2] = data[srcI + 2];
      out[outI + 3] = data[srcI + 3];
    }
  }
  return out;
}

function writePngSync(filePath, data, width, height) {
  const png = new PNG({ width, height, filterType: -1 });
  png.data.set(data);
  const buffer = PNG.sync.write(png);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

async function main() {
  if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

  const ref = createReferencePng();
  const refPath = path.join(publicDir, 'filter-reference.png');
  fs.mkdirSync(path.dirname(refPath), { recursive: true });
  await new Promise((res, rej) => {
    ref.pack().pipe(fs.createWriteStream(refPath)).on('finish', res).on('error', rej);
  });

  const refData = new Uint8ClampedArray(ref.data.buffer || ref.data);
  const refW = ref.width, refH = ref.height;

  for (const { id, params } of FILTER_PRESETS) {
    const data = new Uint8ClampedArray(refData);
    const scaled = scaleParams(params);
    applyParamsStyleToImageData(data, refW, refH, scaled, 1);
    const thumbData = resizeTo(data, refW, refH, THUMB_SIZE, THUMB_SIZE);
    const outPath = path.join(thumbDir, `${id}.png`);
    writePngSync(outPath, thumbData, THUMB_SIZE, THUMB_SIZE);
    console.log('Written', outPath);
  }
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
