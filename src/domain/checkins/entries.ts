import { parseHabitLog } from '@domain/habits/habits';
import { isValidDate } from '@domain/shared/dates';
import { parseSleep } from './sleep';
import { Entry, MOODS, Mood, SLOTS, Slot } from './types';

/** Room for a few paragraphs. Was 280 up to 1.9.0; longer limits never cut older notes. */
export const NOTE_MAX_LENGTH = 2000;

export const entryKey = (date: string, slot: Slot) => `${date}|${slot}`;

/** When an entry last changed: its latest edit, or when it was first saved. */
export const lastChangedAt = (e: Entry): string => e.updatedAt ?? e.recordedAt;

/**
 * The times a save stamps on an entry. A new check-in is recorded now; saving an
 * existing one keeps when it was first recorded and marks it updated now.
 */
export function saveTimes(previous: Entry | undefined, now: Date): Pick<Entry, 'recordedAt' | 'updatedAt'> {
  const at = now.toISOString();
  return previous ? { recordedAt: previous.recordedAt, updatedAt: at } : { recordedAt: at };
}

/** Saving the same date and slot again replaces the earlier entry. */
export function upsertEntry(entries: Entry[], entry: Entry): Entry[] {
  const key = entryKey(entry.date, entry.slot);
  return [...entries.filter((e) => entryKey(e.date, e.slot) !== key), entry].sort(compareEntries);
}

export function removeEntry(entries: Entry[], date: string, slot: Slot): Entry[] {
  const key = entryKey(date, slot);
  return entries.filter((e) => entryKey(e.date, e.slot) !== key);
}

/**
 * Merges imported entries into existing ones. When both sides have the same
 * date and slot, the one changed last wins, so an import never discards
 * newer data.
 */
export function mergeEntries(existing: Entry[], incoming: Entry[]): Entry[] {
  const byKey = new Map<string, Entry>();
  for (const e of [...existing, ...incoming]) {
    const key = entryKey(e.date, e.slot);
    const current = byKey.get(key);
    if (!current || lastChangedAt(e) > lastChangedAt(current)) byKey.set(key, e);
  }
  return [...byKey.values()].sort(compareEntries);
}

function compareEntries(a: Entry, b: Entry): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot);
}

/** Returns a clean Entry, or null when the value isn't a valid entry. */
export function parseEntry(value: unknown): Entry | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isValidDate(v.date)) return null;
  if (!SLOTS.includes(v.slot as Slot)) return null;
  if (!MOODS.includes(v.mood as Mood)) return null;
  if (typeof v.recordedAt !== 'string' || Number.isNaN(Date.parse(v.recordedAt))) return null;
  if (v.updatedAt !== undefined && (typeof v.updatedAt !== 'string' || Number.isNaN(Date.parse(v.updatedAt)))) {
    return null;
  }
  if (v.note !== undefined && typeof v.note !== 'string') return null;
  const unlocks = parseCount(v.unlocks, v.unlocksFrom);
  const steps = parseCount(v.steps, v.stepsFrom);
  if (unlocks === 'invalid' || steps === 'invalid') return null;
  const habits = v.habits === undefined ? undefined : parseHabitLog(v.habits);
  if (habits === null) return null;
  const sleep = v.sleep === undefined ? undefined : parseSleep(v.sleep);
  if (sleep === null) return null;

  const entry: Entry = {
    date: v.date,
    slot: v.slot as Slot,
    mood: v.mood as Mood,
    recordedAt: v.recordedAt,
  };
  if (typeof v.updatedAt === 'string') entry.updatedAt = v.updatedAt;
  const note = (v.note as string | undefined)?.trim().slice(0, NOTE_MAX_LENGTH);
  if (note) entry.note = note;
  if (unlocks) {
    entry.unlocks = unlocks.count;
    entry.unlocksFrom = unlocks.from;
  }
  if (steps) {
    entry.steps = steps.count;
    entry.stepsFrom = steps.from;
  }
  if (habits) entry.habits = habits;
  if (sleep) entry.sleep = sleep;
  return entry;
}

/** A count with the start of its window: both present and valid, both absent, or invalid. */
function parseCount(count: unknown, from: unknown): { count: number; from: string } | null | 'invalid' {
  if (count === undefined && from === undefined) return null;
  if (!Number.isInteger(count) || (count as number) < 0) return 'invalid';
  if (typeof from !== 'string' || Number.isNaN(Date.parse(from))) return 'invalid';
  return { count: count as number, from };
}
