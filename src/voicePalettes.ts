import type { Palette, ThemeName } from './theme';
import type { Mood } from './types';
import type { VoiceId } from './voices';

type Tones = Omit<Palette, 'moodColors' | 'onMood' | 'heading' | 'isDark'>;

export type Heading = { fontFamily?: string; fontStyle?: 'normal' | 'italic' };

export type VoiceLook = {
  /** One set of tones per theme mode. */
  modes: Record<ThemeName, Tones>;
  /** Low to high, drawn from the voice's world. Text on them is always `onMood`. */
  moodColors: Record<Mood, string>;
  /** Headings: a serif for the classical voices, the system font for the plain-spoken ones. */
  heading: Heading;
};

const ON_MOOD = '#1C1A17';

/**
 * Colours for every voice in every mode. All pairs pass WCAG contrast (checked in
 * tests): text 7:1, muted text and buttons 4.5:1, text on mood colours 7:1.
 */
export const VOICE_LOOKS: Record<Exclude<VoiceId, 'plain'>, VoiceLook> = {
  // Sumi ink on rice paper, with a cinnabar seal; moods run from muddy water to a still, clear lake.
  laoTzu: {
    modes: {
      light: {
        background: '#F3EEE3',
        surface: '#FAF7F0',
        text: '#1C1A17',
        muted: '#6B645A',
        border: '#DDD4C4',
        accent: '#A8352A',
        accentText: '#FFF7EE',
        danger: '#A8352A',
      },
      dim: {
        background: '#2C2B28',
        surface: '#383632',
        text: '#EEE8DC',
        muted: '#BCB3A3',
        border: '#4C4943',
        accent: '#E8846C',
        accentText: '#1C1A17',
        danger: '#FFB4A6',
      },
      dark: {
        background: '#0F0E0C',
        surface: '#1A1916',
        text: '#E8E1D3',
        muted: '#A0978A',
        border: '#2A2824',
        accent: '#DA6A54',
        accentText: '#0F0E0C',
        danger: '#FF9E8A',
      },
    },
    moodColors: { 1: '#C2B096', 2: '#CFC8A2', 3: '#BDD6B4', 4: '#A6D2C0', 5: '#96CACB' },
    heading: { fontFamily: 'serif' },
  },
  // Roman marble and Tyrian purple; moods rise from storm grey to laurel gold.
  marcus: {
    modes: {
      light: {
        background: '#F4F1EC',
        surface: '#FFFFFF',
        text: '#24202A',
        muted: '#6A6371',
        border: '#DED8CF',
        accent: '#66234F',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#34303A',
        surface: '#403B47',
        text: '#F0ECF2',
        muted: '#C2B9C9',
        border: '#554E5E',
        accent: '#DBA4C8',
        accentText: '#24202A',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#121014',
        surface: '#1C191F',
        text: '#ECE7EE',
        muted: '#A39AAA',
        border: '#2B2730',
        accent: '#CE90BB',
        accentText: '#121014',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#BEB9C7', 2: '#D3CBD3', 3: '#E5DCC9', 4: '#EAD3A2', 5: '#DEBE78' },
    heading: { fontFamily: 'serif' },
  },
  // Parchment, iron-gall ink and an oxblood wax seal; moods warm toward candlelight.
  seneca: {
    modes: {
      light: {
        background: '#F5ECDC',
        surface: '#FBF5E9',
        text: '#2A2118',
        muted: '#735F4C',
        border: '#E3D3B9',
        accent: '#7B2E26',
        accentText: '#FFFFFF',
        danger: '#9E2A20',
      },
      dim: {
        background: '#3A3229',
        surface: '#463D33',
        text: '#F3EADB',
        muted: '#C8B8A1',
        border: '#5C5144',
        accent: '#E6A28E',
        accentText: '#2A2118',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#14100C',
        surface: '#1F1913',
        text: '#EEE3D1',
        muted: '#A8977F',
        border: '#30271E',
        accent: '#D88B77',
        accentText: '#14100C',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#CDBDAB', 2: '#DCCAA9', 3: '#E8D9B3', 4: '#E7CD92', 5: '#ECBE74' },
    heading: { fontFamily: 'serif', fontStyle: 'italic' },
  },
  // Persian blue and turquoise tilework; moods move from night through rose to a saffron sun.
  rumi: {
    modes: {
      light: {
        background: '#F6F1EA',
        surface: '#FFFFFF',
        text: '#1E2333',
        muted: '#626A80',
        border: '#E2DBD0',
        accent: '#1C4F96',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#263043',
        surface: '#313C52',
        text: '#EEF1F6',
        muted: '#B6C0D1',
        border: '#46526A',
        accent: '#86D6D5',
        accentText: '#14202E',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#0C1220',
        surface: '#151D2E',
        text: '#E7ECF4',
        muted: '#95A0B4',
        border: '#24304A',
        accent: '#62C9C8',
        accentText: '#0C1220',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#AFB8CF', 2: '#D9AEBA', 3: '#EACDB9', 4: '#F2AFB3', 5: '#F6CB82' },
    heading: { fontFamily: 'serif' },
  },
  // Hand-loomed cotton, indigo dye and marigolds; moods lift from fog to full bloom.
  kabir: {
    modes: {
      light: {
        background: '#F7F1E6',
        surface: '#FFFDF8',
        text: '#1D2340',
        muted: '#5F6580',
        border: '#E5DCC9',
        accent: '#2E3A87',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#2B2F4A',
        surface: '#363B5A',
        text: '#F2EFE6',
        muted: '#BDBED3',
        border: '#4A4F72',
        accent: '#F2A541',
        accentText: '#1D2340',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#0E1022',
        surface: '#171A33',
        text: '#EDE9DE',
        muted: '#9DA1BC',
        border: '#262A4A',
        accent: '#EE9A2E',
        accentText: '#0E1022',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#BCC0CE', 2: '#C8CDDD', 3: '#ECDCB3', 4: '#F3CA84', 5: '#F5AA61' },
    heading: {},
  },
  // Saffron and ochre at a Himalayan dawn; moods settle into lotus pink.
  patanjali: {
    modes: {
      light: {
        background: '#F8F2EA',
        surface: '#FFFFFF',
        text: '#2B1E16',
        muted: '#766558',
        border: '#EADBCB',
        accent: '#A64B17',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#3A2F2A',
        surface: '#473A33',
        text: '#F6EEE7',
        muted: '#CDBBAC',
        border: '#5E4D43',
        accent: '#F2AE80',
        accentText: '#2B1E16',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#130E0B',
        surface: '#1E1712',
        text: '#F0E6DC',
        muted: '#AA998A',
        border: '#2F241D',
        accent: '#EA9A66',
        accentText: '#130E0B',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#CDB8AD', 2: '#DCC4B3', 3: '#E9D8BC', 4: '#F1CDC8', 5: '#F3BECB' },
    heading: { fontFamily: 'serif' },
  },
};

export { ON_MOOD };
