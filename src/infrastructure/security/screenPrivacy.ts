import { allowScreenCaptureAsync, preventScreenCaptureAsync } from 'expo-screen-capture';

const KEY = 'app-lock';

/**
 * While the lock is on, Android's FLAG_SECURE blanks the app in the recent-apps
 * preview (and blocks screenshots), so nobody glimpses your notes there.
 */
export function setScreenPrivacy(on: boolean): Promise<void> {
  return (on ? preventScreenCaptureAsync(KEY) : allowScreenCaptureAsync(KEY)).catch(() => {});
}
