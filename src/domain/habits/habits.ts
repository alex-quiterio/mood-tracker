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
};

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
  },
  { id: 'weed', name: 'Weed', emoji: '🌿', kind: 'reduce', unit: 'joints', pricePerDose: 5 },
  { id: 'drinks', name: 'Drinks', emoji: '🍺', kind: 'reduce', unit: 'drinks', pricePerDose: 3 },
  { id: 'water', name: 'Water', emoji: '💧', kind: 'grow', unit: '' },
  { id: 'walk', name: 'Walk', emoji: '🚶', kind: 'grow', unit: '' },
  { id: 'friend', name: 'Connect with a friend', emoji: '🤝', kind: 'grow', unit: '' },
  {
    id: 'making',
    name: 'Time doing something',
    emoji: '🛠️',
    kind: 'grow',
    unit: '',
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
