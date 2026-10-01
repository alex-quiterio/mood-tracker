import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseEntry } from '@domain/checkins/entries';
import { dropBrokenStepCounts } from '@domain/checkins/migrations';
import { Entry } from '@domain/checkins/types';

const ENTRIES_KEY = 'mood-tracker:entries:v1';
const STEPS_V2_MIGRATION_KEY = 'mood-tracker:migration:steps-v2';

export async function loadEntries(): Promise<Entry[]> {
  const raw = await AsyncStorage.getItem(ENTRIES_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(parseEntry).filter((e): e is Entry => e !== null);
}

export async function saveEntries(entries: Entry[]): Promise<void> {
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

/** One-time fixes to stored entries, each run once per install. */
export async function migrateEntries(entries: Entry[]): Promise<Entry[]> {
  if (await AsyncStorage.getItem(STEPS_V2_MIGRATION_KEY)) return entries;
  const fixed = dropBrokenStepCounts(entries);
  await saveEntries(fixed);
  await AsyncStorage.setItem(STEPS_V2_MIGRATION_KEY, new Date().toISOString());
  return fixed;
}
