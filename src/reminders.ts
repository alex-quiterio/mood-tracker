import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { SLOT_LABEL, Slot } from './types';

const CHANNEL_ID = 'check-in-reminders';

export const REMINDER_TIMES: { slot: Slot; hour: number; minute: number }[] = [
  { slot: 'morning', hour: 9, minute: 0 },
  { slot: 'afternoon', hour: 14, minute: 0 },
  { slot: 'evening', hour: 20, minute: 0 },
];

export const formatTime = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

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

/** Schedules the three daily reminders. Returns false if notification permission was denied. */
export async function enableReminders(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Check-in reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const { slot, hour, minute } of REMINDER_TIMES) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${SLOT_LABEL[slot]} check-in`,
        body: 'How are you feeling right now?',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  }
  return true;
}

export async function disableReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
