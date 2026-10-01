import AsyncStorage from '@react-native-async-storage/async-storage';

import { Urge, parseUrges } from '@domain/habits/urges';

const URGES_KEY = 'mood-tracker:urges:v1';

export async function loadUrges(): Promise<Urge[]> {
  const raw = await AsyncStorage.getItem(URGES_KEY);
  return parseUrges(raw ? JSON.parse(raw) : []);
}

export async function saveUrges(urges: Urge[]): Promise<void> {
  await AsyncStorage.setItem(URGES_KEY, JSON.stringify(urges));
}
