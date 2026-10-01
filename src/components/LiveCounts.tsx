import { StyleSheet, Text, View } from 'react-native';

import { Palette, spacing, useThemedStyles } from '../theme';
import { formatSince } from '../unlocks';

export type LiveCount = {
  icon: string;
  /** Already formatted, e.g. "12,480". */
  value: string;
  unit: string;
  from: Date;
  /** e.g. "Usually about 15". */
  usual: string | null;
};

/** Live unlocks and steps since the last check-in, side by side at the top of the check-in screen. */
export function LiveCounts({ counts, today }: { counts: LiveCount[]; today: string }) {
  const styles = useThemedStyles(makeStyles);
  if (counts.length === 0) return null;

  return (
    <View style={styles.card}>
      {counts.map((c, i) => (
        <View
          key={c.unit}
          style={[styles.block, i > 0 && styles.divider]}
          accessibilityLabel={`${c.value} ${c.unit} since ${formatSince(c.from, today)}`}
        >
          <View style={styles.valueRow}>
            <Text style={styles.icon}>{c.icon}</Text>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
              {c.value}
            </Text>
          </View>
          <Text style={styles.title}>
            {c.unit} since {formatSince(c.from, today)}
          </Text>
          <Text style={styles.subtitle}>{c.usual ?? 'Saved with your next check-in'}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: 16,
      paddingVertical: spacing(3),
      borderWidth: 1,
      borderColor: c.border,
    },
    block: { flex: 1, paddingHorizontal: spacing(4) },
    divider: { borderLeftWidth: 1, borderLeftColor: c.border },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    icon: { fontSize: 20 },
    value: { flexShrink: 1, fontSize: 30, fontWeight: '800', color: c.accent, fontVariant: ['tabular-nums'] },
    title: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 2 },
    subtitle: { fontSize: 12, color: c.muted, marginTop: 2 },
  });
