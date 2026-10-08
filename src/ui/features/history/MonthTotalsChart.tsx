import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { DaySeries, MonthTotals } from '@domain/checkins/monthTotals';
import { Mood } from '@domain/checkins/types';
import {
  formatAverage,
  formatEuros,
  formatHours,
  formatInteger,
  formatMoney,
  longDate,
} from '@ui/foundation/i18n/format';
import { monthCaption } from '@ui/foundation/i18n/habits';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { formatStepsShort } from '@ui/foundation/i18n/signals';
import { Palette, spacing, useColors, useThemedStyles, radius, typeScale } from '@ui/foundation/theme/theme';

type Props = {
  totals: MonthTotals;
  selected: string;
  onSelect: (date: string) => void;
};

type Tile = {
  key: string;
  icon: string;
  value: string;
  caption: string;
  values: DaySeries;
  color?: (i: number) => string | undefined;
};

/** Everything logged in the month as small tiles, two to a row: a total over a strip of daily bars. */
export function MonthTotalsChart({ totals, selected, onSelect }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const t = m.monthTotals;

  const tiles: Tile[] = [
    {
      key: 'mood',
      icon: '🙂',
      value: formatAverage(totals.checkIns.average, locale),
      caption: t.checkIns(totals.checkIns.count, totals.checkIns.possible),
      values: totals.checkIns.perDay,
      color: (i) => {
        const mood = totals.moodPerDay[i];
        return mood === null ? undefined : c.moodColors[Math.round(mood) as Mood];
      },
    },
    ...(totals.steps
      ? [
          {
            key: 'steps',
            icon: '👟',
            value: formatStepsShort(totals.steps.total, locale),
            caption: t.steps,
            values: totals.steps.perDay,
          },
        ]
      : []),
    ...(totals.unlocks
      ? [
          {
            key: 'unlocks',
            icon: '📱',
            value: formatInteger(totals.unlocks.total, locale),
            caption: t.unlocks,
            values: totals.unlocks.perDay,
          },
        ]
      : []),
    ...(totals.sleep
      ? [
          {
            key: 'sleep',
            icon: '😴',
            value: m.sleep.hours(formatHours(totals.sleep.averageHours, locale)),
            caption: t.sleep(totals.sleep.nights),
            values: totals.sleep.perDay,
          },
        ]
      : []),
    ...totals.habits.map((h) => ({
      key: h.habit.id,
      icon: h.habit.emoji,
      value: String(h.winDays),
      caption: monthCaption(h.habit, h.total, locale),
      values: h.perDay,
    })),
    ...(totals.card
      ? [
          {
            key: 'card',
            icon: '💳',
            value: formatMoney(totals.card.total, totals.card.currency, locale),
            caption: m.statement.monthCaption(formatEuros(totals.card.estimate, locale)),
            values: totals.card.perDay,
          },
        ]
      : []),
    ...(totals.urges
      ? [
          {
            key: 'urges',
            icon: '🌊',
            value: String(totals.urges.total),
            caption: t.urges(totals.urges.passed),
            values: totals.urges.perDay,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t.title}</Text>
      {totals.checkIns.count === 0 && totals.urges === null && totals.card === null ? (
        <Text style={styles.muted}>{t.empty}</Text>
      ) : (
        <>
          <View style={styles.grid}>
            {tiles.map((tile) => (
              <View
                key={tile.key}
                style={styles.tile}
                accessible
                accessibilityLabel={`${tile.value} ${tile.caption}`}
              >
                <Text style={styles.value} numberOfLines={1}>
                  {tile.icon} {tile.value}
                </Text>
                <Text style={styles.caption} numberOfLines={2}>
                  {tile.caption}
                </Text>
                <DayBars
                  days={totals.days}
                  values={tile.values}
                  selected={selected}
                  onSelect={onSelect}
                  color={tile.color}
                />
              </View>
            ))}
          </View>
          {totals.saved > 0 && (
            <Text style={styles.caption}>{t.saved(formatEuros(totals.saved, locale))}</Text>
          )}
          <Text style={styles.muted}>{t.hint}</Text>
        </>
      )}
    </View>
  );
}

const BAR_HEIGHT = 18;

/** One bar per day, scaled to the month's highest day. A logged zero is a thin line; nothing logged, no bar. */
function DayBars({
  days,
  values,
  selected,
  onSelect,
  color,
}: {
  days: string[];
  values: DaySeries;
  selected: string;
  onSelect: (date: string) => void;
  color?: (i: number) => string | undefined;
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { locale } = useLocale();
  const max = Math.max(0, ...values.map((v) => v ?? 0));
  return (
    <View style={styles.bars}>
      {days.map((date, i) => {
        const v = values[i];
        const height = v === null ? 0 : max === 0 || v === 0 ? 1 : Math.max(2, (v / max) * BAR_HEIGHT);
        const isSelected = date === selected;
        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            accessibilityRole="button"
            accessibilityLabel={longDate(date, locale)}
            style={styles.slot}
          >
            {v !== null && (
              <View
                style={[
                  styles.bar,
                  { height, backgroundColor: v === 0 ? c.border : (color?.(i) ?? c.accent) },
                  !isSelected && selected.slice(0, 7) === date.slice(0, 7) && styles.notSelected,
                ]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: {
      gap: spacing(2),
      marginTop: spacing(3),
      paddingTop: spacing(3),
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    tile: {
      flexBasis: '45%',
      flexGrow: 1,
      padding: spacing(2),
      borderRadius: radius.sm,
      backgroundColor: c.background,
      gap: 2,
    },
    value: { color: c.text, fontSize: 16, fontWeight: '700' },
    caption: { color: c.muted, fontSize: 11, lineHeight: 14 },
    muted: { color: c.muted, fontSize: 12 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_HEIGHT, gap: 1, marginTop: spacing(1) },
    slot: { flex: 1, height: BAR_HEIGHT, justifyContent: 'flex-end' },
    bar: { borderTopLeftRadius: 1, borderTopRightRadius: 1 },
    notSelected: { opacity: 0.55 },
  });
