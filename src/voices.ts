import { createContext, useContext } from 'react';

import { DEFAULT_QUOTES } from './quotes';
import { MOOD_EMOJI, MOOD_LABEL, Mood, SLOT_LABEL, Slot } from './types';

export const VOICE_IDS = ['plain', 'laoTzu', 'marcus', 'seneca', 'rumi', 'kabir', 'patanjali'] as const;
export type VoiceId = (typeof VOICE_IDS)[number];

export type Quote = { text: string; source?: string };

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

export const VOICES: Record<VoiceId, Voice> = {
  plain: {
    id: 'plain',
    name: 'Plain',
    tagline: 'Simple and direct',
    moodLabels: MOOD_LABEL,
    moodEmoji: MOOD_EMOJI,
    slotLabels: SLOT_LABEL,
    notePrompts: {
      morning: 'Add a note (optional)',
      afternoon: 'Add a note (optional)',
      evening: 'Add a note (optional)',
    },
    burst: { high: ['✨', '🎉', '💛'], mid: ['✨', '🌱'] },
    comfort: 'That sounds like a heavy moment. Take three slow breaths with me?',
    breathDone: 'That’s it. Be gentle with yourself 🌿',
    claude: {
      intro: '',
      ask: 'Please reflect on this week. What patterns do you notice (time of day, days of the week, {signals}anything in the notes)? Then suggest one small, concrete thing I could try next week. Keep it short and kind.',
    },
  },

  laoTzu: {
    id: 'laoTzu',
    name: 'Lao Tzu',
    tagline: 'Flow like water',
    moodLabels: { 1: 'Muddy water', 2: 'Choppy', 3: 'Flowing', 4: 'Clear stream', 5: 'Still lake' },
    moodEmoji: { 1: '🌫️', 2: '🌊', 3: '🍃', 4: '💧', 5: '🪷' },
    slotLabels: { morning: 'Dawn', afternoon: 'Noon', evening: 'Dusk' },
    notePrompts: {
      morning: 'What can you leave undone today?',
      afternoon: 'Where are you forcing things?',
      evening: 'What did you let go of today?',
    },
    burst: { high: ['🪷', '💧', '✨'], mid: ['🍃'] },
    comfort: 'Muddy water clears when it is left still. Rest here for three slow breaths?',
    breathDone: 'The water settles on its own 🌊',
    claude: {
      intro:
        'Reflect on my week in the spirit of the Tao Te Ching: gently, without judgment, favouring yielding over forcing.',
      ask: 'What patterns do you notice (where I pushed against the current, where things flowed, {signals}anything in the notes)? Suggest one small thing I could let go of or do less of next week. Keep it short and simple, like water.',
    },
  },

  marcus: {
    id: 'marcus',
    name: 'Marcus Aurelius',
    tagline: 'Mind what is yours to control',
    moodLabels: { 1: 'Disturbed', 2: 'Unsettled', 3: 'Steady', 4: 'Composed', 5: 'Tranquil' },
    moodEmoji: { 1: '🌩️', 2: '🌥️', 3: '⚖️', 4: '🌅', 5: '🏛️' },
    slotLabels: { morning: 'Morning', afternoon: 'Midday', evening: 'Evening' },
    notePrompts: {
      morning: 'What might you meet today, and how will you meet it?',
      afternoon: 'What here is within your control?',
      evening: 'What did you do well today? Where did you fall short?',
    },
    burst: { high: ['🏛️', '🌅', '✨'], mid: ['⚖️'] },
    comfort:
      'Even an emperor had hard days, and wrote to himself through them. Pause for three slow breaths?',
    breathDone: 'Begin again, as often as you need 🌅',
    claude: {
      intro:
        "Reflect on my week as a Stoic teacher in the spirit of Marcus Aurelius's Meditations: calm, honest and kind.",
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Help me separate what happened from my judgments about it, and what was in my control from what was not. Suggest one virtue or small practice to focus on next week. Keep it short, and be gentle about the low days.',
    },
  },

  seneca: {
    id: 'seneca',
    name: 'Seneca',
    tagline: 'Letters to a friend',
    moodLabels: { 1: 'Storm-tossed', 2: 'Restless', 3: 'Even', 4: 'At ease', 5: 'Serene' },
    moodEmoji: { 1: '🌧️', 2: '🍂', 3: '🕯️', 4: '📜', 5: '☀️' },
    slotLabels: SLOT_LABEL,
    notePrompts: {
      morning: 'How will you spend today’s hours?',
      afternoon: 'What are you dreading that hasn’t happened?',
      evening: 'What did today teach you?',
    },
    burst: { high: ['☀️', '📜', '✨'], mid: ['🕯️'] },
    comfort: 'A hard hour is easier shared. Write to yourself as to a friend, after three slow breaths?',
    breathDone: 'Be the friend you would write to ✉️',
    claude: {
      intro:
        'Reflect on my week as Seneca might in one of his letters to Lucilius: warm, practical and frank, like an old friend.',
      ask: 'What patterns do you notice in how I spent my time and attention ({signals}the notes, the time of day)? Point out any fear I may be borrowing from the future. Suggest one small, practical thing for next week. Write it as a short letter.',
    },
  },

  rumi: {
    id: 'rumi',
    name: 'Rumi',
    tagline: 'Every feeling is a guest',
    moodLabels: { 1: 'Night of longing', 2: 'Aching', 3: 'Searching', 4: 'Warm', 5: 'Ecstatic' },
    moodEmoji: { 1: '🌑', 2: '🥀', 3: '🕯️', 4: '🌹', 5: '🌞' },
    slotLabels: { morning: 'Dawn', afternoon: 'Day', evening: 'Night' },
    notePrompts: {
      morning: 'What has arrived in you this morning?',
      afternoon: 'What is your heart reaching for?',
      evening: 'What did today’s feelings come to show you?',
    },
    burst: { high: ['🌹', '🌞', '✨'], mid: ['🕯️'] },
    comfort: 'Even this feeling is a visitor. Sit with it for three slow breaths?',
    breathDone: 'Let the visitor rest a while 🕯️',
    claude: {
      intro:
        'Reflect on my week in the spirit of Rumi: tender and open-hearted, welcoming every feeling as a guest.',
      ask: 'What patterns do you notice in what my days held ({signals}the notes, the time of day)? End with a short, original poem-like reflection (not a quote) and one small invitation for next week. Keep it brief.',
    },
  },

  kabir: {
    id: 'kabir',
    name: 'Kabir',
    tagline: 'Plain words, open heart',
    moodLabels: { 1: 'Lost in fog', 2: 'Heavy', 3: 'Listening', 4: 'Singing', 5: 'In bloom' },
    moodEmoji: { 1: '🌫️', 2: '🌧️', 3: '🪔', 4: '🎶', 5: '🌸' },
    slotLabels: SLOT_LABEL,
    notePrompts: {
      morning: 'What will you listen for today?',
      afternoon: 'What are you searching for far away that is already near?',
      evening: 'What was simple and true today?',
    },
    burst: { high: ['🌸', '🎶', '✨'], mid: ['🪔'] },
    comfort: 'What you are looking for is nearer than your breath. Three slow breaths?',
    breathDone: 'Simple, and near 🪔',
    claude: {
      intro:
        'Reflect on my week in the spirit of Kabir: plain-spoken, warm and a little playful, cutting through pretence.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Say it simply, the way a weaver-poet would. Suggest one small, down-to-earth thing for next week. End with a two-line original verse (not a quote).',
    },
  },

  patanjali: {
    id: 'patanjali',
    name: 'Patanjali',
    tagline: 'Still the waves of the mind',
    moodLabels: { 1: 'Turbulent', 2: 'Restless', 3: 'Settling', 4: 'Clear', 5: 'Still' },
    moodEmoji: { 1: '🌪️', 2: '🌊', 3: '🍃', 4: '🔆', 5: '🧘' },
    slotLabels: SLOT_LABEL,
    notePrompts: {
      morning: 'What is your intention for practice today?',
      afternoon: 'What is the mind holding on to right now?',
      evening: 'Where did you meet today with steadiness and ease?',
    },
    burst: { high: ['🧘', '🔆', '✨'], mid: ['🍃'] },
    comfort: 'The waves of the mind rise and fall. Watch three slow breaths?',
    breathDone: 'Steady and at ease 🧘',
    claude: {
      intro:
        'Reflect on my week in the spirit of the Yoga Sutras of Patanjali: patient and non-judgmental, treating each mood as a movement of the mind to observe.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Gently point out where steady practice (abhyasa) helped and where letting go (vairagya) might. Suggest one small practice for next week. Keep it short.',
    },
  },
};

export type ActiveVoice = Voice & { quotes: Quote[] };

/** The voice with its quotes: the user's own if they've set any, otherwise the defaults. */
export function activeVoice(id: VoiceId, customQuotes: Partial<Record<VoiceId, Quote[]>>): ActiveVoice {
  const custom = customQuotes[id];
  return { ...VOICES[id], quotes: custom && custom.length > 0 ? custom : DEFAULT_QUOTES[id] };
}

/** The same quote all day, a different one tomorrow. `offset` lets the user tap through others. */
export function quoteOfTheDay(quotes: Quote[], date: string, offset = 0): Quote | null {
  if (quotes.length === 0) return null;
  let hash = 0;
  for (const ch of date) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return quotes[(hash + offset) % quotes.length];
}

/** Editor format: one quote per paragraph, with an optional last line "— source". */
export function formatQuotesText(quotes: Quote[]): string {
  return quotes.map((q) => (q.source ? `${q.text}\n— ${q.source}` : q.text)).join('\n\n');
}

export function parseQuotesText(text: string): Quote[] {
  return text
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const last = lines[lines.length - 1];
      const sourceMatch = lines.length > 1 ? /^(?:—|–|-{1,2})\s*(.+)$/.exec(last) : null;
      const textLines = sourceMatch ? lines.slice(0, -1) : lines;
      return {
        text: textLines.join(' '),
        ...(sourceMatch ? { source: sourceMatch[1].trim() } : {}),
      };
    });
}

export const VoiceContext = createContext<ActiveVoice>(activeVoice('plain', {}));

export const useVoice = () => useContext(VoiceContext);
