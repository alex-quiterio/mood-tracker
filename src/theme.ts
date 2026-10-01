import { createContext, useContext, useMemo } from 'react';

import { Mood } from './types';

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
};

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
  },
  dim: {
    background: '#3A3F47',
    surface: '#464C55',
    text: '#F1EFEC',
    muted: '#BDB8B1',
    border: '#5A616B',
    accent: '#A69EF5',
    accentText: '#1F1D1A',
    danger: '#FFB4AB',
    isDark: true,
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
  },
};

/** Red-to-green scale, the same in every theme. Text on these always uses `onMoodColor`. */
export const moodColors: Record<Mood, string> = {
  1: '#F4B5AE',
  2: '#F8D3A6',
  3: '#F3E7A1',
  4: '#C9E6A8',
  5: '#9FD9A9',
};
export const onMoodColor = '#1F1D1A';

export const spacing = (n: number) => n * 4;

export const ThemeContext = createContext<Palette>(palettes.light);

export const useColors = () => useContext(ThemeContext);

/** Builds a component's styles from the current palette, rebuilt only when the theme changes. */
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const c = useColors();
  return useMemo(() => factory(c), [c, factory]);
}
