import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@ui/kit/Card';
import { WeekBalance, changeFromLastWeek, formatPoints } from '@domain/habits/balance';
import { changeText, verdictLabel } from '@ui/foundation/i18n/balance';
import { weekdayShort } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

/**
 * Light vs heavy, a diverging pair checked for colour-blind separation and
 * contrast in both modes. Blue/orange rather than green/red: red reads as alarm,
 * and this board is about encouragement.
 */
export const balanceColors = (isDark: boolean) =>
  isDark ? { light: '#5B93E0', heavy: '#BF7A33' } : { light: '#2B6CC4', heavy: '#C77A1E' };

const HALF = 56; // px each side of the baseline

/** The week's balance: a hero number, then a diverging bar per day (light up, heavy down). */
/** `past` when the week shown isn't the current one, so the wording says "that week". */
export function BalanceBoard({ week, past = false }: { week: WeekBalance; past?: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const colors = balanceColors(c.isDark);
  const [selected, setSelected] = useState<string | null>(null);
  const scale = Math.max(1, ...week.days.map((d) => Math.max(d.light, d.heavy)));
  const { m, locale } = useLocale();
  const day = (date: string) => weekdayShort(date, locale);
  const comparison = changeText(changeFromLastWeek(week.net, week.previousNet), locale, past);
  const picked = week.days.find((d) => d.date === selected);

  if (!week.days.some((d) => d.logged)) {
    return (
      <Card>
        <Text style={styles.title}>{m.balance.title}</Text>
        <Text style={styles.muted}>{m.balance.empty}</Text>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.heroRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>{m.balance.title}</Text>
          {week.verdict && (
            <Text style={styles.verdict}>
              {week.verdict.emoji} {verdictLabel(week.verdict, locale)}
            </Text>
          )}
        </View>
        <View style={styles.heroNumber}>
          <Text style={styles.hero}>{formatPoints(week.net)}</Text>
          <Text style={styles.muted}>{past ? m.balance.thatWeek : m.balance.thisWeek}</Text>
        </View>
      </View>

      <View style={styles.totals}>
        <Legend color={colors.light} label={m.balance.light(week.light)} />
        <Legend color={colors.heavy} label={m.balance.heavy(week.heavy)} />
      </View>

      <View
        style={styles.chart}
        accessibilityLabel={m.balance.chartA11y(
          week.days.map((d) => `${day(d.date)} ${formatPoints(d.net)}`).join(', '),
        )}
      >
        <View style={styles.baseline} />
        {week.days.map((d) => (
          <Pressable
            key={d.date}
            style={styles.column}
            onPress={() => setSelected(d.date === selected ? null : d.date)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={m.balance.barA11y(day(d.date), d.light, d.heavy)}
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
              {day(d.date)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.detail}>
        {picked
          ? m.balance.dayDetail(day(picked.date), picked.light, picked.heavy, formatPoints(picked.net))
          : (comparison ?? m.balance.tapDay)}
      </Text>
    </Card>
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
