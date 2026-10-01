import { isValidDate } from './dates';
import { Entry, MOODS, Mood, SLOTS, Slot } from './types';

export const NOTE_MAX_LENGTH = 280;

export const entryKey = (date: string, slot: Slot) => `${date}|${slot}`;

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
 * date and slot, the one recorded later wins, so an import never discards
 * newer data.
 */
export function mergeEntries(existing: Entry[], incoming: Entry[]): Entry[] {
  const byKey = new Map<string, Entry>();
  for (const e of [...existing, ...incoming]) {
    const key = entryKey(e.date, e.slot);
    const current = byKey.get(key);
    if (!current || e.recordedAt > current.recordedAt) byKey.set(key, e);
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
  if (v.note !== undefined && typeof v.note !== 'string') return null;
  const unlocks = parseCount(v.unlocks, v.unlocksFrom);
  const steps = parseCount(v.steps, v.stepsFrom);
  if (unlocks === 'invalid' || steps === 'invalid') return null;

  const entry: Entry = {
    date: v.date,
    slot: v.slot as Slot,
    mood: v.mood as Mood,
    recordedAt: v.recordedAt,
  };
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
  return entry;
}

/** A count with the start of its window: both present and valid, both absent, or invalid. */
function parseCount(count: unknown, from: unknown): { count: number; from: string } | null | 'invalid' {
  if (count === undefined && from === undefined) return null;
  if (!Number.isInteger(count) || (count as number) < 0) return 'invalid';
  if (typeof from !== 'string' || Number.isNaN(Date.parse(from))) return 'invalid';
  return { count: count as number, from };
}
