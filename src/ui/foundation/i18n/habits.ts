import { Habit, HabitKind, HabitLog, PRESET_HABITS, rangeOf, weightOf } from '@domain/habits/habits';
import { HabitWeek } from '@domain/habits/insights';
import { UrgeFeeling } from '@domain/habits/urges';
import { Locale } from '@domain/settings/language';

import { messages } from './messages';

/**
 * A habit in the user's language. Presets you haven't renamed take the locale's
 * name, unit and option labels; anything you've changed keeps your wording.
 */
export function localizeHabit(habit: Habit, locale: Locale): Habit {
  const preset = PRESET_HABITS.find((p) => p.id === habit.id);
  if (!preset) return habit;
  const m = messages(locale);
  const text = m.presets[habit.id];
  return {
    ...habit,
    name: habit.name === preset.name && text ? text.name : habit.name,
    unit: habit.unit === preset.unit && text ? text.unit : habit.unit,
    options: habit.options?.map((o) => {
      const original = preset.options?.find((p) => p.id === o.id);
      return original && o.label === original.label && m.presetOptions[o.id]
        ? { ...o, label: m.presetOptions[o.id] }
        : o;
    }),
  };
}

export const localizeHabits = (habits: Habit[], locale: Locale) =>
  habits.map((h) => localizeHabit(h, locale));

/**
 * Wording that depends on a habit's kind. Each is a `Record` over every kind, so a
 * new kind in the domain is a type error here until it has its words.
 */
const byKind = <T>(habit: Habit, words: Record<HabitKind, () => T>): T => words[habit.kind]();

/** One line per habit for a week, phrased around what went right. */
export function describeHabitWeek(w: HabitWeek, locale: Locale = 'en'): string {
  const { habit } = w;
  const m = messages(locale).habits;
  if (w.logged === 0) return m.notLoggedThisWeek(habit.emoji, habit.name);
  return byKind(habit, {
    grow: () => m.growWeek(habit.emoji, habit.name, w.wins, w.logged),
    reduce: () => m.reduceWeek(habit.emoji, w.wins, w.logged, w.total, habit.unit),
    balance: () => m.balanceWeek(habit.emoji, habit.name, w.wins, w.logged),
  });
}

/** One habit's week for the Claude prompt, in plain words. */
export function promptHabitWeek(w: HabitWeek, locale: Locale = 'en'): string {
  const { habit } = w;
  const m = messages(locale).prompt;
  const { min, max } = rangeOf(habit);
  return byKind(habit, {
    grow: () => m.habitGrow(habit.name, w.wins, w.logged),
    reduce: () => m.habitReduce(habit.name, w.wins, w.logged, w.total, habit.unit),
    balance: () => m.habitBalance(habit.name, w.wins, w.logged, min, max, habit.unit),
  });
}

/** Under a habit's name in Settings: its kind, points, and price or sweet spot. */
export function habitSummary(habit: Habit, locale: Locale = 'en'): string {
  const m = messages(locale).habitSettings;
  const { min, max } = rangeOf(habit);
  return byKind(habit, {
    grow: () => m.growSummary(weightOf(habit)),
    reduce: () => m.reduceSummary(weightOf(habit)) + (habit.pricePerDose ? ` · €${habit.pricePerDose}` : ''),
    balance: () => m.balanceSummary(min, max, weightOf(habit)),
  });
}

/** What the points stepper in Settings means for this habit. */
export const pointsLabel = (habit: Habit, locale: Locale = 'en') =>
  messages(locale).habitSettings.points[habit.kind];

/** The caption of a habit's month total: what its winning days are. */
export function monthCaption(habit: Habit, total: number, locale: Locale = 'en'): string {
  const t = messages(locale).monthTotals;
  const { min, max } = rangeOf(habit);
  return byKind(habit, {
    grow: () => t.grow(habit.name.toLowerCase()),
    reduce: () => t.reduce(habit.name.toLowerCase(), total, habit.unit),
    balance: () => t.balance(min, max, total, habit.unit),
  });
}

/** Habit lines for the Claude prompt. */
export function promptHabitText(log: HabitLog | undefined, habits: Habit[], locale: Locale = 'en'): string {
  if (!log) return '';
  const m = messages(locale).prompt;
  const byId = new Map(habits.map((h) => [h.id, h]));
  const parts = Object.entries(log.doses).map(
    ([id, d]) => `${d.approx ? m.about : ''}${d.count} ${byId.get(id)?.unit ?? id}`,
  );
  const did = log.did.map((id) => {
    const habit = byId.get(id);
    const picked = log.chosen?.[id]?.map(
      (o) => habit?.options?.find((x) => x.id === o)?.label.toLowerCase() ?? o,
    );
    const name = habit?.name.toLowerCase() ?? id;
    return picked?.length ? `${name} (${picked.join(', ')})` : name;
  });
  if (did.length) parts.push(m.did(did.join(', ')));
  if (log.instead) parts.push(m.insteadNote(log.instead));
  return parts.join('; ');
}

/** Feelings with how often they came, e.g. "boredom ×3, fear"; lower case to sit inside a sentence. */
export function describeFeelings(counts: { feeling: UrgeFeeling; count: number }[], locale: Locale): string {
  const names = messages(locale).urge.feelings;
  return counts
    .map(({ feeling, count }) => `${names[feeling].toLowerCase()}${count > 1 ? ` ×${count}` : ''}`)
    .join(', ');
}
