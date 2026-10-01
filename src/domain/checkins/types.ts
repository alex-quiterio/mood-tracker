import type { HabitLog } from '@domain/habits/habits';

export const SLOTS = ['morning', 'afternoon', 'evening'] as const;
export type Slot = (typeof SLOTS)[number];

export type Mood = 1 | 2 | 3 | 4 | 5;
export const MOODS: readonly Mood[] = [1, 2, 3, 4, 5];

export type Entry = {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  slot: Slot;
  mood: Mood;
  note?: string;
  /** ISO 8601 timestamp of when the entry was saved. */
  recordedAt: string;
  /** Phone unlocks since the previous check-in, captured when a live check-in is first saved. */
  unlocks?: number;
  /** ISO 8601 start of the window `unlocks` covers. */
  unlocksFrom?: string;
  /** Steps since the previous check-in, from the phone's step counter. Same capture rules as `unlocks`. */
  steps?: number;
  /** ISO 8601 start of the window `steps` covers. */
  stepsFrom?: string;
  /** Habits logged with this check-in: doses since the last one, habits grown, what you did instead. */
  habits?: HabitLog;
};

export const MOOD_EMOJI: Record<Mood, string> = {
  1: '😞',
  2: '🙁',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export const MOOD_LABEL: Record<Mood, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Very good',
};

export const SLOT_LABEL: Record<Slot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};
