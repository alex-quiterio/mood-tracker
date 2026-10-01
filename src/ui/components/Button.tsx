import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
  const styles = useThemedStyles(makeStyles);
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.text, primary ? styles.primaryText : styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(4),
      borderRadius: 12,
      alignItems: 'center',
    },
    primary: { backgroundColor: c.accent },
    secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    dimmed: { opacity: 0.6 },
    text: { fontSize: 16, fontWeight: '600' },
    primaryText: { color: c.accentText },
    secondaryText: { color: c.text },
  });
