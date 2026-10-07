import { StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

import { Palette, radius, spacing, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

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
    <PressableScale
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
    </PressableScale>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      paddingVertical: spacing(3) + 2,
      paddingHorizontal: spacing(5),
      borderRadius: radius.pill,
      alignItems: 'center',
    },
    primary: { backgroundColor: c.accent },
    secondary: { backgroundColor: withAlpha(c.accent, 0.1) },
    dimmed: { opacity: 0.6 },
    text: { fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
    primaryText: { color: c.accentText },
    secondaryText: { color: c.accent },
  });
