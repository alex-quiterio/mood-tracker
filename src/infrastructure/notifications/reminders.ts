import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ReminderTimes, reminderMessage } from '../../domain/reminders/times';
import { SLOTS } from '../../domain/checkins/types';

const CHANNEL_ID = 'check-in-reminders';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Rescheduling cancels everything first, so runs must not overlap when times change quickly.
let queue: Promise<unknown> = Promise.resolve();
const serialize = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
};

/** Replaces the scheduled reminders with one daily reminder per slot. */
export function scheduleReminders(times: ReminderTimes, name: string): Promise<void> {
  return serialize(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const slot of SLOTS) {
      await Notifications.scheduleNotificationAsync({
        content: reminderMessage(slot, name),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: times[slot].hour,
          minute: times[slot].minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  });
}

/** Asks for permission and schedules the reminders. Returns false if notification permission was denied. */
export async function enableReminders(times: ReminderTimes, name: string): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Check-in reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  await scheduleReminders(times, name);
  return true;
}

export function disableReminders(): Promise<void> {
  return serialize(() => Notifications.cancelAllScheduledNotificationsAsync());
}
