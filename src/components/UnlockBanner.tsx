import { StyleSheet, Text, View } from 'react-native';

import { Palette, spacing, useThemedStyles } from '../theme';
import { UnlockPreview, formatSince } from '../unlocks';

type Props = {
  preview: UnlockPreview;
  today: string;
  /** Average unlocks between check-ins over the last week, if known. */
  usual: number | null;
};

/** The live unlock count since the last check-in, shown big at the top of the check-in screen. */
export function UnlockBanner({ preview, today, usual }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { count, from } = preview;
  return (
    <View
      style={styles.banner}
      accessibilityLabel={`${count} phone unlocks since ${formatSince(from, today)}`}
    >
      <Text style={styles.icon}>📱</Text>
      <Text style={styles.count}>{count}</Text>
      <View style={styles.text}>
        <Text style={styles.title}>
          {count === 1 ? 'unlock' : 'unlocks'} since {formatSince(from, today)}
        </Text>
        <Text style={styles.subtitle}>
          {usual === null
            ? 'Saved with your next check-in'
            : `Usually about ${Math.round(usual)} between check-ins`}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: spacing(3),
      paddingHorizontal: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
    },
    icon: { fontSize: 22 },
    count: { fontSize: 34, fontWeight: '800', color: c.accent, fontVariant: ['tabular-nums'] },
    text: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: c.text },
    subtitle: { fontSize: 13, color: c.muted, marginTop: 2 },
  });
