import { requireOptionalNativeModule } from 'expo';

type HomeWidgetNative = {
  isSupported(): boolean;
  update(stateJson: string): void;
};

// Optional: the module is missing in Expo Go, on iOS and web, and in tests.
const native = requireOptionalNativeModule<HomeWidgetNative>('HomeWidget');

/** What the widget draws. Words arrive translated; links are opened in the app when tapped. */
export type HomeWidgetState = {
  /** Local date the moods belong to; after midnight the widget shows empty slots. */
  date: string;
  title: string;
  pause: string;
  pauseLink: string;
  /** Shown in a slot with no check-in yet. */
  empty: string;
  colors: { surface: string; text: string; muted: string; accent: string };
  /** Morning, afternoon, evening. `emoji` is empty when the slot has no check-in. */
  slots: { label: string; emoji: string; a11y: string; link: string }[];
};

/** The Android home-screen widget. Every call is safe when the native module is missing. */
export const homeWidget = {
  isSupported: () => native?.isSupported() ?? false,
  /** Redraws the widget. Never throws: a widget that can't update shouldn't break the app. */
  update: (state: HomeWidgetState) => {
    try {
      native?.update(JSON.stringify(state));
    } catch {
      // Nothing to do; the widget keeps its last state.
    }
  },
};
