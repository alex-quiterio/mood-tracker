import { DEFAULT_REMINDER_TIMES, ReminderTimes, parseReminderTimes } from '@domain/reminders/times';
import { Habit, PRESET_HABITS, parseHabits } from '@domain/habits/habits';
import { LANGUAGE_SETTINGS, LanguageSetting } from '@domain/settings/language';
import { TimeZoneSetting, parseTimeZone } from '@domain/settings/timeZone';
import { isValidDate } from '@domain/shared/dates';
import { MerchantLinks, parseMerchantLinks } from '@domain/spending/categories';
import { DEFAULT_ROTATION_VOICES, VOICE_ROTATIONS, VoiceRotation } from '@domain/voices/rotation';
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
  /** Let the voice change by itself every day or week, among `rotationVoices`. */
  voiceRotation: VoiceRotation;
  rotationVoices: VoiceId[];
  /** Per-voice quotes that replace the defaults. */
  customQuotes: Partial<Record<VoiceId, Quote[]>>;
  /** Habits logged with each check-in. */
  habits: Habit[];
  /** Habit data is sensitive, so it only goes into the Claude prompt when you choose. */
  habitsInPrompt: boolean;
  /**
   * Money anywhere in the app: prices and savings in euros, and imported bank
   * statements. Off only hides them; payments, prices and links are kept. On by default.
   */
  showMoney: boolean;
  /** Show what doses cost next to the savings jar. Off by default; it's optional and neutral. */
  showSpending: boolean;
  /** Merchants from bank statements linked to the habit they're spent on. */
  merchantHabits: MerchantLinks;
  /** Follow the phone's language, or a fixed one. */
  language: LanguageSetting;
  /** Shows check-in times in the phone's time zone, or a fixed one. */
  timeZone: TimeZoneSetting;
  /** Ask for the phone's fingerprint, face or PIN when opening the app. */
  appLock: boolean;
  /** The folder backups are written to (an Android content:// URI), empty until one is chosen. */
  backupFolder: string;
  /** Back up to that folder once a week, when the app opens. */
  autoBackup: boolean;
  /** Local date of the last backup to the folder, empty when there hasn't been one. */
  lastBackup: string;
  /** Put the settings in backups and exports too. On by default. */
  backupSettings: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  remindersEnabled: false,
  reminderTimes: DEFAULT_REMINDER_TIMES,
  theme: 'light',
  trackUnlocks: false,
  trackSteps: false,
  voice: 'plain',
  voiceRotation: 'off',
  rotationVoices: DEFAULT_ROTATION_VOICES,
  customQuotes: {},
  habits: PRESET_HABITS,
  habitsInPrompt: false,
  showMoney: true,
  showSpending: false,
  merchantHabits: {},
  language: 'system',
  timeZone: 'system',
  appLock: false,
  backupFolder: '',
  autoBackup: false,
  lastBackup: '',
  backupSettings: true,
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
    voiceRotation: VOICE_ROTATIONS.includes(stored.voiceRotation as VoiceRotation)
      ? (stored.voiceRotation as VoiceRotation)
      : DEFAULT_SETTINGS.voiceRotation,
    rotationVoices: parseRotationVoices(stored.rotationVoices),
    customQuotes: parseCustomQuotes(stored.customQuotes),
    habits: parseHabits(stored.habits),
    habitsInPrompt: stored.habitsInPrompt === true,
    showMoney: stored.showMoney !== false,
    showSpending: stored.showSpending === true,
    merchantHabits: parseMerchantLinks(stored.merchantHabits),
    language: LANGUAGE_SETTINGS.includes(stored.language as LanguageSetting)
      ? (stored.language as LanguageSetting)
      : DEFAULT_SETTINGS.language,
    timeZone: parseTimeZone(stored.timeZone),
    appLock: stored.appLock === true,
    backupFolder: typeof stored.backupFolder === 'string' ? stored.backupFolder : '',
    autoBackup: stored.autoBackup === true,
    lastBackup: isValidDate(stored.lastBackup) ? stored.lastBackup : '',
    backupSettings: stored.backupSettings !== false,
  };
}

/**
 * The settings a backup carries. Left out: habits (the file has them already), and whatever
 * belongs to this phone: permissions (reminders, unlocks, steps), the lock and the backup folder.
 */
export const PORTABLE_SETTINGS = [
  'name',
  'reminderTimes',
  'theme',
  'voice',
  'voiceRotation',
  'rotationVoices',
  'customQuotes',
  'habitsInPrompt',
  'showMoney',
  'showSpending',
  'merchantHabits',
  'language',
  'timeZone',
  'backupSettings',
] as const satisfies readonly (keyof Settings)[];

export type PortableSettings = Pick<Settings, (typeof PORTABLE_SETTINGS)[number]>;

/** What goes into a backup: the portable settings, or nothing when `backupSettings` is off. */
export function settingsForBackup(settings: Settings): Partial<PortableSettings> | undefined {
  if (!settings.backupSettings) return undefined;
  return Object.fromEntries(PORTABLE_SETTINGS.map((key) => [key, settings[key]]));
}

/** Portable settings from a backup: only the ones the file has, each checked like stored settings. */
export function parsePortableSettings(value: unknown): Partial<PortableSettings> | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const parsed = parseSettings(value);
  const present = PORTABLE_SETTINGS.filter((key) => key in value);
  return present.length > 0 ? Object.fromEntries(present.map((key) => [key, parsed[key]])) : undefined;
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

/** Known voices only; none at all falls back to the default list. */
function parseRotationVoices(value: unknown): VoiceId[] {
  const ids = Array.isArray(value) ? VOICE_IDS.filter((id) => value.includes(id)) : [];
  return ids.length > 0 ? ids : DEFAULT_ROTATION_VOICES;
}
