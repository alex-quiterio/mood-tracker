import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { shouldLockOnReturn } from '@domain/settings/lock';
import { confirmWithDeviceLock } from '@infrastructure/security/deviceLock';

type Text = { prompt: string; cancel: string };

/**
 * The app lock: locked when the app starts (if the lock is on) and again after a
 * minute in the background. Unlocking asks Android to confirm it's you.
 */
export function useAppLock(enabled: boolean, text: Text) {
  const [locked, setLocked] = useState(enabled);
  const backgroundedAt = useRef<number | null>(null);

  const onAppState = useEffectEvent((state: string) => {
    if (state === 'background') backgroundedAt.current = Date.now();
    if (state === 'active') {
      if (shouldLockOnReturn(enabled, backgroundedAt.current, Date.now())) setLocked(true);
      backgroundedAt.current = null;
    }
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, []);

  const unlock = async () => {
    if (await confirmWithDeviceLock(text)) setLocked(false);
  };

  // Turning the lock off in Settings unlocks right away.
  return { locked: enabled && locked, unlock };
}
