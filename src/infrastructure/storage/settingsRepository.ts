import AsyncStorage from '@react-native-async-storage/async-storage';

import { Settings, parseSettings } from '../../domain/settings/settings';

const SETTINGS_KEY = 'mood-tracker:settings:v1';

export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return parseSettings(raw ? JSON.parse(raw) : {});
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
