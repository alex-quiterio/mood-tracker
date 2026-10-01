import { Mood, Slot } from '@domain/checkins/types';
import { Quote, VoiceId } from '@domain/voices/voices';

/**
 * A voice changes only how the app speaks: words, emojis and the Claude prompt.
 * Entries are always stored as plain 1–5 moods, so switching voices re-voices
 * your whole history and never touches the data.
 */
export type Voice = {
  id: VoiceId;
  name: string;
  tagline: string;
  moodLabels: Record<Mood, string>;
  moodEmoji: Record<Mood, string>;
  slotLabels: Record<Slot, string>;
  /** The question in the note field, per slot. This is where each voice's practice lives. */
  notePrompts: Record<Slot, string>;
  /** Emojis for the save burst: `high` for moods 4–5, `mid` for 3. Low moods get none. */
  burst: { high: string[]; mid: string[] };
  /** Card offered after a low mood. */
  comfort: string;
  /** Last line of the breathing moment. */
  breathDone: string;
  /** Claude prompt: who to reflect as, and what to ask for. */
  claude: { intro: string; ask: string };
};

/** The words of a voice that change with the language; emojis, colours and quotes don't. */
export type VoiceText = Pick<
  Voice,
  'name' | 'tagline' | 'moodLabels' | 'slotLabels' | 'notePrompts' | 'comfort' | 'breathDone' | 'claude'
>;

/** A voice with the quotes it shows: the user's own, or the defaults. */
export type ActiveVoice = Voice & { quotes: Quote[] };
