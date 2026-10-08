import { uniqueId } from '@domain/shared/ids';

/**
 * Habits logged with each check-in. Ones to reduce are counted in doses (possibly
 * roughly); ones to grow are ticked; ones to balance are counted in doses too, and
 * a day's total inside their sweet spot (e.g. 1–2 coffees) is the win. The aim is a
 * good feedback loop: a zero, a habit grown, a day in the sweet spot, or a note on
 * what you did instead all count as wins.
 */

export const HABIT_KINDS = ['grow', 'reduce', 'balance'] as const;
export type HabitKind = (typeof HABIT_KINDS)[number];

/** A day's total that feels right for a habit to balance, inclusive. */
export type DoseRange = { min: number; max: number };

/** A choice within a habit to grow, e.g. which activity you spent time on. */
export type HabitOption = { id: string; label: string; emoji: string };

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  kind: HabitKind;
  /** Plural unit for doses, e.g. "cigarettes". Only for habits counted in doses (to reduce or balance). */
  unit: string;
  /** Hidden from new check-ins but kept so history stays labelled. */
  archived?: boolean;
  /** What one dose costs, in euros. Habits to reduce only. */
  pricePerDose?: number;
  /** How many a day you usually had before. Savings count against this. */
  usualPerDay?: number;
  /** The sweet spot per day of a habit to balance; DEFAULT_RANGE when unset. */
  range?: DoseRange;
  /** Habits to grow can offer choices; doing the habit means picking at least one. */
  options?: HabitOption[];
  /**
   * Balance points: per dose for habits to reduce (heavy), per check-in done for
   * habits to grow (light), per day in the sweet spot for habits to balance (light).
   * Defaults to 1, 2 and 2.
   */
  weight?: number;
};

export const DEFAULT_RANGE: DoseRange = { min: 1, max: 2 };
export const rangeOf = (h: Habit): DoseRange => h.range ?? DEFAULT_RANGE;

/** A day's total doses of a habit to balance is inside its sweet spot. */
export function inSweetSpot(h: Habit, dayTotal: number): boolean {
  const { min, max } = rangeOf(h);
  return dayTotal >= min && dayTotal <= max;
}

/**
 * What makes each kind of habit what it is, in one place. A new kind is added here
 * (and, being a `Record`, the compiler then points at every place that must handle it).
 */
type KindRule = {
  /** Logged as a number of doses (true) or ticked (false). */
  countsDoses: boolean;
  /** Balance points when the habit has no weight of its own. */
  defaultWeight: number;
  defaultEmoji: string;
  /** Whether a day's total (doses, or 1 when a ticked habit was done) is a win. */
  dayWin: (habit: Habit, dayTotal: number) => boolean;
  /** Fields a new habit of this kind starts with. */
  initial: Partial<Habit>;
};

export const KIND_RULES: Record<HabitKind, KindRule> = {
  grow: { countsDoses: false, defaultWeight: 2, defaultEmoji: '✓', dayWin: (_, n) => n > 0, initial: {} },
  reduce: { countsDoses: true, defaultWeight: 1, defaultEmoji: '•', dayWin: (_, n) => n === 0, initial: {} },
  balance: {
    countsDoses: true,
    defaultWeight: 2,
    defaultEmoji: '⚖️',
    dayWin: inSweetSpot,
    initial: { range: DEFAULT_RANGE },
  },
};

export const weightOf = (h: Habit) => h.weight ?? KIND_RULES[h.kind].defaultWeight;

/** Habits counted in doses rather than ticked. */
export const countsDoses = (h: Habit) => KIND_RULES[h.kind].countsDoses;

/** A day's total is a win for this habit: none, done, or in the sweet spot. */
export const isDayWin = (h: Habit, dayTotal: number) => KIND_RULES[h.kind].dayWin(h, dayTotal);

const isRange = (r: unknown): r is DoseRange => {
  const v = r as DoseRange | null;
  return (
    typeof v === 'object' &&
    v !== null &&
    Number.isInteger(v.min) &&
    Number.isInteger(v.max) &&
    v.min >= 0 &&
    v.min <= v.max &&
    v.max <= MAX_DOSES
  );
};

/**
 * Default prices are Dutch averages for 2026, editable per habit:
 * - a pack of 20 cigarettes is about €11.10, so €0.55 each;
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
      HABIT_KINDS.includes(h.kind) &&
      typeof h.unit === 'string' &&
      (h.archived === undefined || typeof h.archived === 'boolean') &&
      (h.pricePerDose === undefined || (typeof h.pricePerDose === 'number' && h.pricePerDose >= 0)) &&
      (h.usualPerDay === undefined || (typeof h.usualPerDay === 'number' && h.usualPerDay >= 0)) &&
      (h.weight === undefined || (typeof h.weight === 'number' && h.weight >= 0)) &&
      (h.range === undefined || isRange(h.range)) &&
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
  const id = uniqueId(
    clean,
    existing.map((h) => h.id),
    'habit',
  );
  return {
    id,
    name: clean,
    emoji: emoji.trim() || KIND_RULES[kind].defaultEmoji,
    kind,
    unit: KIND_RULES[kind].countsDoses ? clean.toLowerCase() : '',
    ...KIND_RULES[kind].initial,
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
  const id = uniqueId(
    clean,
    options.map((o) => o.id),
    'option',
  );
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
