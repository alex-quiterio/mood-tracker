import { en } from './locales/en';
import { Locale } from '@domain/settings/language';
import { pt } from './locales/pt';
import type { Messages } from './messages.types';

const CATALOGS: Record<Locale, Messages> = { en, 'pt-PT': pt };

/** The app's text in a locale. */
export const messages = (locale: Locale = 'en'): Messages => CATALOGS[locale];

export type { Messages } from './messages.types';
