import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Small things about how the app was last looked at, like which section of a tab
 * was open. Only a convenience on this phone: not part of settings or backups.
 */
const HISTORY_SECTION_KEY = 'mood-tracker:history-section:v1';

/** The History section last open, or null when none was saved or storage failed. */
export const loadHistorySection = (): Promise<string | null> =>
  AsyncStorage.getItem(HISTORY_SECTION_KEY).catch(() => null);

export const saveHistorySection = (section: string): Promise<void> =>
  AsyncStorage.setItem(HISTORY_SECTION_KEY, section).catch(() => {});

const SETTINGS_SECTION_KEY = 'mood-tracker:settings-section:v1';

/** The Settings section last open, or null when none was saved or storage failed. */
export const loadSettingsSection = (): Promise<string | null> =>
  AsyncStorage.getItem(SETTINGS_SECTION_KEY).catch(() => null);

export const saveSettingsSection = (section: string): Promise<void> =>
  AsyncStorage.setItem(SETTINGS_SECTION_KEY, section).catch(() => {});
