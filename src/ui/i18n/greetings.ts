import { Slot } from '@domain/checkins/types';
import { isStreak } from '@domain/checkins/moments';
import { Locale } from '@domain/settings/language';

import { messages } from './messages';

const GREETING_EMOJI: Record<Slot, string> = { morning: '☀️', afternoon: '🌤️', evening: '🌙' };

export const greetingFor = (slot: Slot, locale: Locale = 'en') => ({
  text: messages(locale).greetings[slot],
  emoji: GREETING_EMOJI[slot],
});

/** "Good morning, Alex" or just "Good morning". */
export const greetingText = (slot: Slot, name: string, locale: Locale = 'en') =>
  `${messages(locale).greetings[slot]}${name ? `, ${name}` : ''}`;

/** "🔥 4-day streak", or null before it's a streak. */
export const streakLabel = (days: number, locale: Locale = 'en'): string | null =>
  isStreak(days) ? messages(locale).streak(days) : null;
