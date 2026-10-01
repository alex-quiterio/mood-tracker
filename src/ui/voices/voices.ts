import { celebrationFor } from '@domain/checkins/moments';
import { Mood } from '@domain/checkins/types';
import { Locale } from '@domain/settings/language';
import { DEFAULT_QUOTES } from '@domain/voices/quotes';
import { Quote, VOICE_IDS, VoiceId } from '@domain/voices/voices';
import { messages } from '@ui/i18n/messages';

import { ActiveVoice, Voice, VoiceStyle } from './voices.types';

export type { ActiveVoice, Voice, VoiceStyle, VoiceText } from './voices.types';

/** Each voice's emojis and save bursts, the same in every language. Its words come from the locale. */
export const VOICE_STYLES: Record<VoiceId, VoiceStyle> = {
  plain: {
    id: 'plain',
    moodEmoji: { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' },
    burst: { high: ['✨', '🎉', '💛'], mid: ['✨', '🌱'] },
  },

  laoTzu: {
    id: 'laoTzu',
    moodEmoji: { 1: '🌫️', 2: '🌊', 3: '🍃', 4: '💧', 5: '🪷' },
    burst: { high: ['🪷', '💧', '✨'], mid: ['🍃'] },
  },

  marcus: {
    id: 'marcus',
    moodEmoji: { 1: '🌩️', 2: '🌥️', 3: '⚖️', 4: '🌅', 5: '🏛️' },
    burst: { high: ['🏛️', '🌅', '✨'], mid: ['⚖️'] },
  },

  seneca: {
    id: 'seneca',
    moodEmoji: { 1: '🌧️', 2: '🍂', 3: '🕯️', 4: '📜', 5: '☀️' },
    burst: { high: ['☀️', '📜', '✨'], mid: ['🕯️'] },
  },

  rumi: {
    id: 'rumi',
    moodEmoji: { 1: '🌑', 2: '🥀', 3: '🕯️', 4: '🌹', 5: '🌞' },
    burst: { high: ['🌹', '🌞', '✨'], mid: ['🕯️'] },
  },

  kabir: {
    id: 'kabir',
    moodEmoji: { 1: '🌫️', 2: '🌧️', 3: '🪔', 4: '🎶', 5: '🌸' },
    burst: { high: ['🌸', '🎶', '✨'], mid: ['🪔'] },
  },

  patanjali: {
    id: 'patanjali',
    moodEmoji: { 1: '🌪️', 2: '🌊', 3: '🍃', 4: '🔆', 5: '🧘' },
    burst: { high: ['🧘', '🔆', '✨'], mid: ['🍃'] },
  },

  lorde: {
    id: 'lorde',
    moodEmoji: { 1: '🌧️', 2: '🛡️', 3: '🕯️', 4: '🌳', 5: '🔥' },
    burst: { high: ['🔥', '🌳', '✨'], mid: ['🕯️'] },
  },

  capra: {
    id: 'capra',
    moodEmoji: { 1: '🍂', 2: '🌀', 3: '🌿', 4: '🌐', 5: '✨' },
    burst: { high: ['🌐', '🌿', '✨'], mid: ['🌿'] },
  },

  jesus: {
    id: 'jesus',
    moodEmoji: { 1: '🌊', 2: '🌧️', 3: '🕯️', 4: '🌾', 5: '🕊️' },
    burst: { high: ['🕊️', '🌾', '✨'], mid: ['🕯️'] },
  },

  muhammad: {
    id: 'muhammad',
    moodEmoji: { 1: '🌑', 2: '🌒', 3: '🌓', 4: '🌔', 5: '🌕' },
    burst: { high: ['🌙', '⭐', '✨'], mid: ['⭐'] },
  },

  buddha: {
    id: 'buddha',
    moodEmoji: { 1: '☁️', 2: '🌬️', 3: '🍃', 4: '🌳', 5: '🪷' },
    burst: { high: ['🪷', '🌳', '✨'], mid: ['🍃'] },
  },

  shiva: {
    id: 'shiva',
    moodEmoji: { 1: '🌫️', 2: '⛈️', 3: '🏔️', 4: '🌙', 5: '🔱' },
    burst: { high: ['🔱', '🌙', '✨'], mid: ['🏔️'] },
  },
};

/** A voice in a language: its style plus that locale's words. */
export const voiceFor = (id: VoiceId, locale: Locale = 'en'): Voice => ({
  ...VOICE_STYLES[id],
  ...messages(locale).voices[id],
});

/** Every voice in English, for defaults and tests. */
export const VOICES = Object.fromEntries(VOICE_IDS.map((id) => [id, voiceFor(id)])) as Record<VoiceId, Voice>;

/** The voice with its quotes: the user's own if they've set any, otherwise the defaults. */
export function activeVoice(
  id: VoiceId,
  customQuotes: Partial<Record<VoiceId, Quote[]>>,
  locale: Locale = 'en',
): ActiveVoice {
  const custom = customQuotes[id];
  return { ...voiceFor(id, locale), quotes: custom && custom.length > 0 ? custom : DEFAULT_QUOTES[id] };
}

/** Emojis for the burst after saving: the voice's own, plus a sprout for a habit win. */
export function burstEmojis(
  voice: Pick<Voice, 'moodEmoji' | 'burst'>,
  mood: Mood,
  habitWin = false,
): string[] {
  const sprout = habitWin ? ['🌱'] : [];
  const level = celebrationFor(mood);
  if (level === 'high') return [voice.moodEmoji[mood], ...voice.burst.high, ...sprout];
  if (level === 'mid') return [...voice.burst.mid, ...sprout];
  return sprout;
}
