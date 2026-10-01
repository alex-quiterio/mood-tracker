import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { dropBrokenStepCounts } from '@domain/checkins/migrations';
import { loadEntries, migrateEntries, saveEntries } from '@infrastructure/storage/entriesRepository';
import { Entry } from '@domain/checkins/types';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

const plain: Entry = { date: '2026-10-01', slot: 'morning', mood: 3, recordedAt: '2026-10-01T08:00:00.000Z' };
const broken: Entry = {
  ...plain,
  slot: 'afternoon',
  note: 'walked a lot',
  unlocks: 12,
  unlocksFrom: '2026-10-01T08:00:00.000Z',
  steps: 0,
  stepsFrom: '2026-10-01T08:00:00.000Z',
};

beforeEach(() => AsyncStorage.clear());

describe('steps v2 migration', () => {
  it('drops only the step fields', () => {
    expect(dropBrokenStepCounts([plain, broken])).toEqual([
      plain,
      {
        ...plain,
        slot: 'afternoon',
        note: 'walked a lot',
        unlocks: 12,
        unlocksFrom: '2026-10-01T08:00:00.000Z',
      },
    ]);
  });

  it('runs once and persists the result', async () => {
    await saveEntries([broken]);
    const fixed = await migrateEntries(await loadEntries());
    expect(fixed[0]).not.toHaveProperty('steps');
    expect(await loadEntries()).toEqual(fixed);

    // Counts saved after the fix are real and must survive later launches.
    const real = { ...plain, steps: 2480, stepsFrom: '2026-10-01T08:00:00.000Z' };
    await saveEntries([real]);
    expect(await migrateEntries(await loadEntries())).toEqual([real]);
  });
});
