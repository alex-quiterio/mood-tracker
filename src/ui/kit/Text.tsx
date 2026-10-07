import { Text as NativeText, StyleSheet, TextProps } from 'react-native';

import { fontFor } from '@ui/foundation/theme/fonts';

/** React Native's Text in the app's typefaces: the style's weight and family pick the font file. */
export function Text({ style, ...props }: TextProps) {
  const font = fontFor(StyleSheet.flatten(style) ?? {});
  return <NativeText {...props} style={font ? [style, font] : style} />;
}
