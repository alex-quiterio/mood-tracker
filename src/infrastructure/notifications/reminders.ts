import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ReminderTimes, reminderMessage } from '@domain/reminders/times';
import { SLOTS } from '@domain/checkins/types';

import { BELL_KIND } from './bell';

const CHANNEL_ID = 'check-in-reminders';

// Reminders get fixed ids. Cancelling clears every scheduled notification except the practice
// bell, which also removes reminders scheduled by older versions without ids.
const reminderId = (slot: string) => `reminder-${slot}`;
async function cancelReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.kind !== BELL_KIND)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Rescheduling replaces the reminders, so runs must not overlap when times change quickly.
let queue: Promise<unknown> = Promise.resolve();
const serialize = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task);
  queue = run.catch(() => {});
  return run;
};

/** Replaces the scheduled reminders with one daily reminder per slot. */
export function scheduleReminders(times: ReminderTimes, name: string): Promise<void> {
  return serialize(async () => {
    await cancelReminders();
    for (const slot of SLOTS) {
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId(slot),
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
  return serialize(async () => {
    await cancelReminders();
  });
}
