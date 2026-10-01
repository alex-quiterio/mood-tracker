import { weekdayShort } from '@domain/shared/dates';
import { WeeklyStats, formatAverage } from '@domain/checkins/stats';
import { SLOTS } from '@domain/checkins/types';
import { VOICES, Voice } from './voices';

/**
 * Plain-text prompt for the Claude app: the week's entries plus a request for patterns
 * and one suggestion, framed by the voice. The data itself is always on the plain 1–5 scale.
 */
export function buildReflectionPrompt(
  stats: WeeklyStats,
  voice: Pick<Voice, 'claude'> = VOICES.plain,
): string {
  const first = stats.days[0].date;
  const last = stats.days[stats.days.length - 1].date;

  const dayLines = stats.days.map((day) => {
    const slotLines = SLOTS.map((slot) => {
      const e = day.entries[slot];
      if (!e) return `  ${slot}: not logged`;
      const unlocks = e.unlocks === undefined ? '' : `, ${e.unlocks} phone unlocks since previous check-in`;
      const steps = e.steps === undefined ? '' : `, ${e.steps} steps since previous check-in`;
      return `  ${slot}: ${e.mood}/5${unlocks}${steps}${e.note ? ` — "${e.note}"` : ''}`;
    });
    return [`${weekdayShort(day.date)} ${day.date}`, ...slotLines].join('\n');
  });

  const hasUnlocks = stats.unlockAverage !== null;
  const hasSteps = stats.stepAverage !== null;
  const averages = SLOTS.map((s) => `${s} ${formatAverage(stats.slotAverages[s])}`).join(', ');

  const signals =
    (hasUnlocks ? 'how often I unlocked my phone, ' : '') + (hasSteps ? 'how much I walked, ' : '');
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
    '',
    ask,
  ].join('\n');
}
