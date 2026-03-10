/**
 * 滤镜 UI 控制 - 统一管理滤镜选项与文案
 * 供 Step3Configure 等组件复用
 */

import { PIXEL_FILTER_TYPES } from './filter-engine';

/** 所有滤镜选项（含 CSS 滤镜与像素级滤镜） */
export const FILTER_OPTIONS = [
  { id: 'none', labelKey: 'filterNone', isPixel: false },
  { id: 'polaroid', labelKey: 'filterPolaroid', isPixel: true },
  { id: 'film', labelKey: 'filterFilm', isPixel: true },
  { id: 'ccd', labelKey: 'filterCcd', isPixel: true },
  { id: 'vintageTravel', labelKey: 'filterVintageTravel', isPixel: true },
  { id: 'vintage', labelKey: 'filterVintage', isPixel: false },
  { id: 'bw', labelKey: 'filterBw', isPixel: false },
  { id: 'warm', labelKey: 'filterWarm', isPixel: false },
  { id: 'fresh', labelKey: 'filterFresh', isPixel: false },
  { id: 'spectacular', labelKey: 'filterSpectacular', isPixel: false },
  { id: 'cool', labelKey: 'filterCool', isPixel: false },
  { id: 'fade', labelKey: 'filterFade', isPixel: false },
  { id: 'dreamy', labelKey: 'filterDreamy', isPixel: false },
  { id: 'cinematic', labelKey: 'filterCinematic', isPixel: false },
  { id: 'vivid', labelKey: 'filterVivid', isPixel: false },
];

/** 像素级滤镜的翻译键 */
export const PIXEL_FILTER_LABELS = {
  filterPolaroid: { en: 'Polaroid', zh: '拍立得', ja: 'ポラロイド', ko: '폴라로이드' },
  filterFilm: { en: 'Film', zh: '胶片', ja: 'フィルム', ko: '필름' },
  filterCcd: { en: 'CCD', zh: 'CCD', ja: 'CCD', ko: 'CCD' },
  filterVintageTravel: { en: 'Vintage', zh: '复古旅行', ja: 'ビンテージ旅行', ko: '빈티지 여행' },
};

export { PIXEL_FILTER_TYPES };
