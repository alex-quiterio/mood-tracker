import { Habit } from '@domain/habits/habits';
import { Urge, feelingsBefore } from '@domain/habits/urges';
import { Locale } from '@domain/settings/language';
import { slotForTime } from '@domain/shared/dates';
import { weekdayShort } from '@ui/foundation/i18n/format';
import { describeFeelings, localizeHabits } from '@ui/foundation/i18n/habits';
import { messages } from '@ui/foundation/i18n/messages';

/**
 * Urges between two dates for Claude: one line each (`detailed`, for a week) or just the
 * count, then what was felt before them. Empty when there were none.
 */
export function urgeLines(
  urges: Urge[],
  habits: Habit[],
  fromDate: string,
  toDate: string,
  locale: Locale,
  detailed: boolean,
): string[] {
  const m = messages(locale);
  const p = m.prompt;
  const named = localizeHabits(habits, locale);
  const inRange = urges.filter(
    (u) => u.date >= fromDate && u.date <= toDate && named.some((h) => h.id === u.habitId),
  );
  if (inRange.length === 0) return [];
  const lines = detailed
    ? inRange.map((u) =>
        p.urgeLine(
          `${weekdayShort(u.date, locale)} ${u.date}`,
          m.slots[slotForTime(new Date(u.recordedAt))].toLowerCase(),
          named.find((h) => h.id === u.habitId)!.name.toLowerCase(),
          u.outcome === 'passed',
          (u.feelings ?? []).map((f) => m.urge.feelings[f].toLowerCase()).join(', '),
        ),
      )
    : [p.urgeCount(inRange.length, inRange.filter((u) => u.outcome === 'passed').length)];
  const feelings = feelingsBefore(inRange, fromDate, toDate);
  return [
    '',
    p.urgesTitle,
    ...lines,
    ...(feelings.length ? [p.urgeFeelings(describeFeelings(feelings, locale)), p.urgeAsk] : []),
  ];
}
