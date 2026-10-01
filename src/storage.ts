import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseEntry } from './entries';
import { THEMES, ThemeName } from './theme';
import { Entry } from './types';

const ENTRIES_KEY = 'mood-tracker:entries:v1';
const SETTINGS_KEY = 'mood-tracker:settings:v1';
const UNLOCK_CHECKPOINT_KEY = 'mood-tracker:unlock-checkpoint:v1';

export type Settings = {
  remindersEnabled: boolean;
  theme: ThemeName;
  trackUnlocks: boolean;
};

export const DEFAULT_SETTINGS: Settings = { remindersEnabled: false, theme: 'light', trackUnlocks: false };

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

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  const stored: Partial<Settings> = raw ? JSON.parse(raw) : {};
  return {
    remindersEnabled: stored.remindersEnabled === true,
    theme: THEMES.includes(stored.theme as ThemeName) ? (stored.theme as ThemeName) : DEFAULT_SETTINGS.theme,
    trackUnlocks: stored.trackUnlocks === true,
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** When unlocks were last counted up to; the next live check-in counts from here. */
export async function loadUnlockCheckpoint(): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(UNLOCK_CHECKPOINT_KEY);
  return raw && !Number.isNaN(Date.parse(raw)) ? new Date(raw) : null;
}

export async function saveUnlockCheckpoint(at: Date): Promise<void> {
  await AsyncStorage.setItem(UNLOCK_CHECKPOINT_KEY, at.toISOString());
}
