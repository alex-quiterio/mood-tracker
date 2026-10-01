import { MOOD_EMOJI, Mood, Slot } from './types';

const GREETINGS: Record<Slot, { text: string; emoji: string }> = {
  morning: { text: 'Good morning', emoji: '☀️' },
  afternoon: { text: 'Good afternoon', emoji: '🌤️' },
  evening: { text: 'Good evening', emoji: '🌙' },
};

export const greetingFor = (slot: Slot) => GREETINGS[slot];

/** Shown from two days on; a single day isn't a streak yet. */
export function streakLabel(days: number): string | null {
  return days >= 2 ? `🔥 ${days}-day streak` : null;
}

/**
 * Emojis for the burst after saving. Good moods get a celebration, an okay mood a
 * little sparkle, and low moods none: confetti would feel wrong there, so they
 * get the breathing offer instead.
 */
export function burstEmojis(mood: Mood): string[] {
  if (mood === 5) return [MOOD_EMOJI[5], '✨', '🎉', '💛'];
  if (mood === 4) return [MOOD_EMOJI[4], '✨', '🌼'];
  if (mood === 3) return ['✨', '🌱'];
  return [];
}

export const offersBreathing = (mood: Mood) => mood <= 2;
