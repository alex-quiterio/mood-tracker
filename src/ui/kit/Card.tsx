import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Palette, spacing, useThemedStyles, radius } from '@ui/foundation/theme/theme';

type Props = {
  children: ReactNode;
  /** Highlights the card with the accent border, e.g. the open check-in. */
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The rounded surface every section of the app sits on. */
export function Card({ children, accent, style }: Props) {
  const styles = useThemedStyles(makeStyles);
  return <View style={[styles.card, accent && styles.accent, style]}>{children}</View>;
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing(4),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: spacing(3),
    },
    accent: { borderColor: c.accent, borderWidth: 1.5 },
  });
