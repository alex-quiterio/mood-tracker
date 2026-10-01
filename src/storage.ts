import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseEntry } from './entries';
import { THEMES, ThemeName } from './theme';
import { Quote, VOICE_IDS, VoiceId } from './voices';
import { Entry } from './types';

const ENTRIES_KEY = 'mood-tracker:entries:v1';
const SETTINGS_KEY = 'mood-tracker:settings:v1';
const UNLOCK_CHECKPOINT_KEY = 'mood-tracker:unlock-checkpoint:v1';
const STEP_CHECKPOINT_KEY = 'mood-tracker:step-checkpoint:v1';

export type Settings = {
  remindersEnabled: boolean;
  theme: ThemeName;
  trackUnlocks: boolean;
  trackSteps: boolean;
  voice: VoiceId;
  /** Per-voice quotes that replace the defaults. */
  customQuotes: Partial<Record<VoiceId, Quote[]>>;
};

export const DEFAULT_SETTINGS: Settings = {
  remindersEnabled: false,
  theme: 'light',
  trackUnlocks: false,
  trackSteps: false,
  voice: 'plain',
  customQuotes: {},
};

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
    trackSteps: stored.trackSteps === true,
    voice: VOICE_IDS.includes(stored.voice as VoiceId) ? (stored.voice as VoiceId) : DEFAULT_SETTINGS.voice,
    customQuotes: parseCustomQuotes(stored.customQuotes),
  };
}

function parseCustomQuotes(value: unknown): Partial<Record<VoiceId, Quote[]>> {
  if (typeof value !== 'object' || value === null) return {};
  const result: Partial<Record<VoiceId, Quote[]>> = {};
  for (const id of VOICE_IDS) {
    const list = (value as Record<string, unknown>)[id];
    if (!Array.isArray(list)) continue;
    const quotes = list.filter(
      (q): q is Quote =>
        typeof q?.text === 'string' &&
        q.text.trim() !== '' &&
        (q.source === undefined || typeof q.source === 'string'),
    );
    if (quotes.length > 0) result[id] = quotes;
  }
  return result;
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

/** The step counter reading at the last count; the next live check-in counts from here. */
export type StepCheckpoint = { steps: number; bootTime: number; at: string };

export async function loadStepCheckpoint(): Promise<StepCheckpoint | null> {
  const raw = await AsyncStorage.getItem(STEP_CHECKPOINT_KEY);
  if (!raw) return null;
  const v = JSON.parse(raw) as Partial<StepCheckpoint>;
  const valid =
    typeof v.steps === 'number' &&
    typeof v.bootTime === 'number' &&
    typeof v.at === 'string' &&
    !Number.isNaN(Date.parse(v.at));
  return valid ? (v as StepCheckpoint) : null;
}

export async function saveStepCheckpoint(checkpoint: StepCheckpoint): Promise<void> {
  await AsyncStorage.setItem(STEP_CHECKPOINT_KEY, JSON.stringify(checkpoint));
}
