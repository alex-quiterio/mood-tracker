import { describe, expect, it } from '@jest/globals';

import { THEMES, paletteFor, palettes } from '../ui/theme/theme';
import { MOODS } from '../domain/checkins/types';
import { VOICE_IDS } from '../domain/voices/voices';

/** WCAG 2.x relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const cases = VOICE_IDS.flatMap((voice) => THEMES.map((theme) => [voice, theme] as const));

describe.each(cases)('%s in %s mode', (voice, theme) => {
  const p = paletteFor(theme, voice);

  it('has readable text (7:1)', () => {
    expect(contrast(p.text, p.background)).toBeGreaterThanOrEqual(7);
    expect(contrast(p.text, p.surface)).toBeGreaterThanOrEqual(7);
  });

  it('has readable secondary text and buttons (4.5:1)', () => {
    expect(contrast(p.muted, p.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.accentText, p.accent)).toBeGreaterThanOrEqual(4.5);
  });

  it('has a visible accent (3:1)', () => {
    expect(contrast(p.accent, p.surface)).toBeGreaterThanOrEqual(3);
  });

  it('has readable mood tiles (7:1)', () => {
    for (const m of MOODS) expect(contrast(p.onMood, p.moodColors[m])).toBeGreaterThanOrEqual(7);
  });

  it('matches the mode for the status bar', () => {
    expect(p.isDark).toBe(theme !== 'light');
  });
});

describe('palettes', () => {
  it('gives each voice its own accent in every mode', () => {
    for (const theme of THEMES) {
      const accents = VOICE_IDS.map((v) => paletteFor(theme, v).accent);
      expect(new Set(accents).size).toBe(accents.length);
    }
  });

  it('keeps the plain voice on the original palettes', () => {
    for (const theme of THEMES) expect(paletteFor(theme, 'plain')).toBe(palettes[theme]);
  });
});
