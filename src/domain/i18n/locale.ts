/** The languages the app speaks. Portuguese is European Portuguese. */
export const LOCALES = ['en', 'pt-PT'] as const;
export type Locale = (typeof LOCALES)[number];

/** The language setting: follow the phone, or a fixed language. */
export type LanguageSetting = 'system' | Locale;
export const LANGUAGE_SETTINGS: LanguageSetting[] = ['system', 'en', 'pt-PT'];

/** Maps a device language tag to a supported locale: any Portuguese becomes pt-PT, anything else English. */
export function resolveLocale(tag: string | null | undefined): Locale {
  return tag?.toLowerCase().startsWith('pt') ? 'pt-PT' : 'en';
}

export const localeFor = (setting: LanguageSetting, deviceTag: string | null | undefined): Locale =>
  setting === 'system' ? resolveLocale(deviceTag) : setting;
