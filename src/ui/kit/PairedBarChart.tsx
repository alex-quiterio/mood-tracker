import { StyleSheet, View } from 'react-native';

import { Palette, radius, spacing, useColors, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

import { Text } from './Text';

export type PairedRow = {
  key: string;
  label: string;
  /** The two values, drawn on one shared scale, with their text shown at the bar's end. */
  first: number;
  second: number;
  firstText: string;
  secondText: string;
};

type Props = {
  rows: PairedRow[];
  /** Legend names for the two series, e.g. "Estimated" and "Spent". */
  firstName: string;
  secondName: string;
};

const BAR = 10;

/**
 * Two horizontal bars per row on one shared scale: the first a soft tint, the second
 * the accent. Every bar is labelled with its value, and the legend names both, so
 * colour is never the only cue.
 */
export function PairedBarChart({ rows, firstName, secondName }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const colors = { first: withAlpha(c.accent, 0.35), second: c.accent };
  const max = Math.max(1, ...rows.flatMap((r) => [r.first, r.second]));
  const width = (value: number) => `${Math.max(value > 0 ? 2 : 0, (value / max) * 100)}%` as const;

  return (
    <View style={styles.root}>
      <View style={styles.legend}>
        <Swatch color={colors.first} label={firstName} />
        <Swatch color={colors.second} label={secondName} />
      </View>
      {rows.map((r) => (
        <View
          key={r.key}
          style={styles.row}
          accessible
          accessibilityLabel={`${r.label}: ${firstName} ${r.firstText}, ${secondName} ${r.secondText}`}
        >
          <Text style={styles.label}>{r.label}</Text>
          {[
            { value: r.first, text: r.firstText, color: colors.first },
            { value: r.second, text: r.secondText, color: colors.second },
          ].map((bar, i) => (
            <View key={i} style={styles.barLine}>
              <View style={styles.track}>
                <View style={[styles.bar, { width: width(bar.value), backgroundColor: bar.color }]} />
              </View>
              <Text style={styles.value}>{bar.text}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(3) },
    legend: { flexDirection: 'row', gap: spacing(4) },
    swatchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    swatch: { width: 12, height: 12, borderRadius: 3 },
    legendText: { color: c.muted, fontSize: 12 },
    row: { gap: 3 },
    label: { color: c.text, fontSize: 14, fontWeight: '600' },
    barLine: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    track: { flex: 1, height: BAR },
    bar: { height: BAR, borderRadius: radius.pill },
    value: { color: c.text, fontSize: 12, minWidth: 56, textAlign: 'right', fontVariant: ['tabular-nums'] },
  });
