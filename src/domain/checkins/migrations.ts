import { Entry } from './types';

/**
 * 1.2.0 read the raw step sensor, which only counts while an app listens to it,
 * so every step count it saved is a bogus 0. Drops those counts, keeping the rest.
 */
export function dropBrokenStepCounts(entries: Entry[]): Entry[] {
  return entries.map((e) => {
    if (e.steps === undefined) return e;
    const { steps: _steps, stepsFrom: _stepsFrom, ...rest } = e;
    return rest;
  });
}
