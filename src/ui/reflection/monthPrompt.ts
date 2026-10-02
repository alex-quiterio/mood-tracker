import { MonthReview } from '@domain/checkins/monthly';
import { Entry, SLOTS } from '@domain/checkins/types';
import { Habit } from '@domain/habits/habits';
import { Locale } from '@domain/settings/language';
import { formatAverage, formatDecimal, weekdayName, weekdayShort } from '@ui/i18n/format';
import { messages } from '@ui/i18n/messages';
import { VOICES, Voice } from '@ui/voices/voices';

/**
 * Plain-text prompt for the Claude app covering the last 30 days: one line per day that has
 * check-ins, the patterns the app found, and a request to reflect. Habit data is only
 * included when `habits` is given (the user turned it on).
 */
export function buildMonthlyPrompt(
  review: MonthReview,
  entries: Entry[],
  voice: Pick<Voice, 'claude'> = VOICES.plain,
  habits: Habit[] | null = null,
  locale: Locale = 'en',
): string {
  const m = messages(locale);
  const p = m.prompt;
  const slotName = (slot: (typeof SLOTS)[number]) => m.slots[slot].toLowerCase();
  const dayLines = review.days.flatMap((date) => {
    const day = entries.filter((e) => e.date === date);
    if (day.length === 0) return [];
    const parts = SLOTS.flatMap((slot) => {
      const e = day.find((x) => x.slot === slot);
      return e ? [`${slotName(slot)} ${e.mood}/5${e.note ? ` — "${e.note}"` : ''}`] : [];
    });
    return [`${weekdayShort(date, locale)} ${date}: ${parts.join('; ')}`];
  });

  const avg = (n: number) => formatDecimal(n, 1, locale);
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
    p.monthIntro(review.days[0], review.days[review.days.length - 1]),
    p.scale,
    '',
    ...dayLines,
    '',
    p.logged(review.logged, review.possible),
    p.averages(
      SLOTS.map((s) => `${slotName(s)} ${formatAverage(review.slotAverages[s], locale)}`).join(', '),
      formatAverage(review.overallAverage, locale),
    ),
    ...(patterns.length ? ['', p.monthPatterns, ...patterns.map((line) => `- ${line}`)] : []),
    '',
    p.monthAsk,
    ...(p.answerIn ? [p.answerIn] : []),
  ].join('\n');
}
