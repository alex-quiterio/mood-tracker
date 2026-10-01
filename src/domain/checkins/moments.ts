import { Mood } from './types';

export const offersBreathing = (mood: Mood) => mood <= 2;

export type Celebration = 'high' | 'mid' | 'none';

/**
 * How much to celebrate a saved check-in. Good moods get a celebration, an okay
 * mood a little sparkle, and low moods none: confetti would feel wrong there, so
 * they get the breathing offer instead. A habit win still earns a quiet sprout.
 */
export const celebrationFor = (mood: Mood): Celebration => (mood >= 4 ? 'high' : mood === 3 ? 'mid' : 'none');

/** Only shown from two days on; a single day isn't a streak yet. */
export const isStreak = (days: number) => days >= 2;
