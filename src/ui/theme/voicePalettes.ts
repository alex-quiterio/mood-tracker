import type { Palette, ThemeName } from './theme';
import type { Mood } from '@domain/checkins/types';
import type { VoiceId } from '@domain/voices/voices';

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
  // Bold and warm: deep berry on earth tones; moods grow from rain to fire.
  lorde: {
    modes: {
      light: {
        background: '#F6EFE9',
        surface: '#FFFFFF',
        text: '#1F1418',
        muted: '#6E5A62',
        border: '#E6D7D3',
        accent: '#9E1F4F',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#33282C',
        surface: '#3F3237',
        text: '#F5EDEF',
        muted: '#C6B3BA',
        border: '#57474D',
        accent: '#F09BB9',
        accentText: '#1F1418',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#120C0E',
        surface: '#1D1417',
        text: '#F0E6E9',
        muted: '#A6939A',
        border: '#2E2226',
        accent: '#E886A9',
        accentText: '#120C0E',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#C2B4BC', 2: '#D3C0C4', 3: '#E6D3C2', 4: '#C9D8A6', 5: '#F2B17A' },
    heading: {},
  },
  // Moss, leaf and sky: the web of life; moods move from fallen leaves to open sky.
  capra: {
    modes: {
      light: {
        background: '#EFF3EE',
        surface: '#FFFFFF',
        text: '#14211B',
        muted: '#5B6A62',
        border: '#D5DFD6',
        accent: '#4A6B2A',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#26332E',
        surface: '#313F39',
        text: '#EBF2EE',
        muted: '#B0C2B8',
        border: '#465850',
        accent: '#B6D98C',
        accentText: '#14211B',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#0B1310',
        surface: '#141E1A',
        text: '#E4EEE9',
        muted: '#90A399',
        border: '#22302A',
        accent: '#A3CC72',
        accentText: '#0B1310',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#C3BBA8', 2: '#C2C8D6', 3: '#B9D9B6', 4: '#9FD3C9', 5: '#A9C8F0' },
    heading: {},
  },
  // Linen, olive wood and the lamplight of Galilee; moods lift from a stormy sea to a dove.
  jesus: {
    modes: {
      light: {
        background: '#F5F2EA',
        surface: '#FFFFFF',
        text: '#211A13',
        muted: '#6A6052',
        border: '#E2DBCC',
        accent: '#6E4E2E',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#322D27',
        surface: '#3E3832',
        text: '#F4EFE7',
        muted: '#C3B9AA',
        border: '#574F46',
        accent: '#E3BE8C',
        accentText: '#211A13',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#100D0A',
        surface: '#1A1612',
        text: '#EFE8DD',
        muted: '#A39785',
        border: '#2A241E',
        accent: '#D8AD74',
        accentText: '#100D0A',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#B7BCC4', 2: '#C9C7BC', 3: '#E6DCC4', 4: '#CAD6A2', 5: '#F0CF7E' },
    heading: { fontFamily: 'serif' },
  },
  // Desert sand, Islamic green and gold; moods follow the moon from new to full.
  muhammad: {
    modes: {
      light: {
        background: '#F4F1E8',
        surface: '#FFFFFF',
        text: '#142019',
        muted: '#5C665F',
        border: '#DDD8C9',
        accent: '#0E6B4A',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#23312B',
        surface: '#2E3E37',
        text: '#EEF3EF',
        muted: '#B3C2BA',
        border: '#44564E',
        accent: '#E2C46A',
        accentText: '#142019',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#0A1310',
        surface: '#121D18',
        text: '#E6EEE9',
        muted: '#8FA198',
        border: '#1F2E27',
        accent: '#D9B75A',
        accentText: '#0A1310',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#B9BCC6', 2: '#C7C9D4', 3: '#D9DCC0', 4: '#E9D69B', 5: '#F0C86E' },
    heading: { fontFamily: 'serif' },
  },
  // Temple stone and gold leaf; moods clear from cloud to lotus.
  buddha: {
    modes: {
      light: {
        background: '#F5F2EB',
        surface: '#FFFFFF',
        text: '#221D14',
        muted: '#6B6354',
        border: '#E2DCCD',
        accent: '#8A6100',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#33302A',
        surface: '#3F3B34',
        text: '#F4F0E7',
        muted: '#C4BCAD',
        border: '#57524A',
        accent: '#E8C35A',
        accentText: '#221D14',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#100E0A',
        surface: '#1A1813',
        text: '#EFE9DD',
        muted: '#A39A88',
        border: '#2A2720',
        accent: '#DDB548',
        accentText: '#100E0A',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#BFBBB3', 2: '#CEC6B8', 3: '#DCD8BC', 4: '#C6DCB0', 5: '#F1D27C' },
    heading: {},
  },
  // Sacred ash and the blue throat of Neelkanth; moods rise from storm to moonlit stillness.
  shiva: {
    modes: {
      light: {
        background: '#F1F1F3',
        surface: '#FFFFFF',
        text: '#181A26',
        muted: '#5E6172',
        border: '#DADBE2',
        accent: '#1A6B8A',
        accentText: '#FFFFFF',
        danger: '#A3261E',
      },
      dim: {
        background: '#2B2C38',
        surface: '#363745',
        text: '#EEEEF4',
        muted: '#B8B9C9',
        border: '#4C4D5E',
        accent: '#A9B8F2',
        accentText: '#181A26',
        danger: '#FFB4AB',
      },
      dark: {
        background: '#0D0D14',
        surface: '#16161F',
        text: '#E7E7EF',
        muted: '#9596A8',
        border: '#262633',
        accent: '#97A8EE',
        accentText: '#0D0D14',
        danger: '#FF8A80',
      },
    },
    moodColors: { 1: '#BDBFC9', 2: '#C6C3D6', 3: '#CFD9E3', 4: '#BCD6EA', 5: '#D9CCF2' },
    heading: { fontFamily: 'serif' },
  },
};

export { ON_MOOD };
