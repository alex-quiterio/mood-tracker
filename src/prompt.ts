import { weekdayShort } from './dates';
import { WeeklyStats, formatAverage } from './stats';
import { SLOTS } from './types';
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
      return `  ${slot}: ${e.mood}/5${unlocks}${e.note ? ` — "${e.note}"` : ''}`;
    });
    return [`${weekdayShort(day.date)} ${day.date}`, ...slotLines].join('\n');
  });

  const hasUnlocks = stats.unlockAverage !== null;
  const averages = SLOTS.map((s) => `${s} ${formatAverage(stats.slotAverages[s])}`).join(', ');

  const ask = voice.claude.ask.replace('{unlocks}', hasUnlocks ? 'how often I unlocked my phone, ' : '');

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
    '',
    ask,
  ].join('\n');
}
