import { requireOptionalNativeModule } from 'expo';

type StepCounterNative = {
  isSupported(): boolean;
  hasPermission(): boolean;
  subscribeAsync(): Promise<boolean>;
  countStepsAsync(startMs: number, endMs: number): Promise<number | null>;
};

// Optional: the module is missing in Expo Go, on iOS and web, and in tests.
const native = requireOptionalNativeModule<StepCounterNative>('StepCounter');

/**
 * Steps recorded in the background by Google Play services (Recording API on
 * mobile). Every call is safe when the native module is missing.
 */
export const stepCounter = {
  /** True on builds that include the native module, with a recent enough Google Play services. */
  isSupported: () => native?.isSupported() ?? false,
  hasPermission: () => native?.hasPermission() ?? false,
  /** Starts or renews background recording. Steps are only available from the first subscription on. */
  subscribe: async (): Promise<boolean> => (native ? native.subscribeAsync() : false),
  /** Steps between two times, or null when unsupported, not permitted or unreadable. */
  countSteps: async (start: Date, end: Date): Promise<number | null> =>
    native ? native.countStepsAsync(start.getTime(), end.getTime()) : null,
};
