import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = {
  /** The arrow itself, like ‹ or ›. */
  label: string;
  /** What it does, for screen readers. */
  hint: string;
  disabled: boolean;
  onPress: () => void;
};

/** A small arrow to step back or forward, faded when there's nowhere to go. */
export function ArrowButton({ label, hint, disabled, onPress }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={[styles.arrow, disabled && styles.disabled]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    arrowText: { fontSize: 26, color: c.accent, lineHeight: 28 },
    disabled: { opacity: 0.3 },
  });
