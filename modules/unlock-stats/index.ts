import { requireOptionalNativeModule } from 'expo';

type UnlockStatsNative = {
  isSupported(): boolean;
  hasUsageAccess(): boolean;
  openUsageAccessSettings(): void;
  countUnlocksAsync(startMs: number, endMs: number): Promise<number | null>;
};

// Optional: the module is missing in Expo Go, on iOS and web, and in tests.
const native = requireOptionalNativeModule<UnlockStatsNative>('UnlockStats');

/** Phone-unlock counts from Android's usage events. Every call is safe when the native module is missing. */
export const unlockStats = {
  /** True on Android 9+ builds that include the native module. */
  isSupported: () => native?.isSupported() ?? false,
  hasUsageAccess: () => native?.hasUsageAccess() ?? false,
  openUsageAccessSettings: () => native?.openUsageAccessSettings(),
  /** Unlocks between two times, or null when unsupported or usage access is off. */
  countUnlocks: async (start: Date, end: Date): Promise<number | null> =>
    native ? native.countUnlocksAsync(start.getTime(), end.getTime()) : null,
};
