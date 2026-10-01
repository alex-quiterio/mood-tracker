import { isValidDate } from '@domain/shared/dates';

/**
 * An urge to do a habit to reduce, and what happened after the pause. Letting it
 * pass is a win (light points); having one is simply noted, with no blame and no
 * points taken away. Doses are still logged in the check-in, so an urge never adds one.
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
