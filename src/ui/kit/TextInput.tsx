import { forwardRef } from 'react';
import { TextInput as NativeTextInput, StyleSheet, TextInputProps } from 'react-native';

import { fontFor } from '@ui/foundation/theme/fonts';

/** React Native's TextInput in the app's typefaces, like Text. */
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref,
) {
  const font = fontFor(StyleSheet.flatten(style) ?? {});
  return <NativeTextInput ref={ref} {...props} style={font ? [style, font] : style} />;
});
