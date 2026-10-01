import AsyncStorage from '@react-native-async-storage/async-storage';

const UNLOCK_CHECKPOINT_KEY = 'mood-tracker:unlock-checkpoint:v1';
// v2: a timestamp. v1 held a raw sensor reading from 1.2.0 and is ignored.
const STEP_CHECKPOINT_KEY = 'mood-tracker:step-checkpoint:v2';

async function loadDate(key: string): Promise<Date | null> {
  const raw = await AsyncStorage.getItem(key);
  return raw && !Number.isNaN(Date.parse(raw)) ? new Date(raw) : null;
}

const saveDate = (key: string, at: Date) => AsyncStorage.setItem(key, at.toISOString());

/** When unlocks were last counted up to; the next live check-in counts from here. */
export const loadUnlockCheckpoint = () => loadDate(UNLOCK_CHECKPOINT_KEY);
export const saveUnlockCheckpoint = (at: Date) => saveDate(UNLOCK_CHECKPOINT_KEY, at);

/** When steps were last counted up to; the next live check-in counts from here. */
export const loadStepCheckpoint = () => loadDate(STEP_CHECKPOINT_KEY);
export const saveStepCheckpoint = (at: Date) => saveDate(STEP_CHECKPOINT_KEY, at);
