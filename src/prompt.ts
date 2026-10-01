import { weekdayShort } from './dates';
import { WeeklyStats, formatAverage } from './stats';
import { SLOTS } from './types';

/** Plain-text prompt for the Claude app: the week's entries plus a request for patterns and one suggestion. */
export function buildReflectionPrompt(stats: WeeklyStats): string {
  const first = stats.days[0].date;
  const last = stats.days[stats.days.length - 1].date;

  const dayLines = stats.days.map((day) => {
    const slotLines = SLOTS.map((slot) => {
      const e = day.entries[slot];
      if (!e) return `  ${slot}: not logged`;
      return `  ${slot}: ${e.mood}/5${e.note ? ` — "${e.note}"` : ''}`;
    });
    return [`${weekdayShort(day.date)} ${day.date}`, ...slotLines].join('\n');
  });

  const averages = SLOTS.map((s) => `${s} ${formatAverage(stats.slotAverages[s])}`).join(', ');

  return [
    `Here are my mood check-ins for the past week (${first} to ${last}).`,
    'Mood is on a 1–5 scale (1 = very low, 5 = very good). I check in up to three times a day: morning, afternoon and evening.',
    '',
    ...dayLines,
    '',
    `Logged ${stats.logged} of ${stats.possible} possible check-ins.`,
    `Averages: ${averages}; overall ${formatAverage(stats.overallAverage)}.`,
    '',
    'Please reflect on this week. What patterns do you notice (time of day, days of the week, anything in the notes)? Then suggest one small, concrete thing I could try next week. Keep it short and kind.',
  ].join('\n');
}
