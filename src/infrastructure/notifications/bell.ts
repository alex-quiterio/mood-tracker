import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

export const BELL_KIND = 'practice-bell';
const CHANNEL_ID = 'practice-bell';

/**
 * Schedules the bell that ends a practice. A notification rings even if the
 * screen locks or the app goes to the background. Returns null when
 * notifications aren't allowed; the session still ends with a vibration.
 */
export async function scheduleBell(seconds: number, body: string): Promise<string | null> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Practice bell',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 300, 150, 300],
      });
    }
    return await Notifications.scheduleNotificationAsync({
      content: { title: '🔔 Time', body, sound: 'default', data: { kind: BELL_KIND } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        repeats: false,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelBell(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/** A gentle double buzz for the end of a session while the app is open. */
export const buzz = () => Vibration.vibrate([0, 300, 150, 300]);
