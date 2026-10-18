import { useEffect, useRef } from 'react';

import { captureUnlockDays } from '@infrastructure/signals/unlocks';

import { EntriesStore } from '@ui/state/useEntries';

/**
 * Reads the last week's finished days whole from the phone, once the entries are
 * loaded and again each new day the app is opened. Android keeps about a week of
 * usage events, so a day missed now can still be read on a later open.
 */
export function useUnlockDayCapture(store: EntriesStore, trackUnlocks: boolean, today: string) {
  const tried = useRef<string | null>(null);
  const { loaded, capturedDays, addCapturedDays } = store;

  useEffect(() => {
    if (!loaded || !trackUnlocks || tried.current === today) return;
    tried.current = today;
    captureUnlockDays(capturedDays)
      .then(addCapturedDays)
      .catch(() => {});
    // Once per day; the captured days it adds don't need another run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, trackUnlocks, today]);
}
