import { SHORT_NIGHT_HOURS } from '@domain/checkins/sleep';
import type { Entry } from '@domain/checkins/types';
import {
  URGE_CONTEXTS,
  URGE_FEELINGS,
  type Urge,
  type UrgeContext,
  type UrgeFeeling,
} from '@domain/habits/urges';

/**
 * A trigger is something that came with an urge: a feeling named in the urge flow,
 * the place, company or body state picked there, or a short night before it.
 */
export type TriggerKey = `feeling:${UrgeFeeling}` | `context:${UrgeContext}` | 'sleep:shortNight';

export const TRIGGER_GROUPS = ['emotional', 'environmental', 'physiological'] as const;
export type TriggerGroup = (typeof TRIGGER_GROUPS)[number];

const PHYSIOLOGICAL: readonly TriggerKey[] = [
  'feeling:tiredness',
  'context:hungry',
  'context:inPain',
  'sleep:shortNight',
];

export const TRIGGER_KEYS: readonly TriggerKey[] = [
  ...URGE_FEELINGS.map((f) => `feeling:${f}` as const),
  ...URGE_CONTEXTS.map((c) => `context:${c}` as const),
  'sleep:shortNight',
];

export const isTriggerKey = (v: unknown): v is TriggerKey => TRIGGER_KEYS.includes(v as TriggerKey);

/** Feelings are emotional, places and company environmental, and the body physiological. */
export function groupOf(key: TriggerKey): TriggerGroup {
  if (PHYSIOLOGICAL.includes(key)) return 'physiological';
  return key.startsWith('feeling:') ? 'emotional' : 'environmental';
}

/** What a trigger key is made of, for the words. */
export type TriggerParts =
  | { source: 'feeling'; id: UrgeFeeling }
  | { source: 'context'; id: UrgeContext }
  | { source: 'sleep'; id: 'shortNight' };

export const triggerParts = (key: TriggerKey): TriggerParts => {
  const [source, id] = key.split(':');
  return { source, id } as TriggerParts;
};

/** Days that followed a night shorter than SHORT_NIGHT_HOURS. */
export const shortNights = (entries: Entry[]): Set<string> =>
  new Set(
    entries
      .filter((e) => e.sleep?.hours !== undefined && e.sleep.hours < SHORT_NIGHT_HOURS)
      .map((e) => e.date),
  );

/** Every trigger that came with an urge. */
export function triggersOf(urge: Urge, short: Set<string>): TriggerKey[] {
  return [
    ...(urge.feelings ?? []).map((f) => `feeling:${f}` as const),
    ...(urge.context ?? []).map((c) => `context:${c}` as const),
    ...(short.has(urge.date) ? (['sleep:shortNight'] as const) : []),
  ];
}
