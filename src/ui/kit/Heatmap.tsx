import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Palette, radius, spacing, useColors, useThemedStyles, withAlpha } from '@ui/foundation/theme/theme';

import { Text } from './Text';

export type HeatCell = { value: number | null; n: number };

type Props = {
  rowLabels: string[];
  columnLabels: string[];
  /** cells[row][column]; a null value is a cell with nothing logged. */
  cells: HeatCell[][];
  /** The number written in a cell. */
  format: (value: number) => string;
  /** The line shown for a tapped cell (and read out by screen readers). */
  describe: (row: number, column: number) => string;
  hint: string;
};

/** A grid shaded by one hue, light to dark, each cell labelled with its number. Tap a cell for its detail. */
export function Heatmap({ rowLabels, columnLabels, cells, format, describe, hint }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const max = Math.max(0, ...cells.flat().map((cell) => cell.value ?? 0));
  // Lightest to darkest tint; capped so the number on top keeps its contrast in both modes.
  const tint = (v: number) => withAlpha(c.accent, 0.08 + (max > 0 ? (v / max) * 0.5 : 0));

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.rowLabel} />
        {columnLabels.map((l) => (
          <Text key={l} style={[styles.columnLabel, styles.cellWidth]} numberOfLines={1}>
            {l}
          </Text>
        ))}
      </View>
      {cells.map((row, r) => (
        <View key={rowLabels[r]} style={styles.row}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {rowLabels[r]}
          </Text>
          {row.map((cell, col) => {
            const on = selected?.[0] === r && selected?.[1] === col;
            return (
              <Pressable
                key={col}
                style={[
                  styles.cell,
                  styles.cellWidth,
                  cell.value === null
                    ? { borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }
                    : { backgroundColor: tint(cell.value) },
                  on && { borderWidth: 1.5, borderColor: c.accent },
                ]}
                onPress={() => setSelected(on ? null : [r, col])}
                accessibilityRole="button"
                accessibilityLabel={describe(r, col)}
              >
                <Text style={cell.value === null ? styles.empty : styles.value}>
                  {cell.value === null ? '·' : format(cell.value)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Text style={styles.detail}>{selected ? describe(selected[0], selected[1]) : hint}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: 3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    rowLabel: { width: 44, color: c.muted, fontSize: 12 },
    columnLabel: { color: c.muted, fontSize: 11, textAlign: 'center' },
    cellWidth: { flex: 1 },
    cell: { height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
    value: { color: c.text, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
    empty: { color: c.muted, fontSize: 12 },
    detail: { color: c.muted, fontSize: 13, textAlign: 'center', marginTop: spacing(1) },
  });
