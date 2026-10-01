import { Locale } from '@domain/i18n/locale';
import { messages } from '@domain/i18n/messages';
import { Voice } from '@domain/voices/voices';

import { Mood, Slot } from './types';

const GREETING_EMOJI: Record<Slot, string> = { morning: '☀️', afternoon: '🌤️', evening: '🌙' };

export const greetingFor = (slot: Slot, locale: Locale = 'en') => ({
  text: messages(locale).greetings[slot],
  emoji: GREETING_EMOJI[slot],
});

/** "Good morning, Alex" or just "Good morning". */
export const greetingText = (slot: Slot, name: string, locale: Locale = 'en') =>
  `${messages(locale).greetings[slot]}${name ? `, ${name}` : ''}`;

/** Shown from two days on; a single day isn't a streak yet. */
export function streakLabel(days: number, locale: Locale = 'en'): string | null {
  return days >= 2 ? messages(locale).streak(days) : null;
}

/**
 * Emojis for the burst after saving. Good moods get a celebration, an okay mood a
 * little sparkle, and low moods none: confetti would feel wrong there, so they
 * get the breathing offer instead.
 */
export function burstEmojis(
  voice: Pick<Voice, 'moodEmoji' | 'burst'>,
  mood: Mood,
  habitWin = false,
): string[] {
  const sprout = habitWin ? ['🌱'] : [];
  if (mood >= 4) return [voice.moodEmoji[mood], ...voice.burst.high, ...sprout];
  if (mood === 3) return [...voice.burst.mid, ...sprout];
  // A low mood gets no celebration, but a habit win on a hard day still earns a quiet sprout.
  return sprout;
}

export const offersBreathing = (mood: Mood) => mood <= 2;
