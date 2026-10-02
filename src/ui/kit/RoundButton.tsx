import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
};

/** A small round button, such as − and + next to a number. */
export function RoundButton({ label, accessibilityLabel, onPress, disabled, size = 32 }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    button: {
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 18, lineHeight: 20, color: c.accent, fontWeight: '600' },
    dimmed: { opacity: 0.35 },
  });
