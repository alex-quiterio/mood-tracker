import { StyleSheet, View } from 'react-native';

import { Palette, radius, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

import { Text } from './Text';

export type BarRow = {
  key: string;
  label: string;
  /** Drawn on a scale shared by every row; null draws no bar, only the text. */
  value: number | null;
  text: string;
};

const BAR = 10;

/** One horizontal bar per row on a shared scale, each labelled with its value. */
export function BarChart({ rows }: { rows: BarRow[] }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const max = Math.max(1, ...rows.map((r) => r.value ?? 0));
  const width = (value: number) => `${Math.max(value > 0 ? 2 : 0, (value / max) * 100)}%` as const;

  return (
    <View style={styles.root}>
      {rows.map((r) => (
        <View key={r.key} style={styles.row} accessible accessibilityLabel={`${r.label}: ${r.text}`}>
          <Text style={styles.label}>{r.label}</Text>
          <View style={styles.barLine}>
            <View style={styles.track}>
              {r.value !== null && (
                <View style={[styles.bar, { width: width(r.value), backgroundColor: c.accent }]} />
              )}
            </View>
            <Text style={[styles.value, r.value === null && styles.muted]}>{r.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(3) },
    row: { gap: 3 },
    label: { color: c.text, fontSize: 14, fontWeight: '600' },
    barLine: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    track: { flex: 1, height: BAR },
    bar: { height: BAR, borderRadius: radius.pill },
    value: { color: c.text, fontSize: 12, minWidth: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
    muted: { color: c.muted },
  });
