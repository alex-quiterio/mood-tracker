import { MonthReview } from '@domain/checkins/monthly';
import { Entry, SLOTS } from '@domain/checkins/types';
import { Habit, countsDoses } from '@domain/habits/habits';
import { habitTotals } from '@domain/habits/insights';
import { Urge } from '@domain/habits/urges';
import { Locale } from '@domain/settings/language';
import { formatAverage, formatDecimal, weekdayName, weekdayShort } from '@ui/foundation/i18n/format';
import { promptHabitText } from '@ui/foundation/i18n/habits';
import { messages } from '@ui/foundation/i18n/messages';
import { VOICES, Voice } from '@ui/foundation/voices/voices';

import { urgeLines } from './urgeLines';

/**
 * Plain-text prompt for the Claude app covering the last 30 days: one line per day that has
 * check-ins, the patterns the app found, and a request to reflect. Habit data (what each
 * check-in logged and each habit's totals) is only included when `habits` is given (the
 * user turned it on).
 */
export function buildMonthlyPrompt(
  review: MonthReview,
  entries: Entry[],
  voice: Pick<Voice, 'claude'> = VOICES.plain,
  habits: Habit[] | null = null,
  locale: Locale = 'en',
  /** The month's urges join the habits, so they need `habits` too. */
  urges: Urge[] = [],
): string {
  const m = messages(locale);
  const p = m.prompt;
  const slotName = (slot: (typeof SLOTS)[number]) => m.slots[slot].toLowerCase();
  const avg = (n: number) => formatDecimal(n, 1, locale);
  const dayLines = review.days.flatMap((date) => {
    const day = entries.filter((e) => e.date === date);
    if (day.length === 0) return [];
    const parts = SLOTS.flatMap((slot) => {
      const e = day.find((x) => x.slot === slot);
      if (!e) return [];
      const habitText = habits && e.habits ? promptHabitText(e.habits, habits, locale) : '';
      return [
        `${slotName(slot)} ${e.mood}/5${e.note ? ` — "${e.note}"` : ''}${habitText ? p.monthCheckInHabits(habitText) : ''}`,
      ];
    });
    return [`${weekdayShort(date, locale)} ${date}: ${parts.join('; ')}`];
  });
  const first = review.days[0];
  const last = review.days[review.days.length - 1];
  const totals = habits ? habitTotals(entries, habits, first, last) : [];
  const totalLines = totals.map(({ habit, checkIns, total }) =>
    countsDoses(habit)
      ? p.monthHabitDoses(habit.name, total, habit.unit, checkIns, avg(total / checkIns))
      : p.habitGrow(habit.name, total, checkIns),
  );

  const patterns = [
    ...(review.bestWeekday
      ? [p.monthBest(weekdayName(review.bestWeekday.weekday, locale), avg(review.bestWeekday.average))]
      : []),
    ...(review.hardestWeekday
      ? [
          p.monthHardest(
            weekdayName(review.hardestWeekday.weekday, locale),
            avg(review.hardestWeekday.average),
          ),
        ]
      : []),
    ...(review.lowestSlot
      ? [p.monthLowestSlot(slotName(review.lowestSlot.slot), avg(review.lowestSlot.average))]
      : []),
    ...(habits
      ? review.habitMoods.map((h) => p.monthHabitMoods(h.habit.name.toLowerCase(), avg(h.none), avg(h.some)))
      : []),
  ];

  return [
    ...(voice.claude.intro ? [voice.claude.intro, ''] : []),
    p.monthIntro(first, last),
    p.scale,
    '',
    ...dayLines,
    '',
    p.logged(review.logged, review.possible),
    p.averages(
      SLOTS.map((s) => `${slotName(s)} ${formatAverage(review.slotAverages[s], locale)}`).join(', '),
      formatAverage(review.overallAverage, locale),
    ),
    ...(totalLines.length ? ['', p.monthHabitsTitle, ...totalLines.map((line) => `- ${line}`)] : []),
    ...(patterns.length ? ['', p.monthPatterns, ...patterns.map((line) => `- ${line}`)] : []),
    ...(habits ? urgeLines(urges, habits, first, last, locale, false) : []),
    '',
    p.monthAsk,
    ...(p.answerIn ? [p.answerIn] : []),
  ].join('\n');
}
