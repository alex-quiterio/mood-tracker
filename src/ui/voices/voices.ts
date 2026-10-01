import { Celebration } from '@domain/checkins/moments';
import { Mood } from '@domain/checkins/types';
import { Locale } from '@domain/settings/language';
import { DEFAULT_QUOTES } from '@domain/voices/quotes';
import { Quote, VoiceId } from '@domain/voices/voices';

import { VOICES } from './locales/en';
import { VOICES_PT } from './locales/pt';
import { ActiveVoice, Voice } from './voices.types';

export { VOICES };
export type { ActiveVoice, Voice, VoiceText } from './voices.types';

/** A voice in a language. English is the source; other locales replace its words. */
export function localizeVoice(voice: Voice, locale: Locale): Voice {
  return locale === 'pt-PT' ? { ...voice, ...VOICES_PT[voice.id] } : voice;
}

/** The voice with its quotes: the user's own if they've set any, otherwise the defaults. */
export function activeVoice(
  id: VoiceId,
  customQuotes: Partial<Record<VoiceId, Quote[]>>,
  locale: Locale = 'en',
): ActiveVoice {
  const custom = customQuotes[id];
  return {
    ...localizeVoice(VOICES[id], locale),
    quotes: custom && custom.length > 0 ? custom : DEFAULT_QUOTES[id],
  };
}

/** Emojis for the burst after saving: the voice's own, plus a sprout for a habit win. */
export function burstEmojis(
  voice: Pick<Voice, 'moodEmoji' | 'burst'>,
  mood: Mood,
  habitWin = false,
): string[] {
  const sprout = habitWin ? ['🌱'] : [];
  const level: Celebration = mood >= 4 ? 'high' : mood === 3 ? 'mid' : 'none';
  if (level === 'high') return [voice.moodEmoji[mood], ...voice.burst.high, ...sprout];
  if (level === 'mid') return [...voice.burst.mid, ...sprout];
  return sprout;
}
