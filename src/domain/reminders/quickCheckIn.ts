import type { Entry, Mood, Slot } from '@domain/checkins/types';

/**
 * Mood buttons on the reminder notification. Android shows at most three actions,
 * so they span the scale: low, okay, good. Tapping one logs that mood without a note.
 */
export const QUICK_MOODS = [1, 3, 5] as const satisfies readonly Mood[];
export type QuickMood = (typeof QUICK_MOODS)[number];

/** Marks a notification as a check-in reminder, and carries its slot in `data.slot`. */
export const REMINDER_KIND = 'reminder';
/** No ":" or "-" in category ids (an expo-notifications rule). */
export const REMINDER_CATEGORY = 'checkInReminder';

export const quickActionId = (mood: QuickMood) => `mood${mood}`;

/** The mood behind an action button id, or null for anything else (e.g. a plain tap). */
export function parseQuickAction(actionId: string): QuickMood | null {
  return QUICK_MOODS.find((mood) => quickActionId(mood) === actionId) ?? null;
}

/**
 * The entry a quick check-in saves. An existing check-in keeps its note, habits,
 * sleep and signals; only the mood and the time change.
 */
export function quickEntry(
  existing: Entry | undefined,
  date: string,
  slot: Slot,
  mood: QuickMood,
  now: Date,
): Entry {
  return { ...existing, date, slot, mood, recordedAt: now.toISOString() };
}
