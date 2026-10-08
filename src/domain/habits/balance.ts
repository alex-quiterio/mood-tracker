import { Entry } from '@domain/checkins/types';
import { addDays, weekOf, weekSoFar } from '@domain/shared/dates';

import { Habit, HabitLog, inSweetSpot, weightOf } from './habits';
import { URGE_POINTS, Urge, passedOn } from './urges';

/**
 * The balance between light and heavy. Light points: each good habit (its
 * weight, plus 1 per extra option picked, up to +2), each habit logged at zero
 * (+1), and a note on what you did instead (+2), because choosing differently is
 * the heart of the loop, and each urge that passed (+2). Heavy points: each dose
 * times its habit's weight. Habits to balance score per day, not per check-in: a
 * day whose total is in the sweet spot earns their weight in light points, and a
 * day outside it earns nothing and costs nothing.
 */
export const ZERO_POINTS = 1;
export const INSTEAD_POINTS = 2;
const MAX_OPTION_BONUS = 2;

export type Points = { light: number; heavy: number };

export function checkInPoints(log: HabitLog | undefined, habits: Habit[]): Points {
  if (!log) return { light: 0, heavy: 0 };
  // Archived habits still count, so history keeps its score.
  const byId = new Map(habits.map((h) => [h.id, h]));
  let light = 0;
  let heavy = 0;
  for (const [id, dose] of Object.entries(log.doses)) {
    const habit = byId.get(id);
    if (!habit || habit.kind === 'balance') continue;
    if (dose.count === 0) light += ZERO_POINTS;
    else heavy += dose.count * weightOf(habit);
  }
  for (const id of log.did) {
    const habit = byId.get(id);
    if (!habit) continue;
    const extra = Math.min(MAX_OPTION_BONUS, Math.max(0, (log.chosen?.[id]?.length ?? 1) - 1));
    light += weightOf(habit) + extra;
  }
  if (log.instead?.trim()) light += INSTEAD_POINTS;
  return { light, heavy };
}

/** Light points for one day's check-ins from the habits to balance whose total landed in the sweet spot. */
export function sweetSpotPoints(dayLogs: HabitLog[], habits: Habit[]): number {
  return habits
    .filter((h) => h.kind === 'balance')
    .reduce((sum, h) => {
      const doses = dayLogs.map((log) => log.doses[h.id]).filter((d) => d !== undefined);
      if (doses.length === 0) return sum;
      const total = doses.reduce((n, d) => n + d.count, 0);
      return inSweetSpot(h, total) ? sum + weightOf(h) : sum;
    }, 0);
}

export type BalanceDay = Points & { date: string; net: number; logged: boolean };

export function balanceDays(
  entries: Entry[],
  habits: Habit[],
  days: string[],
  urges: Urge[] = [],
): BalanceDay[] {
  return days.map((date) => {
    const logs = entries.filter((e) => e.date === date && e.habits);
    const points = logs.reduce(
      (sum, e) => {
        const p = checkInPoints(e.habits, habits);
        return { light: sum.light + p.light, heavy: sum.heavy + p.heavy };
      },
      { light: 0, heavy: 0 },
    );
    const passed = passedOn(urges, date);
    const light =
      points.light +
      passed * URGE_POINTS +
      sweetSpotPoints(
        logs.map((e) => e.habits!),
        habits,
      );
    return {
      date,
      light,
      heavy: points.heavy,
      net: light - points.heavy,
      logged: logs.length > 0 || passed > 0,
    };
  });
}

export type VerdictKind = 'flourishing' | 'leaningLight' | 'inBalance' | 'heavier';
export type Verdict = { kind: VerdictKind; emoji: string };

/** The week's tilt. A heavier week is worded as encouragement, not blame (see the UI). */
export function verdictFor(light: number, heavy: number): Verdict | null {
  if (light + heavy === 0) return null;
  const share = light / (light + heavy);
  if (share >= 0.75) return { kind: 'flourishing', emoji: '🌳' };
  if (share >= 0.55) return { kind: 'leaningLight', emoji: '🌱' };
  if (share >= 0.45) return { kind: 'inBalance', emoji: '⚖️' };
  return { kind: 'heavier', emoji: '🪨' };
}

export type WeekBalance = {
  days: BalanceDay[];
  light: number;
  heavy: number;
  net: number;
  /** Net balance of the week before, to compare with. */
  previousNet: number | null;
  verdict: Verdict | null;
};

export function weekBalance(
  entries: Entry[],
  habits: Habit[],
  today: string,
  urges: Urge[] = [],
): WeekBalance {
  // Monday to Sunday, compared with the same days of last week so far.
  const days = balanceDays(entries, habits, weekOf(today), urges);
  const previous = balanceDays(entries, habits, weekSoFar(addDays(today, -7)), urges);
  const light = days.reduce((s, d) => s + d.light, 0);
  const heavy = days.reduce((s, d) => s + d.heavy, 0);
  return {
    days,
    light,
    heavy,
    net: light - heavy,
    previousNet: previous.some((d) => d.logged) ? previous.reduce((s, d) => s + d.net, 0) : null,
    verdict: verdictFor(light, heavy),
  };
}

export const formatPoints = (n: number) => (n > 0 ? `+${n}` : String(n));

/** How much lighter (+) or heavier (−) this week is than the last, or null without a last week. */
export const changeFromLastWeek = (net: number, previousNet: number | null): number | null =>
  previousNet === null ? null : net - previousNet;
