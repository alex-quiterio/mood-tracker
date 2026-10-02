import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { quickEntry } from '@domain/reminders/quickCheckIn';
import { quickCheckInFrom } from '@infrastructure/notifications/quickCheckIn';

import { EntriesStore } from '@ui/state/useEntries';

/**
 * Saves a check-in when a mood button on a reminder was tapped, including when that tap
 * launched the app. Waits for the entries to load so it never overwrites them.
 */
export function useQuickCheckIn(store: EntriesStore) {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<unknown>(null);
  const { loaded, entries, save } = store;

  useEffect(() => {
    if (!loaded || !response || handled.current === response) return;
    handled.current = response;
    const quick = quickCheckInFrom(response);
    if (!quick) return;
    const existing = entries.find((e) => e.date === quick.date && e.slot === quick.slot);
    save(quickEntry(existing, quick.date, quick.slot, quick.mood, new Date())).catch(() => {});
    Notifications.clearLastNotificationResponse();
    // Only the response matters; `entries` is read once when it is first handled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, response]);
}
