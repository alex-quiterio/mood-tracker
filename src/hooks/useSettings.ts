import { useCallback, useEffect, useRef, useState } from 'react';

import { DEFAULT_SETTINGS, Settings, loadSettings, saveSettings } from '../data/storage';

/** App-wide settings, persisted to AsyncStorage on every change. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings()
      .then((stored) => {
        latest.current = stored;
        setSettings(stored);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setSettings(next);
    await saveSettings(next);
  }, []);

  return { settings, loaded, update };
}

export type SettingsStore = ReturnType<typeof useSettings>;
