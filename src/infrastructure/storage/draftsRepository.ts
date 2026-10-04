import AsyncStorage from '@react-native-async-storage/async-storage';

import { Draft, parseDraft } from '@domain/checkins/drafts';
import { Slot } from '@domain/checkins/types';

// One key per check-in, so the three slots never overwrite each other.
const PREFIX = 'mood-tracker:draft:v1:';
const keyFor = (date: string, slot: Slot) => `${PREFIX}${date}:${slot}`;

export async function loadDraft(date: string, slot: Slot): Promise<Draft | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(date, slot));
    return raw ? parseDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export const saveDraft = (date: string, slot: Slot, draft: Draft) =>
  AsyncStorage.setItem(keyFor(date, slot), JSON.stringify(draft));

export const clearDraft = (date: string, slot: Slot) => AsyncStorage.removeItem(keyFor(date, slot));

/** Drops drafts of other days: only today can be checked in, so they can't be finished. */
export async function pruneDrafts(today: string): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const stale = keys.filter((k) => k.startsWith(PREFIX) && !k.startsWith(`${PREFIX}${today}:`));
  if (stale.length > 0) await AsyncStorage.multiRemove(stale);
}
