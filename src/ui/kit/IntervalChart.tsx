import { StyleSheet, View } from 'react-native';

import { Palette, spacing, useColors, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

import { Text } from './Text';

export type IntervalRow = {
  key: string;
  label: string;
  /** The estimate (a dot); null draws nothing but the text. */
  estimate: number | null;
  /** Its interval (a line through the dot); null for a single observation. */
  low?: number;
  high?: number;
  text: string;
};

type Props = {
  rows: IntervalRow[];
  /** The scale shared by every row, e.g. [0, 1] for rates. */
  domain: [number, number];
  /** A vertical line every row is read against, e.g. the overall rate, with its name. */
  reference?: { value: number; label: string };
};

const DOT = 10;

/**
 * Estimates with their intervals on one shared scale (a forest plot): a dot for the
 * estimate, a line for where the true value likely sits. Wide lines mean few
 * observations, so how sure to be is drawn, not just how much.
 */
export function IntervalChart({ rows, domain, reference }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [min, max] = domain;
  const at = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min || 1)) * 100))}%` as const;

  return (
    <View style={styles.root}>
      {rows.map((r) => (
        <View key={r.key} style={styles.row} accessible accessibilityLabel={`${r.label}: ${r.text}`}>
          <Text style={styles.label}>{r.label}</Text>
          <View style={styles.line}>
            <View style={styles.track}>
              <View style={[styles.axis, { backgroundColor: c.border }]} />
              {reference && <View style={[styles.reference, { left: at(reference.value) }]} />}
              {r.estimate !== null && r.low !== undefined && r.high !== undefined && (
                <View
                  style={[
                    styles.whisker,
                    {
                      left: at(r.low),
                      width: `${Math.max(0, ((Math.min(max, r.high) - Math.max(min, r.low)) / (max - min || 1)) * 100)}%`,
                      backgroundColor: withAlpha(c.accent, 0.45),
                    },
                  ]}
                />
              )}
              {r.estimate !== null && (
                <View
                  style={[
                    styles.dot,
                    { left: at(r.estimate), backgroundColor: c.accent, borderColor: c.surface },
                  ]}
                />
              )}
            </View>
            <Text style={styles.value}>{r.text}</Text>
          </View>
        </View>
      ))}
      {reference && (
        <View style={styles.legend}>
          <View style={styles.legendMark} />
          <Text style={styles.legendText}>{reference.label}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(2) },
    row: { gap: 2 },
    label: { color: c.text, fontSize: 13, fontWeight: '600' },
    line: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    track: { flex: 1, height: DOT + 4, justifyContent: 'center' },
    axis: { position: 'absolute', left: 0, right: 0, height: 1 },
    reference: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 0,
      borderLeftWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.muted,
      marginLeft: -0.5,
    },
    whisker: { position: 'absolute', height: 2, borderRadius: 1 },
    dot: {
      position: 'absolute',
      width: DOT,
      height: DOT,
      borderRadius: DOT / 2,
      marginLeft: -DOT / 2,
      borderWidth: 2,
    },
    value: { color: c.text, fontSize: 12, minWidth: 84, textAlign: 'right', fontVariant: ['tabular-nums'] },
    legend: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    legendMark: { width: 0, height: 12, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: c.muted },
    legendText: { color: c.muted, fontSize: 12 },
  });
