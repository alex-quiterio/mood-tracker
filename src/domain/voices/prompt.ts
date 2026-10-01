import { weekdayShort } from '@domain/shared/dates';
import { WeeklyStats, formatAverage } from '@domain/checkins/stats';
import { SLOTS } from '@domain/checkins/types';
import { Habit } from '@domain/habits/habits';
import { checkInPoints } from '@domain/habits/balance';
import {
  formatEuros,
  habitWeek,
  promptHabitText,
  promptHabitWeek,
  totalSavings,
} from '@domain/habits/insights';

import { VOICES, Voice } from './voices';

/**
 * Plain-text prompt for the Claude app: the week's entries plus a request for patterns
 * and one suggestion, framed by the voice. The data itself is always on the plain 1–5 scale.
 */
export function buildReflectionPrompt(
  stats: WeeklyStats,
  voice: Pick<Voice, 'claude'> = VOICES.plain,
  /** Habit data is sensitive: only included when the user turned it on. */
  habits: Habit[] | null = null,
): string {
  const first = stats.days[0].date;
  const last = stats.days[stats.days.length - 1].date;

  const dayLines = stats.days.map((day) => {
    const slotLines = SLOTS.map((slot) => {
      const e = day.entries[slot];
      if (!e) return `  ${slot}: not logged`;
      const unlocks = e.unlocks === undefined ? '' : `, ${e.unlocks} phone unlocks since previous check-in`;
      const steps = e.steps === undefined ? '' : `, ${e.steps} steps since previous check-in`;
      const habitText = habits && e.habits ? `; habits: ${promptHabitText(e.habits, habits)}` : '';
      return `  ${slot}: ${e.mood}/5${unlocks}${steps}${e.note ? ` — "${e.note}"` : ''}${habitText}`;
    });
    return [`${weekdayShort(day.date)} ${day.date}`, ...slotLines].join('\n');
  });

  const hasUnlocks = stats.unlockAverage !== null;
  const hasSteps = stats.stepAverage !== null;
  const logs = habits ? stats.days.flatMap((d) => SLOTS.flatMap((s) => d.entries[s]?.habits ?? [])) : [];
  const hasHabits = habits !== null && logs.length > 0;
  const balance = logs.reduce(
    (sum, log) => {
      const p = checkInPoints(log, habits ?? []);
      return { light: sum.light + p.light, heavy: sum.heavy + p.heavy };
    },
    { light: 0, heavy: 0 },
  );
  const averages = SLOTS.map((s) => `${s} ${formatAverage(stats.slotAverages[s])}`).join(', ');

  const signals =
    (hasUnlocks ? 'how often I unlocked my phone, ' : '') +
    (hasSteps ? 'how much I walked, ' : '') +
    (hasHabits ? 'my habits and what I did instead, ' : '');
  const ask = voice.claude.ask.replace('{signals}', signals);

  return [
    ...(voice.claude.intro ? [voice.claude.intro, ''] : []),
    `Here are my mood check-ins for the past week (${first} to ${last}).`,
    'Mood is on a 1–5 scale (1 = very low, 5 = very good). I check in up to three times a day: morning, afternoon and evening.',
    '',
    ...dayLines,
    '',
    `Logged ${stats.logged} of ${stats.possible} possible check-ins.`,
    `Averages: ${averages}; overall ${formatAverage(stats.overallAverage)}.`,
    ...(hasUnlocks ? [`Average phone unlocks between check-ins: ${Math.round(stats.unlockAverage!)}.`] : []),
    ...(hasSteps ? [`Average steps between check-ins: ${Math.round(stats.stepAverage!)}.`] : []),
    ...(hasHabits ? habitSummary(stats, habits!, balance) : []),
    '',
    ask,
  ].join('\n');
}

/** The week's habits for Claude: per-habit wins, moods with and without, savings, and what helped. */
function habitSummary(
  stats: WeeklyStats,
  habits: Habit[],
  balance: { light: number; heavy: number },
): string[] {
  const entries = stats.days.flatMap((d) => SLOTS.flatMap((s) => d.entries[s] ?? []));
  const today = stats.days[stats.days.length - 1].date;
  const lines = habitWeek(entries, habits, today)
    .filter((w) => w.logged > 0)
    .map((w) => {
      const moods =
        w.moodWithNone !== null && w.moodWithSome !== null
          ? ` (mood with none ${w.moodWithNone.toFixed(1)}, with some ${w.moodWithSome.toFixed(1)})`
          : '';
      return `- ${promptHabitWeek(w)}${moods}`;
    });
  const saved = totalSavings(entries, habits);
  const instead = entries.flatMap((e) => (e.habits?.instead ? [`"${e.habits.instead}"`] : []));
  return [
    '',
    'Habits this week (I log them with each check-in; "about" means from memory):',
    ...lines,
    `Balance: ${balance.light} light points (good habits, zeros, doing something else instead) vs ${balance.heavy} heavy points (doses).`,
    ...(saved > 0 ? [`Money kept by having less than usual: ${formatEuros(saved)}.`] : []),
    ...(instead.length ? [`What I did instead: ${instead.join(', ')}.`] : []),
    'I want to grow good feedback loops, not shame. Please notice which good habits or "instead" choices went with better moods, and suggest one small swap for next week.',
  ];
}
