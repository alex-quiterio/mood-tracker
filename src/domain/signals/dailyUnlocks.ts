import { addDays, isValidDate, localDate, parseLocalDate } from '@domain/shared/dates';
import { Entry } from '@domain/checkins/types';

/** A day's unlocks read straight from the phone, midnight to midnight. */
export type CapturedDay = { date: string; unlocks: number };

/**
 * One day in the daily unlock series. `estimated` days are worked out from the
 * check-in windows; the others were read for the whole day. Only `complete` days,
 * covered from midnight to midnight, go into averages.
 */
export type DayUnlocks = { date: string; unlocks: number; estimated: boolean; complete: boolean };

/** A check-in's unlock window, with the time it really ended. */
export type UnlockWindow = { entry: Entry; start: number; end: number; unlocks: number };

/** A zero on a day with more steps than this means the count was missed, not that the phone stayed locked. */
export const ACTIVE_DAY_STEPS = 1000;

/** Gaps this short between windows (the moment between saving a check-in and moving the checkpoint) still count as covered. */
const COVERAGE_SLACK_MS = 5 * 60 * 1000;

/** Local midnight to the next local midnight; 23 or 25 hours long on DST days. */
export function dayBounds(date: string): { start: number; end: number } {
  const noon = parseLocalDate(date);
  const start = new Date(noon.getFullYear(), noon.getMonth(), noon.getDate()).getTime();
  const end = new Date(noon.getFullYear(), noon.getMonth(), noon.getDate() + 1).getTime();
  return { start, end };
}

const stepsByDate = (entries: Entry[]) => {
  const totals = new Map<string, number>();
  for (const e of entries) if (e.steps !== undefined) totals.set(e.date, (totals.get(e.date) ?? 0) + e.steps);
  return totals;
};

const isMissedZero = (unlocks: number, date: string, steps: Map<string, number>) =>
  unlocks === 0 && (steps.get(date) ?? 0) > ACTIVE_DAY_STEPS;

/**
 * The unlock windows the check-ins cover. A window ends where the next one starts,
 * because saving a check-in moves the checkpoint the next one counts from. Its
 * `recordedAt` is only an upper bound: before 1.12.1 every edit moved it, which
 * made early windows look hours longer and overlap the next ones (that is how
 * 2026-10-01's morning, 81 seconds long, came to look like a six-hour zero).
 * Zeros on active days are left out as missing.
 */
export function unlockWindows(entries: Entry[]): UnlockWindow[] {
  const steps = stepsByDate(entries);
  const counted = entries
    .flatMap((entry) => {
      if (entry.unlocks === undefined || !entry.unlocksFrom) return [];
      const start = Date.parse(entry.unlocksFrom);
      const recorded = Date.parse(entry.recordedAt);
      return Number.isNaN(start) || Number.isNaN(recorded) ? [] : [{ entry, start, recorded }];
    })
    .sort((a, b) => a.start - b.start);
  return counted.flatMap(({ entry, start, recorded }, i) => {
    const next = counted.slice(i + 1).find((w) => w.start > start);
    const end = Math.min(recorded, next ? next.start : Infinity);
    if (end <= start || isMissedZero(entry.unlocks!, entry.date, steps)) return [];
    return [{ entry, start, end, unlocks: entry.unlocks! }];
  });
}

/**
 * Unlocks and covered time inside [from, to). Where windows overlap, each stretch
 * of time is counted once, from the shortest window covering it (the most precise
 * one). Within a window unlocks are spread evenly, so a window across midnight is
 * split between the two days by time.
 */
export function countIn(
  windows: UnlockWindow[],
  from: number,
  to: number,
): { unlocks: number; coveredMs: number } {
  const inside = windows.filter((w) => w.end > from && w.start < to);
  const edges = [
    ...new Set([from, to, ...inside.flatMap((w) => [w.start, w.end]).filter((t) => t > from && t < to)]),
  ].sort((a, b) => a - b);
  let unlocks = 0;
  let coveredMs = 0;
  for (let i = 0; i < edges.length - 1; i++) {
    const [a, b] = [edges[i], edges[i + 1]];
    const covering = inside.filter((w) => w.start <= a && w.end >= b);
    if (!covering.length) continue;
    const w = covering.reduce((best, x) => (x.end - x.start < best.end - best.start ? x : best));
    unlocks += (w.unlocks * (b - a)) / (w.end - w.start);
    coveredMs += b - a;
  }
  return { unlocks, coveredMs };
}

/**
 * The daily unlock series: days read whole from the phone, and for the rest an
 * estimate from the check-in windows. A captured zero on an active day is treated
 * as missing and falls back to the estimate. Days still under way are left out.
 */
export function dailyUnlocks(
  entries: Entry[],
  captured: CapturedDay[],
  now: Date = new Date(),
): DayUnlocks[] {
  const steps = stepsByDate(entries);
  const windows = unlockWindows(entries);
  const today = localDate(now);
  const whole = new Map(
    captured.filter((d) => !isMissedZero(d.unlocks, d.date, steps)).map((d) => [d.date, d.unlocks]),
  );
  const dates = new Set([...whole.keys(), ...windows.flatMap((w) => datesBetween(w.start, w.end))]);
  return [...dates]
    .filter((date) => date < today)
    .sort()
    .flatMap((date): DayUnlocks[] => {
      const read = whole.get(date);
      if (read !== undefined) return [{ date, unlocks: read, estimated: false, complete: true }];
      const { start, end } = dayBounds(date);
      const { unlocks, coveredMs } = countIn(windows, start, end);
      if (coveredMs === 0) return [];
      const complete = end - start - coveredMs <= COVERAGE_SLACK_MS;
      return [{ date, unlocks: Math.round(unlocks), estimated: true, complete }];
    });
}

function datesBetween(start: number, end: number): string[] {
  const dates: string[] = [];
  for (let d = localDate(new Date(start)); d <= localDate(new Date(end - 1)); d = addDays(d, 1))
    dates.push(d);
  return dates;
}

/**
 * The finished days the phone can still be asked about, newest first, that
 * haven't been read yet. Only days that started within `maxWindowMs`, since
 * older usage events may already be gone.
 */
export function daysToCapture(captured: CapturedDay[], now: Date, maxWindowMs: number): string[] {
  const have = new Set(captured.map((d) => d.date));
  const days: string[] = [];
  for (
    let d = addDays(localDate(now), -1);
    dayBounds(d).start >= now.getTime() - maxWindowMs;
    d = addDays(d, -1)
  ) {
    if (!have.has(d)) days.push(d);
  }
  return days;
}

/** Adds newly read days; a day already read keeps its first value. */
export const mergeCapturedDays = (existing: CapturedDay[], incoming: CapturedDay[]): CapturedDay[] => {
  const byDate = new Map(existing.map((d) => [d.date, d]));
  for (const d of incoming) if (!byDate.has(d.date)) byDate.set(d.date, d);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
};

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;

/** Stored or imported captured days; anything malformed is dropped. */
export function parseCapturedDays(raw: unknown): CapturedDay[] {
  if (!Array.isArray(raw)) return [];
  const days = raw.flatMap((d): CapturedDay[] =>
    d && isValidDate(d.date) && isCount(d.unlocks) ? [{ date: d.date, unlocks: d.unlocks }] : [],
  );
  return mergeCapturedDays([], days);
}

/** The days in an exported series that were read whole; estimates are worked out again from the entries. */
export const capturedFromSeries = (raw: unknown): CapturedDay[] =>
  parseCapturedDays(Array.isArray(raw) ? raw.filter((d) => d && d.estimated === false) : []);
