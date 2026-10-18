import AsyncStorage from '@react-native-async-storage/async-storage';

import { CapturedDay, parseCapturedDays } from '@domain/signals/dailyUnlocks';

const DAILY_UNLOCKS_KEY = 'mood-tracker:daily-unlocks:v1';

/** Days whose unlocks were read whole from the phone, kept apart from the check-in entries. */
export async function loadCapturedDays(): Promise<CapturedDay[]> {
  const raw = await AsyncStorage.getItem(DAILY_UNLOCKS_KEY);
  return parseCapturedDays(raw ? JSON.parse(raw) : []);
}

export async function saveCapturedDays(days: CapturedDay[]): Promise<void> {
  await AsyncStorage.setItem(DAILY_UNLOCKS_KEY, JSON.stringify(days));
}
