/** The app locks again after this long in the background. */
export const LOCK_AFTER_MS = 60_000;

/** Whether coming back to the app needs unlocking: lock is on and it was away long enough. */
export const shouldLockOnReturn = (enabled: boolean, backgroundedAt: number | null, now: number) =>
  enabled && backgroundedAt !== null && now - backgroundedAt >= LOCK_AFTER_MS;
