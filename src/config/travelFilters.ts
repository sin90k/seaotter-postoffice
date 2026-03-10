export type TravelFilterId =
  | 'original'
  | 'filmTravel'
  | 'polaroid'
  | 'summerBright'
  | 'goldenSunset'
  | 'tokyoNight'
  | 'nordicCool'
  | 'vintageEurope'
  | 'cinematic'
  | 'dreamy'
  | 'vividLandscape'
  | 'blackWhiteClassic';

/** 数值滤镜参数，范围约为 -30 ~ +30 */
export interface TravelFilterParams {
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

export interface TravelFilterPreset {
  id: TravelFilterId;
  name: string;
  /** 人类可读的风格描述（给运营看的），不参与计算，可在后台自由编辑。 */
  description: string;
  /** 数值参数预设，可在后台调节。 */
  params: TravelFilterParams;
}

/** 默认滤镜预设（仅描述，不包含任何具体数值参数） */
export const defaultTravelFilters: TravelFilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Keep the photo as it is, with no stylistic adjustments.',
    params: {
      exposure: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      fade: 0,
      grain: 0,
      vignette: 0,
      sharpness: 0,
      highlight: 0,
      shadow: 0,
    },
  },
  {
    id: 'filmTravel',
    name: 'Film Travel',
    description:
      'Soft film travel look with gentle contrast, slightly faded colors and visible grain, suitable for documentary-style travel postcards.',
    params: {
      exposure: 2,
      contrast: 14,
      saturation: 10,
      temperature: 8,
      tint: 2,
      fade: 6,
      grain: 20,
      vignette: 10,
      sharpness: -2,
      highlight: -12,
      shadow: 10,
    },
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    description:
      'Instant camera style with warm tones, low contrast, slight fade and noticeable film grain, like a casual snapshot from a vintage Polaroid.',
    params: {
      exposure: 6,
      contrast: -8,
      saturation: -6,
      temperature: 8,
      tint: 1,
      fade: 22,
      grain: 10,
      vignette: 6,
      sharpness: -4,
      highlight: -4,
      shadow: 12,
    },
  },
  {
    id: 'summerBright',
    name: 'Summer Bright',
    description:
      'Bright, high-key summer look with crisp highlights, slightly increased saturation and a clean, sunny atmosphere for beaches and blue skies.',
    params: {
      exposure: 8,
      contrast: 12,
      saturation: 20,
      temperature: 12,
      tint: 2,
      fade: 0,
      grain: 2,
      vignette: 4,
      sharpness: 4,
      highlight: -10,
      shadow: 10,
    },
  },
  {
    id: 'goldenSunset',
    name: 'Golden Sunset',
    description:
      'Warm golden-hour look with strong warm tones, soft contrast and gentle glow in the highlights, ideal for sunsets and evening cityscapes.',
    params: {
      exposure: 4,
      contrast: 16,
      saturation: 14,
      temperature: 18,
      tint: 5,
      fade: 4,
      grain: 4,
      vignette: 8,
      sharpness: 2,
      highlight: -20,
      shadow: 10,
    },
  },
  {
    id: 'tokyoNight',
    name: 'Tokyo Night',
    description:
      'High-contrast neon night style with cool shadows, deep blacks and vivid accent colors, inspired by modern Asian city nightlife.',
    params: {
      exposure: -4,
      contrast: 24,
      saturation: 6,
      temperature: -14,
      tint: 6,
      fade: 0,
      grain: 12,
      vignette: 18,
      sharpness: 6,
      highlight: -22,
      shadow: 12,
    },
  },
  {
    id: 'nordicCool',
    name: 'Nordic Cool',
    description:
      'Clean, cool-toned look with low saturation, soft highlights and slightly lifted shadows, evoking minimal Scandinavian landscapes.',
    params: {
      exposure: 2,
      contrast: 18,
      saturation: -10,
      temperature: -18,
      tint: -4,
      fade: 4,
      grain: 4,
      vignette: 8,
      sharpness: 2,
      highlight: -10,
      shadow: 10,
    },
  },
  {
    id: 'vintageEurope',
    name: 'Vintage Europe',
    description:
      'Muted vintage postcard look with slightly yellowish tones, low saturation, soft contrast and subtle vignetting for old European towns.',
    params: {
      exposure: 3,
      contrast: -6,
      saturation: -12,
      temperature: 10,
      tint: 3,
      fade: 26,
      grain: 18,
      vignette: 12,
      sharpness: -6,
      highlight: -14,
      shadow: 8,
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description:
      'Modern cinematic grading with deep contrast, rich midtones, slightly teal shadows and warm highlights, creating a dramatic movie-like feel.',
    params: {
      exposure: -2,
      contrast: 28,
      saturation: -4,
      temperature: -6,
      tint: 8,
      fade: 6,
      grain: 16,
      vignette: 20,
      sharpness: 4,
      highlight: -24,
      shadow: 20,
    },
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description:
      'Soft dreamy look with reduced contrast, pastel colors, gentle bloom in highlights and a light, hazy atmosphere.',
    params: {
      exposure: 10,
      contrast: -16,
      saturation: 12,
      temperature: 6,
      tint: 2,
      fade: 14,
      grain: 0,
      vignette: -4,
      sharpness: -8,
      highlight: 10,
      shadow: 16,
    },
  },
  {
    id: 'vividLandscape',
    name: 'Vivid Landscape',
    description:
      'Vibrant landscape look with noticeably increased saturation, clear micro-contrast and crisp details in foliage, sky and water.',
    params: {
      exposure: 4,
      contrast: 20,
      saturation: 24,
      temperature: 4,
      tint: 0,
      fade: 0,
      grain: 4,
      vignette: 6,
      sharpness: 8,
      highlight: -8,
      shadow: 8,
    },
  },
  {
    id: 'blackWhiteClassic',
    name: 'BlackWhite Classic',
    description:
      'Classic black and white photography look with strong luminance contrast, rich midtones and subtle film-like grain.',
    params: {
      exposure: 0,
      contrast: 22,
      saturation: -30,
      temperature: 0,
      tint: 0,
      fade: 6,
      grain: 14,
      vignette: 10,
      sharpness: 6,
      highlight: -12,
      shadow: 12,
    },
  },
];

