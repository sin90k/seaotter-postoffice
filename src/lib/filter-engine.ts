/**
 * 滤镜引擎 - 根据可编辑文本描述动态应用滤镜
 * 单次 getImageData → 处理 → putImageData，保证性能。
 */

import { applyDynamicStyleToImageData } from './filters';
import {
  getTravelFilterById,
  type TravelFilterId,
  type TravelFilterPreset,
} from './filterPresets';

/**
 * 根据 TravelFilterId（Original / Film Travel 等）应用滤镜。
 * @param filterId 滤镜 ID
 * @param ctx Canvas 2D 上下文
 * @param width 区域宽度
 * @param height 区域高度
 * @param intensity 0–1，0 为关闭，1 为全强度
 * @param sx 源 X 偏移
 * @param sy 源 Y 偏移
 */
export function applyFilterById(
  filterId: TravelFilterId | string | undefined,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
  sx = 0,
  sy = 0
): boolean {
  const preset = getTravelFilterById(filterId as TravelFilterId);
  if (!preset || preset.id === 'original') return false;
  const imageData = ctx.getImageData(sx, sy, width, height);
  applyDynamicStyleToImageData(imageData, width, height, preset.description, intensity);
  ctx.putImageData(imageData, sx, sy);
  return true;
}

/** 暴露预设类型，供 Admin / UI 使用 */
export type { TravelFilterPreset, TravelFilterId };

