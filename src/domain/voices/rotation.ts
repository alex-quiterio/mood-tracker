import { VOICE_IDS, VoiceId } from './voices';

/** How often the voice changes by itself: never, every day, or every Monday. */
export const VOICE_ROTATIONS = ['off', 'daily', 'weekly'] as const;
export type VoiceRotation = (typeof VOICE_ROTATIONS)[number];

/** Every voice but Plain takes part until you choose. */
export const DEFAULT_ROTATION_VOICES: VoiceId[] = VOICE_IDS.filter((id) => id !== 'plain');

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
};

/**
 * The voice for a day. Rotating voices take turns in the app's voice order, one a day
 * or one a week (weeks start on Monday). With rotation off, or nothing to rotate,
 * it's the chosen voice.
 */
export function voiceForDay(
  rotation: VoiceRotation,
  rotationVoices: VoiceId[],
  chosen: VoiceId,
  date: string,
): VoiceId {
  const voices = VOICE_IDS.filter((id) => rotationVoices.includes(id));
  if (rotation === 'off' || voices.length === 0) return chosen;
  // Day 0 (1 January 1970) was a Thursday; shifting by 3 makes each week start on Monday.
  const turn = rotation === 'daily' ? dayNumber(date) : Math.floor((dayNumber(date) + 3) / 7);
  return voices[turn % voices.length];
}
