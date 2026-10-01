import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseEntry } from './entries';
import { THEMES, ThemeName } from './theme';
import { Entry } from './types';

const ENTRIES_KEY = 'mood-tracker:entries:v1';
const SETTINGS_KEY = 'mood-tracker:settings:v1';

export type Settings = {
  remindersEnabled: boolean;
  theme: ThemeName;
};

export const DEFAULT_SETTINGS: Settings = { remindersEnabled: false, theme: 'light' };

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
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
