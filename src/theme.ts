import { createContext, useContext, useMemo } from 'react';

import { Mood } from './types';
import { Heading, ON_MOOD, VOICE_LOOKS } from './voicePalettes';
import type { VoiceId } from './voices';

export const THEMES = ['light', 'dim', 'dark'] as const;
export type ThemeName = (typeof THEMES)[number];

export const THEME_LABEL: Record<ThemeName, string> = {
  light: 'Light',
  dim: 'Dim',
  dark: 'Dark',
};

export type Palette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  danger: string;
  /** Whether the status bar needs light icons. */
  isDark: boolean;
  /** Mood 1–5 tile colours, low to high. */
  moodColors: Record<Mood, string>;
  /** Text on mood tiles. */
  onMood: string;
  /** Font for headings, greetings and slot titles. */
  heading: Heading;
};

/** Plain voice: a red-to-green scale, the same in every mode. */
export const moodColors: Record<Mood, string> = {
  1: '#F4B5AE',
  2: '#F8D3A6',
  3: '#F3E7A1',
  4: '#C9E6A8',
  5: '#9FD9A9',
};
const onMoodColor = '#1F1D1A';

const plainExtras = { moodColors, onMood: onMoodColor, heading: {} };

/** The plain voice's palettes. */
export const palettes: Record<ThemeName, Palette> = {
  light: {
    background: '#F7F5F2',
    surface: '#FFFFFF',
    text: '#1F1D1A',
    muted: '#77716A',
    border: '#E4DFD8',
    accent: '#5B4FCF',
    accentText: '#FFFFFF',
    danger: '#B3261E',
    isDark: false,
    ...plainExtras,
  },
  dim: {
    background: '#3A3F47',
    surface: '#464C55',
    text: '#F1EFEC',
    muted: '#C6C1BA',
    border: '#5A616B',
    accent: '#A69EF5',
    accentText: '#1F1D1A',
    danger: '#FFB4AB',
    isDark: true,
    ...plainExtras,
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#ECEAE6',
    muted: '#9A958E',
    border: '#2F2F2F',
    accent: '#9C93F0',
    accentText: '#121212',
    danger: '#FF8A80',
    isDark: true,
    ...plainExtras,
  },
};

export const spacing = (n: number) => n * 4;

/** The palette for a theme mode in a voice: each voice has its own Light, Dim and Dark tones. */
export function paletteFor(theme: ThemeName, voice: VoiceId): Palette {
  if (voice === 'plain') return palettes[theme];
  const look = VOICE_LOOKS[voice];
  return {
    ...look.modes[theme],
    isDark: palettes[theme].isDark,
    moodColors: look.moodColors,
    onMood: ON_MOOD,
    heading: look.heading,
  };
}

export const ThemeContext = createContext<Palette>(palettes.light);

export const useColors = () => useContext(ThemeContext);

/** Builds a component's styles from the current palette, rebuilt only when the theme changes. */
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const c = useColors();
  return useMemo(() => factory(c), [c, factory]);
}
