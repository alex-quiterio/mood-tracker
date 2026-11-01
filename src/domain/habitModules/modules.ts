import type { Entry } from '@domain/checkins/types';
import type { Habit, HabitKind } from '@domain/habits/habits';
import type { Urge, UrgeContext } from '@domain/habits/urges';

/**
 * Habit modules: specialised analyses that switch on by themselves for habits whose
 * id, name or tags match one of their keywords. The core app captures observations
 * (moods, doses, urges, sleep, steps); a module only reads them and says what they
 * mean for that kind of habit. Core tracking never depends on any module.
 *
 * Adding a module:
 * 1. add its id to MODULE_IDS;
 * 2. write its definition (keywords, kinds, data, capabilities) and its analysis
 *    in its own folder here, and list it in MODULES (./registry);
 * 3. give it a view in `@ui/features/habitModules/registry` and its words in both locales.
 * Steps 2 and 3 are `Record<ModuleId, …>`, so a missing piece is a type error.
 */
export const MODULE_IDS = ['trigger-ecology'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

/** Observations a module can read. Each is something the core app already records. */
export const DATA_SOURCES = ['doses', 'moods', 'urges', 'feelings', 'context', 'sleep', 'steps'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

/** What modules can do, named once so the UI can list them in words. */
export const MODULE_CAPABILITIES = [
  'emotionalTriggers',
  'environmentalTriggers',
  'physiologicalTriggers',
  'urgesAndDoses',
  'pauses',
  'rhythm',
  'combinations',
  'beforeAfter',
  'experiments',
] as const;
export type ModuleCapability = (typeof MODULE_CAPABILITIES)[number];

export type HabitModule = {
  id: ModuleId;
  /**
   * Words that switch the module on, matched whole-word against the habit's id, name
   * and tags, ignoring case and accents, singular or plural. Multi-word keywords match
   * as a phrase. Several modules may share a keyword: all of them switch on (see
   * `keywordCollisions`), and the user can switch any of them off per habit.
   */
  keywords: readonly string[];
  /** Kinds of habit it makes sense for. */
  kinds: readonly HabitKind[];
  data: {
    /** Without these it shows what it needs instead of an analysis. */
    required: readonly DataSource[];
    /** These sharpen it; it works without them and says what's missing. */
    optional: readonly DataSource[];
  };
  capabilities: readonly ModuleCapability[];
  /** Extra things to ask while logging, only for habits this module is on for. */
  collects?: { urgeContext?: readonly UrgeContext[] };
  /**
   * The module's own saved state (e.g. experiments), kept in settings under its id.
   * Parses whatever was stored, falling back to an empty state: never throws.
   */
  parseState: (value: unknown) => unknown;
};

/** What every module is handed: the habit and the core observations, as stored. */
export type ModuleInput = {
  habit: Habit;
  entries: Entry[];
  urges: Urge[];
  /** Local date the analysis runs up to. */
  today: string;
};
