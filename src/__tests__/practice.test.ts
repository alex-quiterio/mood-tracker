import { describe, expect, it } from '@jest/globals';

import {
  BREATH_COUNTS,
  BREATH_PATTERNS,
  FOCUS_MINUTES,
  breathPositionAt,
  breathSeconds,
  breathSessionSeconds,
  formatClock,
} from '@domain/practice/practices';

const [calm, box, relax] = BREATH_PATTERNS;

describe('breath patterns', () => {
  it('have the advertised rhythms', () => {
    expect(breathSeconds(calm)).toBe(10);
    expect(breathSeconds(box)).toBe(16);
    expect(breathSeconds(relax)).toBe(19);
    expect(box.phases.map((p) => p.kind)).toEqual(['in', 'hold', 'out', 'hold']);
  });

  it('always start with an in-breath and include an out-breath', () => {
    for (const p of BREATH_PATTERNS) {
      expect(p.phases[0].kind).toBe('in');
      expect(p.phases.some((ph) => ph.kind === 'out')).toBe(true);
    }
  });

  it('size sessions by breaths', () => {
    expect(breathSessionSeconds(calm, 10)).toBe(100);
    expect(BREATH_COUNTS).toEqual([5, 10, 21]);
  });
});

describe('breath position', () => {
  it('walks through phases and counts breaths', () => {
    expect(breathPositionAt(calm, 10, 0)).toMatchObject({
      breath: 1,
      phaseIndex: 0,
      phaseElapsed: 0,
      done: false,
    });
    expect(breathPositionAt(calm, 10, 3.5)).toMatchObject({ breath: 1, phase: { kind: 'in' } });
    expect(breathPositionAt(calm, 10, 4)).toMatchObject({
      breath: 1,
      phase: { kind: 'out' },
      phaseElapsed: 0,
    });
    expect(breathPositionAt(calm, 10, 10)).toMatchObject({ breath: 2, phase: { kind: 'in' } });
    expect(breathPositionAt(box, 5, 9)).toMatchObject({ breath: 1, phaseIndex: 2, phaseElapsed: 1 });
  });

  it('finishes after the last breath', () => {
    expect(breathPositionAt(calm, 3, 29.9)).toMatchObject({ breath: 3, done: false });
    expect(breathPositionAt(calm, 3, 30)).toMatchObject({ breath: 3, done: true });
    expect(breathPositionAt(calm, 3, 999).done).toBe(true);
  });

  it('treats negative time as the start', () => {
    expect(breathPositionAt(relax, 5, -2)).toMatchObject({ breath: 1, phaseIndex: 0 });
  });
});

describe('focus timer', () => {
  it('offers short to longer sessions', () => {
    expect(FOCUS_MINUTES).toEqual([1, 3, 5, 10]);
  });

  it('formats the time left, rounding up', () => {
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(245)).toBe('4:05');
    expect(formatClock(44.2)).toBe('0:45');
    expect(formatClock(-3)).toBe('0:00');
  });
});
