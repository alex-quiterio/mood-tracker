import { VoiceId } from '@domain/voices/voices';
import { VoiceText } from '@ui/foundation/voices/voices.types';

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
    levels: ['Beginner', 'Regular', 'Steady', 'Committed', 'Dedicated', 'Seasoned', 'Devoted', 'Master'],
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
    levels: [
      'Raindrop',
      'Trickle',
      'Brook',
      'Stream',
      'River',
      'Valley spirit',
      'Uncarved block',
      'Still lake',
    ],
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
    levels: [
      'Pupil',
      'Apprentice',
      'Student of nature',
      'Steady mind',
      'Guardian of the self',
      'Citadel',
      'Philosopher',
      'Emperor of the self',
    ],
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
    levels: [
      'Correspondent',
      'Friend',
      'Learner',
      'Steady friend',
      'Calm harbour',
      'Wise friend',
      'Sage in training',
      'Lifelong friend',
    ],
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
    levels: ['Guest', 'Traveller', 'Seeker', 'Lover', 'Whirler', 'Flame', 'Reed flute', 'Ocean'],
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
    levels: [
      'Listener',
      'Weaver',
      'Singer',
      'Plain heart',
      'Open door',
      'True word',
      'Bird in flight',
      'Full bloom',
    ],
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
    levels: [
      'Seated',
      'Breathing',
      'Practising',
      'Steady',
      'Focused',
      'Absorbed',
      'Still waters',
      'Clear seer',
    ],
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
    levels: [
      'Feeling',
      'Noticing',
      'Naming',
      'Speaking',
      'Grounded',
      'Powerful',
      'Warrior poet',
      'Fully alive',
    ],
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
    levels: ['Node', 'Thread', 'Pattern', 'Network', 'Web', 'Ecosystem', 'Living system', 'Whole'],
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
    levels: [
      'Seed',
      'Sprout',
      'Lamp lit',
      'Salt of the earth',
      'Shepherd',
      'Good soil',
      'Light on a hill',
      'Full harvest',
    ],
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
    levels: [
      'Traveller',
      'Patient one',
      'Grateful one',
      'Steadfast',
      'Gentle heart',
      'Generous hand',
      'Peaceful heart',
      'Lantern',
    ],
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
    levels: [
      'Seedling',
      'Lotus bud',
      'Mindful step',
      'Middle way',
      'Open hand',
      'Quiet mind',
      'Bodhi shade',
      'Awakened heart',
    ],
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
    levels: ['Spark', 'Breath', 'Drum', 'Rhythm', 'Dancer', 'Third eye', 'Stillness', 'Cosmic dance'],
    claude: {
      intro:
        'Reflect on my week in the spirit of Shiva as the yogi of stillness and the dance of change: calm and deep, honouring both endings and beginnings.',
      ask: 'What patterns do you notice ({signals}the notes, the time of day)? What might be ready to end, and what is trying to begin? Suggest one small practice of stillness for next week. Keep it short.',
    },
  },

  caeiro: {
    name: 'Alberto Caeiro',
    tagline: 'Just see',
    moodLabels: { 1: 'Fog', 2: 'Rain', 3: 'Open field', 4: 'Sunlit', 5: 'Open sun' },
    slotLabels: { morning: 'Morning', afternoon: 'Midday', evening: 'Dusk' },
    notePrompts: {
      morning: 'What did you see this morning, just for the seeing?',
      afternoon: 'What is simply here, right now?',
      evening: 'What did today show you, without explaining it?',
    },
    comfort: 'Rain is only rain. Let it fall for three slow breaths?',
    breathDone: 'The sun comes back by itself ☀️',
    levels: ['Seed', 'Grass', 'Lamb', 'Flock', 'Passing wind', 'Crook', 'Hilltop', 'Shepherd'],
    claude: {
      intro:
        'Reflect on my week in the spirit of Alberto Caeiro: plainly, through the senses, without metaphysics or judgment.',
      ask: 'What do you notice, as simply as possible (what I actually saw, where I was thinking instead of looking, {signals}anything in the notes)? Suggest one small thing to look at, or to stop thinking about, next week. Keep it short and plain, like a field.',
    },
  },

  nhatHanh: {
    name: 'Thich Nhat Hanh',
    tagline: 'Breathe and smile',
    moodLabels: { 1: 'Mud', 2: 'Clouded', 3: 'Breathing', 4: 'Smiling', 5: 'Lotus' },
    slotLabels: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
    notePrompts: {
      morning: 'What can you do today with your full attention?',
      afternoon: 'Where can you come back to your breath?',
      evening: 'What was there to smile at today?',
    },
    comfort: 'This feeling is a cloud passing. Breathe in, breathe out, three times with me?',
    breathDone: 'You are here, and that is enough 🪷',
    levels: [
      'Pebble',
      'Seed',
      'Mud',
      'One breath',
      'Mindful step',
      'Half smile',
      'Bell of mindfulness',
      'Lotus',
    ],
    claude: {
      intro:
        'Reflect on my week in the spirit of Thich Nhat Hanh: with mindfulness, compassion and a gentle smile.',
      ask: 'What do you notice (where I was present, where I was carried away, {signals}anything in the notes)? Suggest one small mindful practice for next week, like a breath or a walk. Keep it short and kind.',
    },
  },
};
