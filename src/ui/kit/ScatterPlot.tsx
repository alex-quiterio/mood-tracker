import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Palette, spacing, useColors, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

import { Text } from './Text';

export type ScatterPoint = { x: number; y: number };

type Props = {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  /** Read out instead of the dots. */
  accessibilityLabel: string;
};

const HEIGHT = 120;
const DOT = 9;

/**
 * One dot per observation on two axes, y from zero. Dots are see-through, so days that
 * land on the same spot read darker instead of hiding each other.
 */
export function ScatterPlot({ points, xLabel, yLabel, formatX, formatY, accessibilityLabel }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [width, setWidth] = useState(0);
  const xs = points.map((p) => p.x);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMax = Math.max(1, ...points.map((p) => p.y));
  const x = (v: number) =>
    xMax === xMin ? width / 2 : ((v - xMin) / (xMax - xMin)) * (width - DOT) + DOT / 2;
  const y = (v: number) => HEIGHT - DOT / 2 - (v / yMax) * (HEIGHT - DOT);

  return (
    <View style={styles.root} accessible accessibilityLabel={accessibilityLabel}>
      <Text style={styles.axisName}>{yLabel}</Text>
      <View style={styles.plotRow}>
        <View style={styles.yTicks}>
          <Text style={styles.tick}>{formatY(yMax)}</Text>
          <Text style={styles.tick}>{formatY(0)}</Text>
        </View>
        <View
          style={[styles.plot, { borderColor: c.border }]}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {width > 0 &&
            points.map((p, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    left: x(p.x) - DOT / 2,
                    top: y(p.y) - DOT / 2,
                    backgroundColor: withAlpha(c.accent, 0.45),
                    borderColor: c.accent,
                  },
                ]}
              />
            ))}
        </View>
      </View>
      <View style={styles.xTicks}>
        <Text style={styles.tick}>{formatX(xMin)}</Text>
        <Text style={styles.axisName}>{xLabel}</Text>
        <Text style={styles.tick}>{formatX(xMax)}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: 2 },
    plotRow: { flexDirection: 'row', gap: spacing(1) },
    yTicks: { justifyContent: 'space-between', width: 28 },
    plot: { flex: 1, height: HEIGHT, borderLeftWidth: 1, borderBottomWidth: 1 },
    dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 1 },
    xTicks: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 28 + spacing(1) },
    tick: { color: c.muted, fontSize: 11, fontVariant: ['tabular-nums'], textAlign: 'right' },
    axisName: { color: c.muted, fontSize: 11 },
  });
