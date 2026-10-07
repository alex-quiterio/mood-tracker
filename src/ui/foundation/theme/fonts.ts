import { TextStyle } from 'react-native';

/**
 * The app's typefaces, embedded at build time by the expo-font plugin (app.json), where
 * each file's name is its family name. Figtree is the everyday sans; Fraunces is the
 * serif for headings in the classical voices (their `heading` asks for 'serif').
 * Each weight is its own file, so a style's fontWeight picks the file rather than
 * letting Android fake a bold.
 */
const SANS: Record<number, string> = {
  400: 'Figtree-Regular',
  500: 'Figtree-Medium',
  600: 'Figtree-SemiBold',
  700: 'Figtree-Bold',
  800: 'Figtree-ExtraBold',
};
const SERIF: Record<number, string> = {
  400: 'Fraunces-Regular',
  600: 'Fraunces-SemiBold',
  700: 'Fraunces-Bold',
};
const SERIF_ITALIC: Record<number, string> = { 400: 'Fraunces-Italic', 600: 'Fraunces-SemiBoldItalic' };

/** The closest weight a family has, preferring the heavier one on a tie. */
function closest(family: Record<number, string>, weight: number): string {
  const weights = Object.keys(family).map(Number);
  const best = weights.reduce((a, b) => (Math.abs(b - weight) <= Math.abs(a - weight) ? b : a));
  return family[best];
}

const weightOf = (w: TextStyle['fontWeight']): number =>
  w === undefined || w === 'normal' ? 400 : w === 'bold' ? 700 : Number(w) || 400;

/**
 * The font file for a text style: Figtree unless it asks for 'serif', at the nearest
 * weight. Any other family (e.g. monospace) is left alone.
 */
export function fontFor(style: TextStyle): TextStyle | null {
  if (style.fontFamily && style.fontFamily !== 'serif') return null;
  const weight = weightOf(style.fontWeight);
  if (style.fontFamily === 'serif') {
    const italic = style.fontStyle === 'italic';
    return {
      fontFamily: closest(italic ? SERIF_ITALIC : SERIF, weight),
      fontWeight: 'normal',
      fontStyle: 'normal',
    };
  }
  return { fontFamily: closest(SANS, weight), fontWeight: 'normal' };
}
