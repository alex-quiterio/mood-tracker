import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { UnlockPreview, previewUnlocks } from './unlocks';

const REFRESH_MS = 60_000;

/**
 * Live count of unlocks since the last check-in. Refreshes every minute, when the
 * app comes back to the foreground, and whenever `refreshKey` changes (e.g. after a save).
 */
export function useLiveUnlocks(enabled: boolean, refreshKey: unknown): UnlockPreview | null {
  const [preview, setPreview] = useState<UnlockPreview | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const refresh = () =>
      previewUnlocks().then((p) => {
        if (!cancelled) setPreview(p);
      });
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      sub.remove();
    };
  }, [enabled, refreshKey]);

  return enabled ? preview : null;
}
