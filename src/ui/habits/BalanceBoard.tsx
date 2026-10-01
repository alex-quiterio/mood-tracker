import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WeekBalance, compareWithLastWeek, formatPoints } from '@domain/habits/balance';
import { weekdayShort } from '@domain/shared/dates';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';

/**
 * Light vs heavy, a diverging pair checked for colour-blind separation and
 * contrast in both modes. Blue/orange rather than green/red: red reads as alarm,
 * and this board is about encouragement.
 */
export const balanceColors = (isDark: boolean) =>
  isDark ? { light: '#5B93E0', heavy: '#BF7A33' } : { light: '#2B6CC4', heavy: '#C77A1E' };

const HALF = 56; // px each side of the baseline

/** The week's balance: a hero number, then a diverging bar per day (light up, heavy down). */
export function BalanceBoard({ week }: { week: WeekBalance }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const colors = balanceColors(c.isDark);
  const [selected, setSelected] = useState<string | null>(null);
  const scale = Math.max(1, ...week.days.map((d) => Math.max(d.light, d.heavy)));
  const comparison = compareWithLastWeek(week.net, week.previousNet);
  const picked = week.days.find((d) => d.date === selected);

  if (!week.days.some((d) => d.logged)) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>⚖️ Balance</Text>
        <Text style={styles.muted}>Log habits with a check-in to see your balance of light and heavy.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.heroRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>⚖️ Balance</Text>
          {week.verdict && (
            <Text style={styles.verdict}>
              {week.verdict.emoji} {week.verdict.label}
            </Text>
          )}
        </View>
        <View style={styles.heroNumber}>
          <Text style={styles.hero}>{formatPoints(week.net)}</Text>
          <Text style={styles.muted}>this week</Text>
        </View>
      </View>

      <View style={styles.totals}>
        <Legend color={colors.light} label={`🌱 Light ${week.light}`} />
        <Legend color={colors.heavy} label={`🪨 Heavy ${week.heavy}`} />
      </View>

      <View
        style={styles.chart}
        accessibilityLabel={`Balance by day: ${week.days.map((d) => `${weekdayShort(d.date)} ${formatPoints(d.net)}`).join(', ')}`}
      >
        <View style={styles.baseline} />
        {week.days.map((d) => (
          <Pressable
            key={d.date}
            style={styles.column}
            onPress={() => setSelected(d.date === selected ? null : d.date)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`${weekdayShort(d.date)}: light ${d.light}, heavy ${d.heavy}`}
          >
            <View style={styles.half}>
              {d.light > 0 && (
                <View
                  style={[styles.barUp, { height: (d.light / scale) * HALF, backgroundColor: colors.light }]}
                />
              )}
            </View>
            <View style={[styles.half, styles.halfDown]}>
              {d.heavy > 0 && (
                <View
                  style={[
                    styles.barDown,
                    { height: (d.heavy / scale) * HALF, backgroundColor: colors.heavy },
                  ]}
                />
              )}
            </View>
            <Text
              style={[styles.day, d.date === selected && styles.daySelected, !d.logged && styles.dayEmpty]}
            >
              {weekdayShort(d.date)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.detail}>
        {picked
          ? `${weekdayShort(picked.date)}: 🌱 ${picked.light} light · 🪨 ${picked.heavy} heavy · net ${formatPoints(picked.net)}`
          : (comparison ?? 'Tap a day to see its points.')}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.legend}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    flex: { flex: 1 },
    title: { fontSize: 17, fontWeight: '600', color: c.text, ...c.heading },
    muted: { color: c.muted, fontSize: 13 },
    heroRow: { flexDirection: 'row', alignItems: 'flex-start' },
    verdict: { color: c.text, marginTop: spacing(1) },
    heroNumber: { alignItems: 'flex-end' },
    hero: { fontSize: 34, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] },
    totals: { flexDirection: 'row', gap: spacing(4) },
    legend: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    swatch: { width: 12, height: 12, borderRadius: 3 },
    legendText: { color: c.text, fontSize: 13, fontVariant: ['tabular-nums'] },
    chart: { flexDirection: 'row', gap: 2, paddingTop: spacing(1) },
    baseline: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: spacing(1) + HALF,
      height: 1,
      backgroundColor: c.border,
    },
    column: { flex: 1, alignItems: 'center' },
    half: { height: HALF, width: '70%', justifyContent: 'flex-end' },
    halfDown: { justifyContent: 'flex-start' },
    barUp: { borderTopLeftRadius: 4, borderTopRightRadius: 4, marginBottom: 1 },
    barDown: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginTop: 1 },
    day: { fontSize: 11, color: c.muted, marginTop: spacing(1) },
    daySelected: { color: c.text, fontWeight: '700' },
    dayEmpty: { opacity: 0.5 },
    detail: { color: c.muted, fontSize: 13, textAlign: 'center', fontVariant: ['tabular-nums'] },
  });
