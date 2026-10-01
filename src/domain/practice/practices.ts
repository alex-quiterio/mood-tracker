/** Guided pauses: counted breathing, and a focus timer that ends with a bell. */

export type BreathPhaseKind = 'in' | 'hold' | 'out';
export type BreathPhase = { kind: BreathPhaseKind; seconds: number };

/** Names and descriptions live in the message catalogues, keyed by id. */
export type BreathPattern = { id: 'calm' | 'box' | 'relax'; phases: BreathPhase[] };

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'calm',
    phases: [
      { kind: 'in', seconds: 4 },
      { kind: 'out', seconds: 6 },
    ],
  },
  {
    id: 'box',
    phases: [
      { kind: 'in', seconds: 4 },
      { kind: 'hold', seconds: 4 },
      { kind: 'out', seconds: 4 },
      { kind: 'hold', seconds: 4 },
    ],
  },
  {
    id: 'relax',
    phases: [
      { kind: 'in', seconds: 4 },
      { kind: 'hold', seconds: 7 },
      { kind: 'out', seconds: 8 },
    ],
  },
];

export const BREATH_COUNTS = [5, 10, 21] as const;

export const breathSeconds = (pattern: BreathPattern) =>
  pattern.phases.reduce((sum, p) => sum + p.seconds, 0);

export const breathSessionSeconds = (pattern: BreathPattern, breaths: number) =>
  breathSeconds(pattern) * breaths;

export type BreathPosition = {
  /** 1-based breath number. */
  breath: number;
  phaseIndex: number;
  phase: BreathPhase;
  /** Seconds into the current phase. */
  phaseElapsed: number;
  done: boolean;
};

/** Where a counted-breath session is after `elapsed` seconds. */
export function breathPositionAt(pattern: BreathPattern, breaths: number, elapsed: number): BreathPosition {
  const cycle = breathSeconds(pattern);
  const total = cycle * breaths;
  if (elapsed >= total) {
    const last = pattern.phases.length - 1;
    return {
      breath: breaths,
      phaseIndex: last,
      phase: pattern.phases[last],
      phaseElapsed: pattern.phases[last].seconds,
      done: true,
    };
  }
  const t = Math.max(0, elapsed);
  let inCycle = t % cycle;
  let phaseIndex = 0;
  while (inCycle >= pattern.phases[phaseIndex].seconds) {
    inCycle -= pattern.phases[phaseIndex].seconds;
    phaseIndex++;
  }
  return {
    breath: Math.floor(t / cycle) + 1,
    phaseIndex,
    phase: pattern.phases[phaseIndex],
    phaseElapsed: inCycle,
    done: false,
  };
}

export const FOCUS_MINUTES = [1, 3, 5, 10] as const;

/** Names and hints live in the message catalogues, keyed by id. */
export type FocusObject = { id: 'candle' | 'dot' | 'object' };

export const FOCUS_OBJECTS: FocusObject[] = [{ id: 'candle' }, { id: 'dot' }, { id: 'object' }];

/** 0:45 · 4:05 · 10:00 */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
