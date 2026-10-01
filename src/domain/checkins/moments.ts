import { Mood, Slot } from './types';
import { Voice } from '@domain/voices/voices';

const GREETINGS: Record<Slot, { text: string; emoji: string }> = {
  morning: { text: 'Good morning', emoji: '☀️' },
  afternoon: { text: 'Good afternoon', emoji: '🌤️' },
  evening: { text: 'Good evening', emoji: '🌙' },
};

export const greetingFor = (slot: Slot) => GREETINGS[slot];

/** "Good morning, Alex" or just "Good morning". */
export const greetingText = (slot: Slot, name: string) => `${GREETINGS[slot].text}${name ? `, ${name}` : ''}`;

/** Shown from two days on; a single day isn't a streak yet. */
export function streakLabel(days: number): string | null {
  return days >= 2 ? `🔥 ${days}-day streak` : null;
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
