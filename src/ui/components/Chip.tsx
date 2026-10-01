import { Pressable, StyleSheet, Text } from 'react-native';

import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** A choice among several (radio), an independent toggle (checkbox), or an action (button). */
  role?: 'radio' | 'checkbox' | 'button';
  accessibilityLabel?: string;
};

/** A pill to pick or toggle something. */
export function Chip({ label, selected, onPress, role = 'radio', accessibilityLabel }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={
        role === 'radio' ? { selected } : role === 'checkbox' ? { checked: selected } : undefined
      }
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    chip: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    selected: { backgroundColor: c.accent, borderColor: c.accent },
    text: { color: c.text, fontSize: 14 },
    textSelected: { color: c.accentText, fontWeight: '600' },
  });
