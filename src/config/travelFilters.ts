export type TravelFilterId =
  | 'original'
  | 'summer'
  | 'film'
  | 'goldenSunset'
  | 'tropical'
  | 'cinematic'
  | 'polaroid'
  | 'vintagePostcard'
  | 'nordic'
  | 'tokyoNight'
  | 'moody'
  | 'underwaterRestore';

/** 数值滤镜参数，范围 -100 ~ +100 */
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
  description: string;
  params: TravelFilterParams;
}

/** 默认 12 个滤镜，顺序固定 */
export const defaultTravelFilters: TravelFilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Keep the photo exactly as it is with no color or lighting modification.',
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
    id: 'summer',
    name: 'Summer',
    description:
      'Enhance the photo with bright summer sunlight, vibrant colors, and warm highlights similar to a sunny vacation photo.',
    params: {
      exposure: 35,
      contrast: 35,
      saturation: 60,
      temperature: 40,
      tint: 10,
      fade: 0,
      grain: 5,
      vignette: 10,
      sharpness: 15,
      highlight: -35,
      shadow: 35,
    },
  },
  {
    id: 'film',
    name: 'Film',
    description:
      'Apply a classic travel film photography style similar to Kodak film with warm tones, strong contrast, and visible film grain.',
    params: {
      exposure: 10,
      contrast: 45,
      saturation: 30,
      temperature: 25,
      tint: 10,
      fade: 20,
      grain: 60,
      vignette: 35,
      sharpness: -5,
      highlight: -40,
      shadow: 30,
    },
  },
  {
    id: 'goldenSunset',
    name: 'Golden Sunset',
    description:
      'Apply dramatic golden sunset lighting with strong warm orange tones and glowing highlights.',
    params: {
      exposure: 20,
      contrast: 50,
      saturation: 45,
      temperature: 70,
      tint: 25,
      fade: 10,
      grain: 10,
      vignette: 20,
      sharpness: 10,
      highlight: -60,
      shadow: 40,
    },
  },
  {
    id: 'tropical',
    name: 'Tropical',
    description:
      'Enhance the photo with tropical travel colors, strong blue sky and ocean tones, and vibrant greens.',
    params: {
      exposure: 30,
      contrast: 30,
      saturation: 70,
      temperature: 20,
      tint: -5,
      fade: 0,
      grain: 0,
      vignette: 5,
      sharpness: 20,
      highlight: -25,
      shadow: 25,
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description:
      'Apply cinematic teal and orange color grading with dramatic contrast like a movie frame.',
    params: {
      exposure: -10,
      contrast: 70,
      saturation: -10,
      temperature: -20,
      tint: 35,
      fade: 15,
      grain: 40,
      vignette: 60,
      sharpness: 20,
      highlight: -70,
      shadow: 50,
    },
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    description:
      'Transform the image into a nostalgic Polaroid instant camera photo with faded colors, warm tones, and soft contrast.',
    params: {
      exposure: 25,
      contrast: -30,
      saturation: -20,
      temperature: 30,
      tint: 5,
      fade: 60,
      grain: 25,
      vignette: 15,
      sharpness: -15,
      highlight: -10,
      shadow: 35,
    },
  },
  {
    id: 'vintagePostcard',
    name: 'Vintage Postcard',
    description:
      'Create a warm, faded vintage postcard look with muted colors, gentle contrast, visible soft grain, and a subtle vignette.',
    params: {
      exposure: 10,
      contrast: -20,
      saturation: -35,
      temperature: 25,
      tint: 10,
      fade: 55,
      grain: 45,
      vignette: 30,
      sharpness: -20,
      highlight: -25,
      shadow: 20,
    },
  },
  {
    id: 'nordic',
    name: 'Nordic',
    description:
      'Apply a cool, minimalist Nordic look with clean whites, muted colors, and crisp contrast that feels calm and airy.',
    params: {
      exposure: 15,
      contrast: 40,
      saturation: -30,
      temperature: -40,
      tint: -10,
      fade: 10,
      grain: 15,
      vignette: 15,
      sharpness: 15,
      highlight: -15,
      shadow: 20,
    },
  },
  {
    id: 'tokyoNight',
    name: 'Shanghai Night',
    description:
      'Turn the scene into a neon Shanghai riverfront night with deep shadows, warm reflections, and punchy highlights from skyline lights.',
    params: {
      exposure: -20,
      contrast: 60,
      saturation: 22,
      temperature: -30,
      tint: 25,
      fade: 2,
      grain: 40,
      vignette: 45,
      sharpness: 24,
      highlight: -70,
      shadow: 32,
    },
  },
  {
    id: 'moody',
    name: 'Moody',
    description:
      'Create a dark, moody travel look with lowered exposure, strong contrast, cool shadows, and a subtle cinematic vignette.',
    params: {
      exposure: -35,
      contrast: 55,
      saturation: -15,
      temperature: -15,
      tint: 10,
      fade: 10,
      grain: 30,
      vignette: 45,
      sharpness: 10,
      highlight: -50,
      shadow: 25,
    },
  },
  {
    id: 'underwaterRestore',
    name: 'Underwater Restore',
    description:
      'Recover underwater travel photos by reducing green and blue color cast, brightening shadows, and restoring natural skin tones and details.',
    params: {
      exposure: 25,
      contrast: 20,
      saturation: 25,
      temperature: -10,
      tint: 40,
      fade: 0,
      grain: 5,
      vignette: 5,
      sharpness: 30,
      highlight: -15,
      shadow: 45,
    },
  },
];
