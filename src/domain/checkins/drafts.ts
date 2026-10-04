import { EMPTY_LOG, HabitLog, parseHabitLog, sameLog } from '@domain/habits/habits';

import { NOTE_MAX_LENGTH } from './entries';
import { Sleep, isEmptySleep, parseSleep, sameSleep } from './sleep';
import { Entry, MOODS, Mood } from './types';

/** A check-in being typed, kept until it is saved. Never part of the export. */
export type Draft = {
  mood: Mood | null;
  note: string;
  habits: HabitLog;
  sleep: Sleep;
};

export const draftOf = (entry: Entry | undefined): Draft => ({
  mood: entry?.mood ?? null,
  note: entry?.note ?? '',
  habits: entry?.habits ?? EMPTY_LOG,
  sleep: entry?.sleep ?? {},
});

/** Whether the draft differs from the saved check-in (or from a blank one). */
export function isDraftChanged(entry: Entry | undefined, draft: Draft, asksSleep: boolean): boolean {
  const saved = draftOf(entry);
  return (
    saved.mood !== draft.mood ||
    saved.note.trim() !== draft.note.trim() ||
    !sameLog(saved.habits, draft.habits) ||
    (asksSleep && !sameSleep(saved.sleep, draft.sleep))
  );
}

/** A stored draft, or null when it isn't valid. */
export function parseDraft(value: unknown): Draft | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.mood !== null && !MOODS.includes(v.mood as Mood)) return null;
  if (typeof v.note !== 'string') return null;
  const habits = v.habits === undefined ? undefined : parseHabitLog(v.habits);
  const sleep = v.sleep === undefined ? undefined : parseSleep(v.sleep);
  if (habits === null || sleep === null) return null;
  return {
    mood: v.mood as Mood | null,
    note: v.note.slice(0, NOTE_MAX_LENGTH),
    habits: habits ?? EMPTY_LOG,
    sleep: isEmptySleep(sleep) ? {} : sleep!,
  };
}
