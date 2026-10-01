import { Mood } from './types';

export const colors = {
  background: '#F7F5F2',
  surface: '#FFFFFF',
  text: '#1F1D1A',
  muted: '#77716A',
  border: '#E4DFD8',
  accent: '#5B4FCF',
  accentText: '#FFFFFF',
  danger: '#B3261E',
};

/** Red-to-green scale, readable with dark text. */
export const moodColors: Record<Mood, string> = {
  1: '#F4B5AE',
  2: '#F8D3A6',
  3: '#F3E7A1',
  4: '#C9E6A8',
  5: '#9FD9A9',
};

export const spacing = (n: number) => n * 4;
