import { requireOptionalNativeModule } from 'expo';

type HomeWidgetNative = {
  isSupported(): boolean;
  update(stateJson: string): void;
};

// Optional: the module is missing in Expo Go, on iOS and web, and in tests.
const native = requireOptionalNativeModule<HomeWidgetNative>('HomeWidget');

/**
 * What the widget draws. Words arrive translated; links are opened in the app when tapped.
 * Colours are #RRGGBB. Days and quotes include tomorrow's, so the widget moves on at midnight.
 */
export type HomeWidgetState = {
  /** Local date the slots belong to; after midnight the widget shows them empty. */
  date: string;
  /** Morning, afternoon and evening greetings; the widget picks one by the clock. */
  greetings: string[];
  pause: string;
  pauseLink: string;
  /** Shown in a slot with no check-in yet. */
  empty: string;
  colors: { surface: string; text: string; muted: string; accent: string; empty: string; onMood: string };
  /** Morning, afternoon, evening. `emoji` and `color` are empty when the slot has no check-in. */
  slots: { label: string; emoji: string; color: string; a11yDone: string; a11yEmpty: string; link: string }[];
  /** This week and next, Monday to Sunday. `color` is the day's average mood, or empty. */
  week: { date: string; initial: string; color: string }[];
  weekLink: string;
  /** The quote of the day for `date` and for tomorrow. */
  quotes: { date: string; text: string; source: string }[];
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
