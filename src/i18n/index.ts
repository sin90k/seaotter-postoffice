export const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'th', 'vi', 'id', 'ms'] as const;

export type LocaleCode = typeof SUPPORTED_LOCALES[number];

export const normalizeLocale = (value?: string): LocaleCode => {
  const code = String(value || 'en').toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(code) ? code as LocaleCode : 'en';
};

export const localeMeta: Record<LocaleCode, { htmlLang: string; nativeName: string; aiLanguage: string }> = {
  en: { htmlLang: 'en', nativeName: 'English', aiLanguage: 'English' },
  zh: { htmlLang: 'zh-CN', nativeName: '简体中文', aiLanguage: 'Simplified Chinese' },
  ja: { htmlLang: 'ja', nativeName: '日本語', aiLanguage: 'Japanese' },
  ko: { htmlLang: 'ko', nativeName: '한국어', aiLanguage: 'Korean' },
  fr: { htmlLang: 'fr', nativeName: 'Français', aiLanguage: 'French' },
  de: { htmlLang: 'de', nativeName: 'Deutsch', aiLanguage: 'German' },
  es: { htmlLang: 'es', nativeName: 'Español', aiLanguage: 'Spanish' },
  it: { htmlLang: 'it', nativeName: 'Italiano', aiLanguage: 'Italian' },
  th: { htmlLang: 'th', nativeName: 'ไทย', aiLanguage: 'Thai' },
  vi: { htmlLang: 'vi', nativeName: 'Tiếng Việt', aiLanguage: 'Vietnamese' },
  id: { htmlLang: 'id', nativeName: 'Bahasa Indonesia', aiLanguage: 'Indonesian' },
  ms: { htmlLang: 'ms', nativeName: 'Bahasa Melayu', aiLanguage: 'Malay' },
};

export const localeTypographyClass = (locale: LocaleCode) =>
  ['zh', 'ja', 'ko'].includes(locale) ? 'locale-cjk' : ['th'].includes(locale) ? 'locale-thai' : 'locale-latin';

export const pickLocale = <T>(locale: string, values: Partial<Record<LocaleCode, T>>, fallback: T): T =>
  values[normalizeLocale(locale)] ?? values.en ?? fallback;

