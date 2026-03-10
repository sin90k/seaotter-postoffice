/**
 * 滤镜引擎 - 管理滤镜调用与 Canvas 交互
 * 单次 getImageData → 处理 → putImageData，保证性能
 */

import {
  applyPresetToImageData,
  FILTER_PRESETS,
} from './filters';

/** 支持像素级处理的滤镜类型 */
export const PIXEL_FILTER_TYPES = [
  'polaroid',
  'film',
  'ccd',
  'vintageTravel',
] as const;

export type PixelFilterType = (typeof PIXEL_FILTER_TYPES)[number];

/**
 * 对 Canvas 指定区域应用滤镜
 * @param type - 滤镜类型：polaroid | film | ccd | vintageTravel
 * @param ctx - 2D 上下文
 * @param width - 区域宽度
 * @param height - 区域高度
 * @param sx - 源 x 偏移
 * @param sy - 源 y 偏移
 * @returns 是否成功应用
 */
export function applyFilter(
  type: string,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sx = 0,
  sy = 0
): boolean {
  if (!type || !PIXEL_FILTER_TYPES.includes(type as PixelFilterType))
    return false;
  const imageData = ctx.getImageData(sx, sy, width, height);
  applyPresetToImageData(imageData, width, height, type);
  ctx.putImageData(imageData, sx, sy);
  return true;
}

/**
 * 判断是否为像素级滤镜（需在绘制后单独处理）
 */
export function isPixelFilter(type: string | undefined): boolean {
  return !!type && PIXEL_FILTER_TYPES.includes(type as PixelFilterType);
}

/**
 * 扩展：新增滤镜时只需在 filters.ts 的 FILTER_PRESETS 中添加预设
 * 并在 PIXEL_FILTER_TYPES 中加入类型名，即可通过 applyFilter("newStyle") 使用
 */
export { FILTER_PRESETS };
