import { describe, expect, it } from '@jest/globals';

import { MOON_PHASES, SYNODIC_MONTH, moonAt, moonOn } from '@domain/moon/phase';
import { moonA11y, moonLabel } from '@ui/foundation/i18n/moon';

describe('moon phase', () => {
  // Published times (UTC) of the main phases in January 2024.
  it('matches known new, quarter and full moons', () => {
    expect(moonAt(new Date(Date.UTC(2024, 0, 11, 11, 57))).phase).toBe('new');
    expect(moonAt(new Date(Date.UTC(2024, 0, 18, 3, 52))).phase).toBe('firstQuarter');
    expect(moonAt(new Date(Date.UTC(2024, 0, 25, 17, 54))).phase).toBe('full');
    expect(moonAt(new Date(Date.UTC(2024, 1, 2, 23, 18))).phase).toBe('lastQuarter');
  });

  it('is dark at a new moon and fully lit at a full moon', () => {
    expect(moonAt(new Date(Date.UTC(2024, 0, 11, 11, 57))).illumination).toBeLessThan(0.02);
    expect(moonAt(new Date(Date.UTC(2024, 0, 25, 17, 54))).illumination).toBeGreaterThan(0.98);
  });

  it('goes through every phase in order over a month', () => {
    const start = Date.UTC(2024, 0, 11, 11, 57);
    const seen = Array.from({ length: 30 }, (_, i) => moonAt(new Date(start + i * 86_400_000)).phase);
    expect([...new Set(seen)]).toEqual([...MOON_PHASES]);
    const age = moonAt(new Date(start + 10 * 86_400_000)).age;
    expect(age).toBeGreaterThan(9.5);
    expect(age).toBeLessThan(SYNODIC_MONTH);
  });

  it('reads a local day at noon, and says it in both languages', () => {
    const moon = moonOn('2024-01-25');
    expect(moon.phase).toBe('full');
    expect(moonLabel(moon)).toBe('🌕 Full moon');
    expect(moonLabel(moon, 'pt-PT')).toBe('🌕 Lua cheia');
    expect(moonA11y(moon)).toMatch(/^Today's moon: Full moon, \d+% lit$/);
  });
});
