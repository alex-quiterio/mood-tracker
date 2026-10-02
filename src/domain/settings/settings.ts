import { DEFAULT_REMINDER_TIMES, ReminderTimes, parseReminderTimes } from '@domain/reminders/times';
import { Habit, PRESET_HABITS, parseHabits } from '@domain/habits/habits';
import { LANGUAGE_SETTINGS, LanguageSetting } from '@domain/settings/language';
import { isValidDate } from '@domain/shared/dates';
import { Quote, VOICE_IDS, VoiceId } from '@domain/voices/voices';

export const THEMES = ['light', 'dim', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];

export const THEME_LABEL: Record<ThemeName, string> = {
  light: 'Light',
  dim: 'Dim',
  dark: 'Dark',
};

export const NAME_MAX_LENGTH = 40;

export type Settings = {
  /** What the app calls you. Empty until you've told it. */
  name: string;
  remindersEnabled: boolean;
  reminderTimes: ReminderTimes;
  theme: ThemeName;
  trackUnlocks: boolean;
  trackSteps: boolean;
  voice: VoiceId;
  /** Per-voice quotes that replace the defaults. */
  customQuotes: Partial<Record<VoiceId, Quote[]>>;
  /** Habits logged with each check-in. */
  habits: Habit[];
  /** Habit data is sensitive, so it only goes into the Claude prompt when you choose. */
  habitsInPrompt: boolean;
  /** Show what doses cost next to the savings jar. Off by default; it's optional and neutral. */
  showSpending: boolean;
  /** Follow the phone's language, or a fixed one. */
  language: LanguageSetting;
  /** Ask for the phone's fingerprint, face or PIN when opening the app. */
  appLock: boolean;
  /** The folder backups are written to (an Android content:// URI), empty until one is chosen. */
  backupFolder: string;
  /** Back up to that folder once a week, when the app opens. */
  autoBackup: boolean;
  /** Local date of the last backup to the folder, empty when there hasn't been one. */
  lastBackup: string;
};

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  remindersEnabled: false,
  reminderTimes: DEFAULT_REMINDER_TIMES,
  theme: 'light',
  trackUnlocks: false,
  trackSteps: false,
  voice: 'plain',
  customQuotes: {},
  habits: PRESET_HABITS,
  habitsInPrompt: false,
  showSpending: false,
  language: 'system',
  appLock: false,
  backupFolder: '',
  autoBackup: false,
  lastBackup: '',
};

/** Settings from stored JSON; anything missing or invalid falls back to its default. */
export function parseSettings(value: unknown): Settings {
  const stored = (typeof value === 'object' && value !== null ? value : {}) as Partial<Settings>;
  return {
    name: cleanName(stored.name),
    remindersEnabled: stored.remindersEnabled === true,
    reminderTimes: parseReminderTimes(stored.reminderTimes),
    theme: THEMES.includes(stored.theme as ThemeName) ? (stored.theme as ThemeName) : DEFAULT_SETTINGS.theme,
    trackUnlocks: stored.trackUnlocks === true,
    trackSteps: stored.trackSteps === true,
    voice: VOICE_IDS.includes(stored.voice as VoiceId) ? (stored.voice as VoiceId) : DEFAULT_SETTINGS.voice,
    customQuotes: parseCustomQuotes(stored.customQuotes),
    habits: parseHabits(stored.habits),
    habitsInPrompt: stored.habitsInPrompt === true,
    showSpending: stored.showSpending === true,
    language: LANGUAGE_SETTINGS.includes(stored.language as LanguageSetting)
      ? (stored.language as LanguageSetting)
      : DEFAULT_SETTINGS.language,
    appLock: stored.appLock === true,
    backupFolder: typeof stored.backupFolder === 'string' ? stored.backupFolder : '',
    autoBackup: stored.autoBackup === true,
    lastBackup: isValidDate(stored.lastBackup) ? stored.lastBackup : '',
  };
}

/** Trims and shortens a name; anything that isn't a string becomes empty. */
export function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, NAME_MAX_LENGTH) : '';
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
