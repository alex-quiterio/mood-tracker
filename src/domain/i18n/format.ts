import { parseLocalDate } from '@domain/shared/dates';

import { Locale } from './locale';

/**
 * Locale-aware formatting without relying on the JS engine's Intl data, which
 * varies between Android builds.
 */

const decimalSep = (locale: Locale) => (locale === 'pt-PT' ? ',' : '.');
// European Portuguese groups thousands with a (narrow) space.
const groupSep = (locale: Locale) => (locale === 'pt-PT' ? ' ' : ',');

/** 3.5 → "3.5" · "3,5" */
export const formatDecimal = (n: number, digits: number, locale: Locale) =>
  n.toFixed(digits).replace('.', decimalSep(locale));

/** 12480 → "12,480" · "12 480" */
export const formatInteger = (n: number, locale: Locale) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, groupSep(locale));

/** €8.25 · 8,25 €; whole euros from €100, and no ".00". */
export function formatEuros(amount: number, locale: Locale = 'en'): string {
  const value =
    amount >= 100 ? formatInteger(amount, locale) : formatDecimal(amount, 2, locale).replace(/[.,]00$/, '');
  return locale === 'pt-PT' ? `${value} €` : `€${value}`;
}

const WEEKDAYS: Record<Locale, string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'pt-PT': ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
};
const WEEKDAYS_LONG: Record<Locale, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'pt-PT': [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
  ],
};
/** Monday first, for the calendar header. */
const WEEKDAY_INITIALS: Record<Locale, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  'pt-PT': ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
};
const MONTHS: Record<Locale, string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  'pt-PT': [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
};

export const weekdayShort = (date: string, locale: Locale = 'en') =>
  WEEKDAYS[locale][parseLocalDate(date).getDay()];

export const weekdayInitials = (locale: Locale) => WEEKDAY_INITIALS[locale];

/** "October 2026" · "Outubro de 2026" */
export function monthTitle(year: number, month: number, locale: Locale): string {
  const name = MONTHS[locale][month];
  return locale === 'pt-PT' ? `${name[0].toUpperCase()}${name.slice(1)} de ${year}` : `${name} ${year}`;
}

/** "Thursday, 1 October" · "quinta-feira, 1 de outubro" */
export function longDate(date: string, locale: Locale): string {
  const d = parseLocalDate(date);
  const day = WEEKDAYS_LONG[locale][d.getDay()];
  const month = MONTHS[locale][d.getMonth()];
  return locale === 'pt-PT' ? `${day}, ${d.getDate()} de ${month}` : `${day}, ${d.getDate()} ${month}`;
}
