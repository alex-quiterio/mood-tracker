import { Entry } from '../checkins/types';
import { formatSince, formatSteps } from './format';

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * The phone signals saved with a check-in, as display lines. Shares one line when
 * both cover the same window ("📱 23 unlocks · 👟 1,240 steps since 09:12"),
 * otherwise one line each.
 */
export function describeSignals(entry: Entry): string[] {
  const parts: { text: string; since: string }[] = [];
  if (entry.unlocks !== undefined && entry.unlocksFrom) {
    parts.push({
      text: `📱 ${entry.unlocks} ${plural(entry.unlocks, 'unlock', 'unlocks')}`,
      since: formatSince(new Date(entry.unlocksFrom), entry.date),
    });
  }
  if (entry.steps !== undefined && entry.stepsFrom) {
    parts.push({
      text: `👟 ${formatSteps(entry.steps)} ${plural(entry.steps, 'step', 'steps')}`,
      since: formatSince(new Date(entry.stepsFrom), entry.date),
    });
  }
  if (parts.length === 2 && parts[0].since === parts[1].since) {
    return [`${parts[0].text} · ${parts[1].text} since ${parts[0].since}`];
  }
  return parts.map((p) => `${p.text} since ${p.since}`);
}
