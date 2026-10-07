import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Motion tokens: short, soft and never in the way. Every animation in the app uses
 * these, and all of them stand still when the phone asks to remove animations.
 */
export const motion = {
  /** Cards and titles fading and rising in. */
  appear: { duration: 260, rise: 8 },
  /** How far a pressed control sinks. */
  pressScale: 0.96,
  /** A spring that settles quickly without wobbling much. */
  spring: { speed: 28, bounciness: 6 },
  /** A picked mood: it starts a little small and bounces up to size. */
  pop: { from: 0.8, speed: 18, bounciness: 14 },
} as const;

// One subscription for the whole app, shared by every hook that asks.
let reduced = false;
let started = false;
const listeners = new Set<() => void>();
const update = (value: boolean) => {
  reduced = value;
  listeners.forEach((l) => l());
};

function subscribe(listener: () => void) {
  if (!started) {
    started = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', update);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether the phone's "remove animations" setting is on. */
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => reduced);
