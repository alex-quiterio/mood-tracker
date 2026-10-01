import { VoiceId } from '@domain/voices/voices';
import { VoiceText } from '@ui/voices/voices.types';

/** Each voice's words in English. Emojis and bursts live with the voice styles (ui/voices). */
export const voices: Record<VoiceId, VoiceText> = {
  plain: {
    name: 'Plain',
    tagline: 'Simple and direct',
    moodLabels: { 1: 'Very low', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Very good' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'Add a note (optional)',
      afternoon: 'Add a note (optional)',
      evening: 'Add a note (optional)',
    },
    comfort: 'That sounds like a heavy moment. Take three slow breaths with me?',
    breathDone: 'That’s it. Be gentle with yourself 🌿',
    claude: {
      intro: '',
      ask: 'Please reflect on this week. What patterns do you notice (time of day, days of the week, {signals}anything in the notes)? Then suggest one small, concrete thing I could try next week. Keep it short and kind.',
    },
  },

  laoTzu: {
    name: 'Lao Tzu',
    tagline: 'Flow like water',
    moodLabels: { 1: 'Muddy water', 2: 'Choppy', 3: 'Flowing', 4: 'Clear stream', 5: 'Still lake' },
    slotLabels: { morning: 'Dawn', afternoon: 'Noon', evening: 'Dusk' },
    notePrompts: {
      morning: 'What can you leave undone today?',
      afternoon: 'Where are you forcing things?',
      evening: 'What did you let go of today?',
    },
    comfort: 'Muddy water clears when it is left still. Rest here for three slow breaths?',
    breathDone: 'The water settles on its own 🌊',
    claude: {
      intro:
        'Reflect on my week in the spirit of the Tao Te Ching: gently, without judgment, favouring yielding over forcing.',
      ask: 'What patterns do you notice (where I pushed against the current, where things flowed, {signals}anything in the notes)? Suggest one small thing I could let go of or do less of next week. Keep it short and simple, like water.',
    },
  },

  marcus: {
    name: 'Marcus Aurelius',
    tagline: 'Mind what is yours to control',
    moodLabels: { 1: 'Disturbed', 2: 'Unsettled', 3: 'Steady', 4: 'Composed', 5: 'Tranquil' },
    slotLabels: { morning: 'Morning', afternoon: 'Midday', evening: 'Evening' },
    notePrompts: {
      morning: 'What might you meet today, and how will you meet it?',
      afternoon: 'What here is within your control?',
      evening: 'What did you do well today? Where did you fall short?',
    },
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
    name: 'Seneca',
    tagline: 'Letters to a friend',
    moodLabels: { 1: 'Storm-tossed', 2: 'Restless', 3: 'Even', 4: 'At ease', 5: 'Serene' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'How will you spend today’s hours?',
      afternoon: 'What are you dreading that hasn’t happened?',
      evening: 'What did today teach you?',
    },
    comfort: 'A hard hour is easier shared. Write to yourself as to a friend, after three slow breaths?',
    breathDone: 'Be the friend you would write to ✉️',
    claude: {
      intro:
        'Reflect on my week as Seneca might in one of his letters to Lucilius: warm, practical and frank, like an old friend.',
      ask: 'What patterns do you notice in how I spent my time and attention ({signals}the notes, the time of day)? Point out any fear I may be borrowing from the future. Suggest one small, practical thing for next week. Write it as a short letter.',
    },
  },

  rumi: {
    name: 'Rumi',
    tagline: 'Every feeling is a guest',
    moodLabels: { 1: 'Night of longing', 2: 'Aching', 3: 'Searching', 4: 'Warm', 5: 'Ecstatic' },
    slotLabels: { morning: 'Dawn', afternoon: 'Day', evening: 'Night' },
    notePrompts: {
      morning: 'What has arrived in you this morning?',
      afternoon: 'What is your heart reaching for?',
      evening: 'What did today’s feelings come to show you?',
    },
    comfort: 'Even this feeling is a visitor. Sit with it for three slow breaths?',
    breathDone: 'Let the visitor rest a while 🕯️',
    claude: {
      intro:
        'Reflect on my week in the spirit of Rumi: tender and open-hearted, welcoming every feeling as a guest.',
      ask: 'What patterns do you notice in what my days held ({signals}the notes, the time of day)? End with a short, original poem-like reflection (not a quote) and one small invitation for next week. Keep it brief.',
    },
  },

  kabir: {
    name: 'Kabir',
    tagline: 'Plain words, open heart',
    moodLabels: { 1: 'Lost in fog', 2: 'Heavy', 3: 'Listening', 4: 'Singing', 5: 'In bloom' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What will you listen for today?',
      afternoon: 'What are you searching for far away that is already near?',
      evening: 'What was simple and true today?',
    },
    comfort: 'What you are looking for is nearer than your breath. Three slow breaths?',
    breathDone: 'Simple, and near 🪔',
    claude: {
      intro:
        'Reflect on my week in the spirit of Kabir: plain-spoken, warm and a little playful, cutting through pretence.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Say it simply, the way a weaver-poet would. Suggest one small, down-to-earth thing for next week. End with a two-line original verse (not a quote).',
    },
  },

  patanjali: {
    name: 'Patanjali',
    tagline: 'Still the waves of the mind',
    moodLabels: { 1: 'Turbulent', 2: 'Restless', 3: 'Settling', 4: 'Clear', 5: 'Still' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What is your intention for practice today?',
      afternoon: 'What is the mind holding on to right now?',
      evening: 'Where did you meet today with steadiness and ease?',
    },
    comfort: 'The waves of the mind rise and fall. Watch three slow breaths?',
    breathDone: 'Steady and at ease 🧘',
    claude: {
      intro:
        'Reflect on my week in the spirit of the Yoga Sutras of Patanjali: patient and non-judgmental, treating each mood as a movement of the mind to observe.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Gently point out where steady practice (abhyasa) helped and where letting go (vairagya) might. Suggest one small practice for next week. Keep it short.',
    },
  },

  lorde: {
    name: 'Audre Lorde',
    tagline: 'Feeling is a way of knowing',
    moodLabels: { 1: 'Depleted', 2: 'Guarded', 3: 'Present', 4: 'Grounded', 5: 'Alive' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What do you need to care for yourself today?',
      afternoon: 'What is your body telling you right now?',
      evening: 'What did you say today, and what did you leave unsaid?',
    },
    comfort: 'Caring for yourself is not a luxury. Three slow breaths, just for you?',
    breathDone: 'You are worth this care 🕯️',
    claude: {
      intro:
        'Reflect on my week in the spirit of Audre Lorde: direct, warm and unflinching, treating my feelings as a source of knowledge and caring for myself as necessary, not indulgent.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Name what my feelings might be telling me, plainly and without softening it into nothing. Suggest one small act of self-care for next week. Keep it short.',
    },
  },

  capra: {
    name: 'Fritjof Capra',
    tagline: 'Everything is connected',
    moodLabels: { 1: 'Disconnected', 2: 'Tangled', 3: 'Balanced', 4: 'Flowing', 5: 'In resonance' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What are you connected to today?',
      afternoon: 'What patterns are you part of right now?',
      evening: 'How did your day ripple out to others?',
    },
    comfort: 'You are part of a larger web, even now. Three slow breaths?',
    breathDone: 'Connected, breath by breath 🌿',
    claude: {
      intro:
        'Reflect on my week in the spirit of Fritjof Capra: as a systems thinker, seeing my moods as part of a web of relationships, rhythms and feedback loops.',
      ask: 'What patterns and feedback loops do you notice ({signals}the notes, the time of day, how one part of my day shapes the next)? Suggest one small change that could ripple through the whole system next week. Keep it short.',
    },
  },

  jesus: {
    name: 'Jesus',
    tagline: 'Enough for today',
    moodLabels: { 1: 'Weary', 2: 'Troubled', 3: 'At rest', 4: 'Hopeful', 5: 'Joyful' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What is enough for today?',
      afternoon: 'Who could use your kindness right now?',
      evening: 'What are you grateful for tonight?',
    },
    comfort: 'Come away and rest a while. Three slow breaths?',
    breathDone: 'Peace be with you 🕊️',
    claude: {
      intro:
        'Reflect on my week in the spirit of the teachings of Jesus in the Gospels: gentle, compassionate and hopeful, without preaching.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Where might I let go of worry about tomorrow, and where could kindness, to others or to myself, help? Suggest one small thing for next week. Keep it short.',
    },
  },

  muhammad: {
    name: 'Muhammad',
    tagline: 'Patience, gratitude and mercy',
    moodLabels: { 1: 'Burdened', 2: 'Restless', 3: 'Patient', 4: 'Grateful', 5: 'At peace' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What intention do you set for today?',
      afternoon: 'Where do you need patience right now?',
      evening: 'What are you thankful for today?',
    },
    comfort: 'With hardship comes ease. Three slow breaths?',
    breathDone: 'Peace be upon you 🌙',
    claude: {
      intro:
        "Reflect on my week in the spirit of the Prophet Muhammad's teachings of patience (sabr), gratitude (shukr) and mercy, respectfully and without claiming to speak for him.",
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Where did patience or gratitude carry me, and where might they help? Suggest one small, kind practice for next week. Keep it short.',
    },
  },

  buddha: {
    name: 'Buddha',
    tagline: 'The mind at peace',
    moodLabels: { 1: 'Clouded', 2: 'Agitated', 3: 'Mindful', 4: 'Content', 5: 'Serene' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What will you pay attention to today?',
      afternoon: 'What are you holding on to right now?',
      evening: 'Where did you meet yourself with kindness today?',
    },
    comfort: 'This too is passing. Three mindful breaths?',
    breathDone: 'Just this breath 🪷',
    claude: {
      intro:
        "Reflect on my week in the spirit of the Buddha's teachings in the Dhammapada: calm, clear and kind, noticing how thoughts shape moods.",
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? Gently point out where craving, aversion or a busy mind showed up, and where there was ease. Suggest one small mindful practice for next week. Keep it short.',
    },
  },

  shiva: {
    name: 'Shiva',
    tagline: 'Stillness that transforms',
    moodLabels: { 1: 'Scattered', 2: 'Turbulent', 3: 'Centered', 4: 'Still', 5: 'Radiant' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What are you ready to let go of today?',
      afternoon: 'Where can you be still within the movement?',
      evening: 'What ended today, and what began?',
    },
    comfort: 'Even storms pass over the mountain. Three slow breaths?',
    breathDone: 'Still as the mountain 🏔️',
    claude: {
      intro:
        'Reflect on my week in the spirit of Shiva as the yogi of stillness and the dance of change: calm and deep, honouring both endings and beginnings.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? What might be ready to end, and what is trying to begin? Suggest one small practice of stillness for next week. Keep it short.',
    },
  },
};
