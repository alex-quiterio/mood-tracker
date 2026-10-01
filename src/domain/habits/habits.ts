import { Locale } from '@domain/i18n/locale';
import { messages } from '@domain/i18n/messages';

/**
 * Habits logged with each check-in. Ones to reduce are counted in doses (possibly
 * roughly); ones to grow are ticked. The aim is a good feedback loop: a zero, a
 * habit grown, or a note on what you did instead all count as wins.
 */

export type HabitKind = 'reduce' | 'grow';

/** A choice within a habit to grow, e.g. which activity you spent time on. */
export type HabitOption = { id: string; label: string; emoji: string };

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  kind: HabitKind;
  /** Plural unit for doses, e.g. "cigarettes". Only for habits to reduce. */
  unit: string;
  /** Hidden from new check-ins but kept so history stays labelled. */
  archived?: boolean;
  /** What one dose costs, in euros. Habits to reduce only. */
  pricePerDose?: number;
  /** How many a day you usually had before. Savings count against this. */
  usualPerDay?: number;
  /** Habits to grow can offer choices; doing the habit means picking at least one. */
  options?: HabitOption[];
  /**
   * Balance points: per dose for habits to reduce (heavy), per check-in done for
   * habits to grow (light). Defaults to 1 and 2.
   */
  weight?: number;
};

export const weightOf = (h: Habit) => h.weight ?? (h.kind === 'reduce' ? 1 : 2);

/**
 * Default prices are Dutch averages for 2026, editable per habit:
 * - a pack of 20 cigarettes is about €11.10, so €0.55 each;
 * - coffeeshop weed is about €10–16 a gram and a joint about 0.3–0.4 g, so €5;
 * - a 25 cl pils is about €3.35 in a bar and less at home, so €3.
 */
export const PRESET_HABITS: Habit[] = [
  {
    id: 'cigarettes',
    name: 'Cigarettes',
    emoji: '🚬',
    kind: 'reduce',
    unit: 'cigarettes',
    pricePerDose: 0.55,
    weight: 1,
  },
  { id: 'weed', name: 'Weed', emoji: '🌿', kind: 'reduce', unit: 'joints', pricePerDose: 5, weight: 2 },
  { id: 'drinks', name: 'Drinks', emoji: '🍺', kind: 'reduce', unit: 'drinks', pricePerDose: 3, weight: 2 },
  { id: 'water', name: 'Water', emoji: '💧', kind: 'grow', unit: '', weight: 1 },
  { id: 'walk', name: 'Walk', emoji: '🚶', kind: 'grow', unit: '', weight: 2 },
  { id: 'friend', name: 'Connect with a friend', emoji: '🤝', kind: 'grow', unit: '', weight: 3 },
  {
    id: 'making',
    name: 'Time doing something',
    emoji: '🛠️',
    kind: 'grow',
    unit: '',
    weight: 2,
    options: [
      { id: 'cooking', label: 'Cooking', emoji: '🍳' },
      { id: 'cleaning', label: 'Cleaning', emoji: '🧹' },
      { id: 'carpentry', label: 'Carpentry', emoji: '🪚' },
      { id: 'laundry', label: 'Laundry', emoji: '🧺' },
      { id: 'drawing', label: 'Drawing', emoji: '✏️' },
      { id: 'painting', label: 'Painting', emoji: '🎨' },
      { id: 'dancing', label: 'Dancing', emoji: '💃' },
      { id: 'music', label: 'Listening to music', emoji: '🎧' },
    ],
  },
];

export const MAX_DOSES = 99;
export const INSTEAD_MAX_LENGTH = 200;
export const HABIT_NAME_MAX_LENGTH = 24;

export type Dose = { count: number; /** Logged from memory, not exact. */ approx?: boolean };

/** What one check-in records about habits. Absent habits weren't logged (not the same as zero). */
export type HabitLog = {
  doses: Record<string, Dose>;
  /** Habits to grow that were done. */
  did: string[];
  /** For habits with options: which ones, e.g. { making: ['cooking', 'drawing'] }. */
  chosen?: Record<string, string[]>;
  /** The good pattern: what you did instead. */
  instead?: string;
};

export const activeHabits = (habits: Habit[], kind?: HabitKind) =>
  habits.filter((h) => !h.archived && (kind === undefined || h.kind === kind));

export const isEmptyLog = (log: HabitLog | undefined) =>
  !log || (Object.keys(log.doses).length === 0 && log.did.length === 0 && !log.instead);

/** A win worth celebrating: a zero, a good habit done, or a note on what you did instead. */
export const isWin = (log: HabitLog | undefined) =>
  !!log &&
  (Object.values(log.doses).some((d) => d.count === 0) || log.did.length > 0 || !!log.instead?.trim());

export const EMPTY_LOG: HabitLog = { doses: {}, did: [] };

/** Picks or unpicks an option; the habit counts as done while any option is picked. */
export function toggleOption(log: HabitLog, habitId: string, optionId: string): HabitLog {
  const current = log.chosen?.[habitId] ?? [];
  const next = current.includes(optionId) ? current.filter((o) => o !== optionId) : [...current, optionId];
  const chosen = { ...log.chosen, [habitId]: next };
  if (next.length === 0) delete chosen[habitId];
  const did = next.length > 0 ? [...new Set([...log.did, habitId])] : log.did.filter((id) => id !== habitId);
  return { ...log, did, chosen };
}

/** The log with empty parts removed, or undefined when nothing was logged. */
export function cleanLog(log: HabitLog): HabitLog | undefined {
  const instead = log.instead?.trim().slice(0, INSTEAD_MAX_LENGTH);
  const cleaned: HabitLog = { doses: log.doses, did: [...new Set(log.did)] };
  const chosen: Record<string, string[]> = {};
  for (const [id, opts] of Object.entries(log.chosen ?? {})) {
    if (opts.length > 0 && cleaned.did.includes(id)) chosen[id] = [...new Set(opts)];
  }
  if (Object.keys(chosen).length > 0) cleaned.chosen = chosen;
  if (instead) cleaned.instead = instead;
  return isEmptyLog(cleaned) ? undefined : cleaned;
}

export const sameLog = (a: HabitLog | undefined, b: HabitLog | undefined) =>
  JSON.stringify(a ? cleanLog(a) : undefined) === JSON.stringify(b ? cleanLog(b) : undefined);

/** A stored habit log: undefined when it's empty, null when it isn't valid. */
export function parseHabitLog(value: unknown): HabitLog | undefined | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.doses !== 'object' || v.doses === null || Array.isArray(v.doses)) return null;
  const doses: Record<string, Dose> = {};
  for (const [id, d] of Object.entries(v.doses as Record<string, unknown>)) {
    const dose = d as Partial<Dose> | null;
    if (!dose || !Number.isInteger(dose.count) || dose.count! < 0 || dose.count! > MAX_DOSES) return null;
    if (dose.approx !== undefined && typeof dose.approx !== 'boolean') return null;
    doses[id] = dose.approx ? { count: dose.count!, approx: true } : { count: dose.count! };
  }
  if (!Array.isArray(v.did) || v.did.some((id) => typeof id !== 'string')) return null;
  if (v.instead !== undefined && typeof v.instead !== 'string') return null;
  const chosen = v.chosen;
  if (
    chosen !== undefined &&
    (typeof chosen !== 'object' ||
      chosen === null ||
      Object.values(chosen).some((o) => !Array.isArray(o) || o.some((x) => typeof x !== 'string')))
  )
    return null;
  return cleanLog({
    doses,
    did: v.did as string[],
    chosen: chosen as Record<string, string[]> | undefined,
    instead: v.instead as string | undefined,
  });
}

/** Stored habit definitions; presets when nothing (valid) is stored. */
export function parseHabits(value: unknown): Habit[] {
  if (!Array.isArray(value)) return PRESET_HABITS;
  const habits = value.filter(
    (h): h is Habit =>
      typeof h?.id === 'string' &&
      h.id !== '' &&
      typeof h.name === 'string' &&
      typeof h.emoji === 'string' &&
      (h.kind === 'reduce' || h.kind === 'grow') &&
      typeof h.unit === 'string' &&
      (h.archived === undefined || typeof h.archived === 'boolean') &&
      (h.pricePerDose === undefined || (typeof h.pricePerDose === 'number' && h.pricePerDose >= 0)) &&
      (h.usualPerDay === undefined || (typeof h.usualPerDay === 'number' && h.usualPerDay >= 0)) &&
      (h.weight === undefined || (typeof h.weight === 'number' && h.weight >= 0)) &&
      (h.options === undefined ||
        (Array.isArray(h.options) &&
          h.options.every(
            (o: HabitOption) =>
              typeof o?.id === 'string' && typeof o.label === 'string' && typeof o.emoji === 'string',
          ))),
  );
  const unique = habits.filter((h, i) => habits.findIndex((x) => x.id === h.id) === i);
  return unique.length > 0 ? unique : PRESET_HABITS;
}

/** Adds habits from a backup that aren't known yet; existing definitions win. */
export const mergeHabits = (mine: Habit[], incoming: Habit[]) => [
  ...mine,
  ...incoming.filter((h) => !mine.some((m) => m.id === h.id)),
];

/** A new custom habit with an id that doesn't clash. */
export function createHabit(existing: Habit[], name: string, emoji: string, kind: HabitKind): Habit {
  const clean = name.trim().slice(0, HABIT_NAME_MAX_LENGTH);
  const base =
    clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'habit';
  let id = base;
  for (let n = 2; existing.some((h) => h.id === id); n++) id = `${base}-${n}`;
  return {
    id,
    name: clean,
    emoji: emoji.trim() || (kind === 'reduce' ? '•' : '✓'),
    kind,
    unit: kind === 'reduce' ? clean.toLowerCase() : '',
  };
}

/** Changes one habit, keeping the rest of the list as it is. */
export const updateHabit = (habits: Habit[], id: string, patch: Partial<Omit<Habit, 'id'>>): Habit[] =>
  habits.map((h) => (h.id === id ? { ...h, ...patch } : h));

export const OPTION_LABEL_MAX_LENGTH = 24;

/** Adds an option to a habit to grow, with an id that doesn't clash. */
export function addOption(habit: Habit, label: string, emoji: string): Habit {
  const clean = label.trim().slice(0, OPTION_LABEL_MAX_LENGTH);
  if (!clean) return habit;
  const options = habit.options ?? [];
  const base =
    clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'option';
  let id = base;
  for (let n = 2; options.some((o) => o.id === id); n++) id = `${base}-${n}`;
  return { ...habit, options: [...options, { id, label: clean, emoji: emoji.trim() || '•' }] };
}

/** Removes an option; past check-ins keep it in their log. */
export const removeOption = (habit: Habit, optionId: string): Habit => ({
  ...habit,
  options: (habit.options ?? []).filter((o) => o.id !== optionId),
});

/** Parses a price typed in the settings ("0,55" or "0.55"); undefined clears it. */
export function parsePrice(text: string): number | undefined {
  const n = Number(text.replace(',', '.').replace(/[^\d.]/g, ''));
  return text.trim() === '' || !Number.isFinite(n) ? undefined : Math.round(n * 100) / 100;
}

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
