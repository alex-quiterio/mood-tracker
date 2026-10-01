import { Messages, en } from './en';
import { Locale } from './locale';
import { pt } from './pt';

const CATALOGS: Record<Locale, Messages> = { en, 'pt-PT': pt };

/** The app's text in a locale. */
export const messages = (locale: Locale = 'en'): Messages => CATALOGS[locale];

export type { Messages } from './en';
