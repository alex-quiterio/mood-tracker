import type { Slot } from '@domain/checkins/types';
import { isValidDate, slotForTime } from '@domain/shared/dates';

import { MAX_DOSES, type HabitLog } from './habits';

/**
 * An urge to do a habit to reduce, and what happened after the pause. Letting it
 * pass is a win (light points); having one is simply noted, with no blame and no
 * points taken away. It does set a minimum for that habit's doses in the check-in
 * of the same time of day, so the count stays honest.
 */

export type UrgeOutcome = 'passed' | 'gaveIn';

export type Urge = {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  habitId: string;
  outcome: UrgeOutcome;
  /** ISO 8601 timestamp; with the habit it identifies the urge. */
  recordedAt: string;
};

/** Light points for an urge that passed: like a zero, plus the effort of the pause. */
export const URGE_POINTS = 2;

/** The pause before choosing: 12 calm breaths of 10 seconds. */
export const URGE_BREATHS = 12;

export const addUrge = (urges: Urge[], urge: Urge): Urge[] => mergeUrges(urges, [urge]);

/** Adds urges that aren't known yet, oldest first. */
export function mergeUrges(existing: Urge[], incoming: Urge[]): Urge[] {
  const byKey = new Map<string, Urge>();
  for (const u of [...existing, ...incoming]) byKey.set(`${u.recordedAt}|${u.habitId}`, u);
  return [...byKey.values()].sort((a, b) => (a.recordedAt < b.recordedAt ? -1 : 1));
}

export const passedOn = (urges: Urge[], date: string) =>
  urges.filter((u) => u.date === date && u.outcome === 'passed').length;

export function parseUrge(value: unknown): Urge | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (!isValidDate(v.date)) return null;
  if (typeof v.habitId !== 'string' || v.habitId === '') return null;
  if (v.outcome !== 'passed' && v.outcome !== 'gaveIn') return null;
  if (typeof v.recordedAt !== 'string' || Number.isNaN(Date.parse(v.recordedAt))) return null;
  return { date: v.date, habitId: v.habitId, outcome: v.outcome, recordedAt: v.recordedAt };
}

/** Stored urges; anything that isn't valid is dropped. */
export const parseUrges = (value: unknown): Urge[] =>
  Array.isArray(value) ? value.map(parseUrge).filter((u): u is Urge => u !== null) : [];

/** Doses per habit that can't be logged lower: each urge that took the best of you, in that slot. */
export function urgeFloors(urges: Urge[], date: string, slot: Slot): Record<string, number> {
  const floors: Record<string, number> = {};
  for (const u of urges) {
    if (u.date !== date || u.outcome !== 'gaveIn' || slotForTime(new Date(u.recordedAt)) !== slot) continue;
    floors[u.habitId] = Math.min(MAX_DOSES, (floors[u.habitId] ?? 0) + 1);
  }
  return floors;
}

/** Raises doses to their floors, logging habits that weren't logged yet. */
export function applyUrgeFloors(log: HabitLog, floors: Record<string, number>): HabitLog {
  const doses = { ...log.doses };
  for (const [id, floor] of Object.entries(floors)) {
    if ((doses[id]?.count ?? 0) < floor) doses[id] = { ...doses[id], count: floor };
  }
  return { ...log, doses };
}
