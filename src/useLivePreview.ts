import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const REFRESH_MS = 60_000;

/**
 * A live value such as unlocks or steps since the last check-in. Refreshes every
 * minute, when the app comes back to the foreground, and whenever `refreshKey`
 * changes (e.g. after a save). `load` must be stable, like a module-level function.
 */
export function useLivePreview<T>(
  load: () => Promise<T | null>,
  enabled: boolean,
  refreshKey: unknown,
): T | null {
  const [preview, setPreview] = useState<T | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const refresh = () =>
      load().then((p) => {
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
  }, [load, enabled, refreshKey]);

  return enabled ? preview : null;
}
