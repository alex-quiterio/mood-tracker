import { requireOptionalNativeModule } from 'expo';

export type StepReading = {
  /** Steps since the phone last booted. */
  steps: number;
  /** When the phone booted, in ms since the epoch. A different value means it rebooted. */
  bootTime: number;
};

type StepCounterNative = {
  isSupported(): boolean;
  hasPermission(): boolean;
  readAsync(): Promise<StepReading | null>;
};

// Optional: the module is missing in Expo Go, on iOS and web, and in tests.
const native = requireOptionalNativeModule<StepCounterNative>('StepCounter');

/** The phone's hardware step counter. Every call is safe when the native module is missing. */
export const stepCounter = {
  /** True on builds that include the native module, on phones with a step counter sensor. */
  isSupported: () => native?.isSupported() ?? false,
  hasPermission: () => native?.hasPermission() ?? false,
  /** The current reading, or null when unsupported, not permitted, or the sensor doesn't answer. */
  read: async (): Promise<StepReading | null> =>
    native && native.hasPermission() ? native.readAsync() : null,
};
