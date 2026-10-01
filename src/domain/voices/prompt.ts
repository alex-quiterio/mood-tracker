import { WeeklyStats, formatAverage } from '@domain/checkins/stats';
import { SLOTS } from '@domain/checkins/types';
import { checkInPoints } from '@domain/habits/balance';
import { Habit } from '@domain/habits/habits';
import {
  formatEuros,
  habitWeek,
  promptHabitText,
  promptHabitWeek,
  totalSavings,
} from '@domain/habits/insights';
import { formatDecimal, weekdayShort } from '@domain/i18n/format';
import { Locale } from '@domain/i18n/locale';
import { messages } from '@domain/i18n/messages';

import { VOICES, Voice } from './voices';

/**
 * Plain-text prompt for the Claude app: the week's entries plus a request for patterns
 * and one suggestion, framed by the voice and written in the app's language (Claude
 * answers in kind). The data itself is always on the plain 1–5 scale.
 */
export function buildReflectionPrompt(
  stats: WeeklyStats,
  voice: Pick<Voice, 'claude'> = VOICES.plain,
  /** Habit data is sensitive: only included when the user turned it on. */
  habits: Habit[] | null = null,
  locale: Locale = 'en',
): string {
  const m = messages(locale);
  const p = m.prompt;
  const slotName = (slot: (typeof SLOTS)[number]) => m.slots[slot].toLowerCase();
  const first = stats.days[0].date;
  const last = stats.days[stats.days.length - 1].date;

  const dayLines = stats.days.map((day) => {
    const slotLines = SLOTS.map((slot) => {
      const e = day.entries[slot];
      if (!e) return `  ${slotName(slot)}: ${p.notLogged}`;
      const unlocks = e.unlocks === undefined ? '' : p.unlocks(e.unlocks);
      const steps = e.steps === undefined ? '' : p.steps(e.steps);
      const habitText = habits && e.habits ? p.habits(promptHabitText(e.habits, habits, locale)) : '';
      return `  ${slotName(slot)}: ${e.mood}/5${unlocks}${steps}${e.note ? ` — "${e.note}"` : ''}${habitText}`;
    });
    return [`${weekdayShort(day.date, locale)} ${day.date}`, ...slotLines].join('\n');
  });

  const hasUnlocks = stats.unlockAverage !== null;
  const hasSteps = stats.stepAverage !== null;
  const logs = habits ? stats.days.flatMap((d) => SLOTS.flatMap((s) => d.entries[s]?.habits ?? [])) : [];
  const hasHabits = habits !== null && logs.length > 0;
  const balance = logs.reduce(
    (sum, log) => {
      const points = checkInPoints(log, habits ?? []);
      return { light: sum.light + points.light, heavy: sum.heavy + points.heavy };
    },
    { light: 0, heavy: 0 },
  );
  const averages = SLOTS.map((s) => `${slotName(s)} ${formatAverage(stats.slotAverages[s], locale)}`).join(
    ', ',
  );

  const signals =
    (hasUnlocks ? p.signalUnlocks : '') + (hasSteps ? p.signalSteps : '') + (hasHabits ? p.signalHabits : '');
  const ask = voice.claude.ask.replace('{signals}', signals);

  return [
    ...(voice.claude.intro ? [voice.claude.intro, ''] : []),
    p.intro(first, last),
    p.scale,
    '',
    ...dayLines,
    '',
    p.logged(stats.logged, stats.possible),
    p.averages(averages, formatAverage(stats.overallAverage, locale)),
    ...(hasUnlocks ? [p.averageUnlocks(Math.round(stats.unlockAverage!))] : []),
    ...(hasSteps ? [p.averageSteps(Math.round(stats.stepAverage!))] : []),
    ...(hasHabits ? habitSummary(stats, habits!, balance, locale) : []),
    '',
    ask,
    ...(p.answerIn ? [p.answerIn] : []),
  ].join('\n');
}

/** The week's habits for Claude: per-habit wins, moods with and without, savings, and what helped. */
function habitSummary(
  stats: WeeklyStats,
  habits: Habit[],
  balance: { light: number; heavy: number },
  locale: Locale,
): string[] {
  const p = messages(locale).prompt;
  const entries = stats.days.flatMap((d) => SLOTS.flatMap((s) => d.entries[s] ?? []));
  const today = stats.days[stats.days.length - 1].date;
  const lines = habitWeek(entries, habits, today)
    .filter((w) => w.logged > 0)
    .map((w) => {
      const moods =
        w.moodWithNone !== null && w.moodWithSome !== null
          ? p.habitMoods(formatDecimal(w.moodWithNone, 1, locale), formatDecimal(w.moodWithSome, 1, locale))
          : '';
      return `- ${promptHabitWeek(w, locale)}${moods}`;
    });
  const saved = totalSavings(entries, habits);
  const instead = entries.flatMap((e) => (e.habits?.instead ? [`"${e.habits.instead}"`] : []));
  return [
    '',
    p.habitsTitle,
    ...lines,
    p.balance(balance.light, balance.heavy),
    ...(saved > 0 ? [p.saved(formatEuros(saved, locale))] : []),
    ...(instead.length ? [p.instead(instead.join(', '))] : []),
    p.loops,
  ];
}
