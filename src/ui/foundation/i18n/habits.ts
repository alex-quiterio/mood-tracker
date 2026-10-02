import { Habit, HabitLog, PRESET_HABITS } from '@domain/habits/habits';
import { HabitWeek } from '@domain/habits/insights';
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

/** One line per habit for a week, phrased around what went right. */
export function describeHabitWeek(w: HabitWeek, locale: Locale = 'en'): string {
  const { habit } = w;
  const m = messages(locale).habits;
  if (w.logged === 0) return m.notLoggedThisWeek(habit.emoji, habit.name);
  if (habit.kind === 'grow') return m.growWeek(habit.emoji, habit.name, w.wins, w.logged);
  return m.reduceWeek(habit.emoji, w.wins, w.logged, w.total, habit.unit);
}

/** One habit's week for the Claude prompt, in plain words. */
export function promptHabitWeek(w: HabitWeek, locale: Locale = 'en'): string {
  const { habit } = w;
  const m = messages(locale).prompt;
  if (habit.kind === 'grow') return m.habitGrow(habit.name, w.wins, w.logged);
  return m.habitReduce(habit.name, w.wins, w.logged, w.total, habit.unit);
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
