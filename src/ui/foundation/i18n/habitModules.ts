import type { DataSource, ModuleId } from '@domain/habitModules/modules';
import type { Finding } from '@domain/habitModules/triggerEcology/analysis';
import { type TriggerKey, triggerParts } from '@domain/habitModules/triggerEcology/triggers';
import type { Locale } from '@domain/settings/language';

import { formatDecimal, weekdayName } from './format';
import { messages } from './messages';

/** A trigger in words: a feeling, a place or body state from the urge flow, or a short night. */
export function triggerLabel(key: TriggerKey, locale: Locale = 'en'): string {
  const m = messages(locale);
  const t = triggerParts(key);
  switch (t.source) {
    case 'feeling':
      return m.urge.feelings[t.id];
    case 'context':
      return m.urge.contexts[t.id];
    case 'sleep':
      return m.triggerEcology.shortNight;
  }
}

/** Module names joined for the line under a habit: "Trigger ecology · Other". */
export const moduleNames = (ids: ModuleId[], locale: Locale = 'en') =>
  ids.map((id) => messages(locale).modules.names[id]).join(' · ');

/** Data sources in a sentence: "sleep, steps and urges". */
export function dataList(sources: DataSource[], locale: Locale = 'en'): string {
  const names = sources.map((s) => messages(locale).modules.dataSources[s]);
  const and = locale === 'en' ? ' and ' : ' e ';
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')}${and}${names.at(-1)}`;
}

/** A weekday from the domain's Monday-first index (0 = Monday … 6 = Sunday). */
export const weekdayFromMonday = (index: number, locale: Locale = 'en') =>
  weekdayName((index + 1) % 7, locale);

/** A key finding of Trigger ecology in one sentence. */
export function describeFinding(f: Finding, locale: Locale = 'en'): string {
  const m = messages(locale);
  const t = m.triggerEcology;
  const amount = (x: number) => formatDecimal(Math.abs(x), 1, locale);
  switch (f.kind) {
    case 'trigger': {
      const points = Math.round(Math.abs(f.difference) * 100);
      const name = triggerLabel(f.key, locale);
      return f.difference > 0 ? t.triggerPassedMore(name, points) : t.triggerPassedLess(name, points);
    }
    case 'urgeDays':
      return f.difference > 0 ? t.urgeDaysMore(amount(f.difference)) : t.urgeDaysFewer(amount(f.difference));
    case 'after': {
      const measure = { mood: t.moodRow, nextMood: t.nextMoodRow, sleep: t.sleepRow }[f.which];
      const by = f.which === 'sleep' ? m.sleep.hours(amount(f.difference)) : amount(f.difference);
      return f.difference > 0 ? t.afterHigher(measure, by) : t.afterLower(measure, by);
    }
    case 'link': {
      const signal = { sleep: t.sleepLink, steps: t.stepsLink, mood: t.moodLink }[f.which];
      const rho = formatDecimal(f.rho, 2, locale);
      return f.rho > 0 ? t.linkUp(signal, rho) : t.linkDown(signal, rho);
    }
  }
}
