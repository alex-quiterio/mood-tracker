import * as Notifications from 'expo-notifications';

import { BELL_KIND } from './bell';

/** Shows notifications while the app is open; only the practice bell makes a sound. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => ({
      shouldPlaySound: notification.request.content.data?.kind === BELL_KIND,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
