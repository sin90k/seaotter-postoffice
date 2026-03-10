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

export interface TravelFilterPreset {
  id: TravelFilterId;
  name: string;
  /** 人类可读的风格描述，用于动态推断调色参数。可在后台自由编辑。 */
  description: string;
}

/** 默认滤镜预设（仅描述，不包含任何具体数值参数） */
export const defaultTravelFilters: TravelFilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Keep the photo as it is, with no stylistic adjustments.',
  },
  {
    id: 'filmTravel',
    name: 'Film Travel',
    description:
      'Soft film travel look with gentle contrast, slightly faded colors and visible grain, suitable for documentary-style travel postcards.',
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    description:
      'Instant camera style with warm tones, low contrast, slight fade and noticeable film grain, like a casual snapshot from a vintage Polaroid.',
  },
  {
    id: 'summerBright',
    name: 'Summer Bright',
    description:
      'Bright, high-key summer look with crisp highlights, slightly increased saturation and a clean, sunny atmosphere for beaches and blue skies.',
  },
  {
    id: 'goldenSunset',
    name: 'Golden Sunset',
    description:
      'Warm golden-hour look with strong warm tones, soft contrast and gentle glow in the highlights, ideal for sunsets and evening cityscapes.',
  },
  {
    id: 'tokyoNight',
    name: 'Tokyo Night',
    description:
      'High-contrast neon night style with cool shadows, deep blacks and vivid accent colors, inspired by modern Asian city nightlife.',
  },
  {
    id: 'nordicCool',
    name: 'Nordic Cool',
    description:
      'Clean, cool-toned look with low saturation, soft highlights and slightly lifted shadows, evoking minimal Scandinavian landscapes.',
  },
  {
    id: 'vintageEurope',
    name: 'Vintage Europe',
    description:
      'Muted vintage postcard look with slightly yellowish tones, low saturation, soft contrast and subtle vignetting for old European towns.',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description:
      'Modern cinematic grading with deep contrast, rich midtones, slightly teal shadows and warm highlights, creating a dramatic movie-like feel.',
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description:
      'Soft dreamy look with reduced contrast, pastel colors, gentle bloom in highlights and a light, hazy atmosphere.',
  },
  {
    id: 'vividLandscape',
    name: 'Vivid Landscape',
    description:
      'Vibrant landscape look with noticeably increased saturation, clear micro-contrast and crisp details in foliage, sky and water.',
  },
  {
    id: 'blackWhiteClassic',
    name: 'BlackWhite Classic',
    description:
      'Classic black and white photography look with strong luminance contrast, rich midtones and subtle film-like grain.',
  },
];

