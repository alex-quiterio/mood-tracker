import { parseLocalDate } from '@domain/shared/dates';

/**
 * The moon's phase, worked out from the date alone, so it needs no network. It
 * uses the mean synodic month from a known new moon; the real moon runs up to
 * about 14 hours ahead or behind that mean, which is well inside a phase.
 */
export const MOON_PHASES = [
  'new',
  'waxingCrescent',
  'firstQuarter',
  'waxingGibbous',
  'full',
  'waningGibbous',
  'lastQuarter',
  'waningCrescent',
] as const;
export type MoonPhase = (typeof MOON_PHASES)[number];

/** Days from one new moon to the next, on average. */
export const SYNODIC_MONTH = 29.530588853;
/** A new moon: 6 January 2000, 18:14 UTC. */
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

export type Moon = {
  phase: MoonPhase;
  /** Days since the last new moon, 0 to 29.5. */
  age: number;
  /** How much of the disc is lit, 0 to 1. */
  illumination: number;
};

/** The moon at an instant. */
export function moonAt(instant: Date): Moon {
  const cycles = (instant.getTime() - REFERENCE_NEW_MOON) / DAY_MS / SYNODIC_MONTH;
  const fraction = cycles - Math.floor(cycles);
  return {
    // Each phase is centred on its moment: "full" spans the days around the full moon.
    phase: MOON_PHASES[Math.round(fraction * 8) % 8],
    age: fraction * SYNODIC_MONTH,
    illumination: (1 - Math.cos(2 * Math.PI * fraction)) / 2,
  };
}

/** The moon on a local `YYYY-MM-DD` day, taken at noon. */
export const moonOn = (date: string): Moon => moonAt(parseLocalDate(date));
