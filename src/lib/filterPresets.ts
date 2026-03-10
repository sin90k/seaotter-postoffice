import { defaultTravelFilters, type TravelFilterId, type TravelFilterPreset } from '../config/travelFilters';

const LS_KEY = 'admin_travel_filters';

export type { TravelFilterId, TravelFilterPreset };

/** 从 localStorage 读取后台自定义滤镜预设，若不存在则使用默认值。 */
export const getTravelFilterPresets = (): TravelFilterPreset[] => {
  if (typeof localStorage === 'undefined') return defaultTravelFilters;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultTravelFilters;
    const parsed = JSON.parse(raw) as TravelFilterPreset[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultTravelFilters;
    // 按 id 合并默认字段，避免后台误删属性导致崩溃
    const map = new Map(parsed.map((p) => [p.id, p]));
    return defaultTravelFilters.map((d) => ({
      ...d,
      ...(map.get(d.id) || {}),
    }));
  } catch {
    return defaultTravelFilters;
  }
};

/** 根据 id 获取单个预设 */
export const getTravelFilterById = (id: TravelFilterId | string | undefined): TravelFilterPreset | undefined => {
  if (!id) return undefined;
  return getTravelFilterPresets().find((p) => p.id === id);
};

/** 后台保存自定义预设（Admin 面板调用） */
export const saveTravelFilterPresets = (presets: TravelFilterPreset[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(presets));
};

