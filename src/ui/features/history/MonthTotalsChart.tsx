import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DaySeries, MonthTotals } from '@domain/checkins/monthTotals';
import { Mood } from '@domain/checkins/types';
import { formatAverage, formatEuros, formatHours, longDate } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { formatSteps } from '@ui/foundation/i18n/signals';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = {
  totals: MonthTotals;
  selected: string;
  onSelect: (date: string) => void;
};

/** Everything logged in the month, each total over a row of small daily bars. */
export function MonthTotalsChart({ totals, selected, onSelect }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const t = m.monthTotals;
  const bars = (values: DaySeries, color?: (i: number) => string | undefined) => (
    <DayBars days={totals.days} values={values} selected={selected} onSelect={onSelect} color={color} />
  );

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{t.title}</Text>
      {totals.checkIns.count === 0 && totals.urges === null ? (
        <Text style={styles.muted}>{t.empty}</Text>
      ) : (
        <>
          <Row
            label={t.checkIns(
              totals.checkIns.count,
              totals.checkIns.possible,
              formatAverage(totals.checkIns.average, locale),
            )}
          >
            {bars(totals.checkIns.perDay, (i) => {
              const mood = totals.moodPerDay[i];
              return mood === null ? undefined : c.moodColors[Math.round(mood) as Mood];
            })}
          </Row>
          {totals.steps && (
            <Row label={t.steps(formatSteps(totals.steps.total, locale))}>{bars(totals.steps.perDay)}</Row>
          )}
          {totals.unlocks && (
            <Row label={t.unlocks(formatSteps(totals.unlocks.total, locale))}>
              {bars(totals.unlocks.perDay)}
            </Row>
          )}
          {totals.sleep && (
            <Row
              label={t.sleep(
                m.sleep.hours(formatHours(totals.sleep.averageHours, locale)),
                totals.sleep.nights,
              )}
            >
              {bars(totals.sleep.perDay)}
            </Row>
          )}
          {totals.habits.map((h) => (
            <Row
              key={h.habit.id}
              label={
                h.habit.kind === 'reduce'
                  ? t.reduce(h.habit.emoji, h.habit.name, h.winDays, h.total, h.habit.unit)
                  : t.grow(h.habit.emoji, h.habit.name, h.winDays)
              }
            >
              {bars(h.perDay)}
            </Row>
          ))}
          {totals.urges && (
            <Row label={t.urges(totals.urges.total, totals.urges.passed)}>{bars(totals.urges.perDay)}</Row>
          )}
          {totals.saved > 0 && <Text style={styles.label}>{t.saved(formatEuros(totals.saved, locale))}</Text>}
          <Text style={styles.muted}>{t.hint}</Text>
        </>
      )}
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const BAR_HEIGHT = 28;

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
    <View style={styles.bars} importantForAccessibility="no-hide-descendants">
      {days.map((date, i) => {
        const v = values[i];
        const height = v === null ? 0 : max === 0 || v === 0 ? 2 : Math.max(3, (v / max) * BAR_HEIGHT);
        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            accessibilityLabel={longDate(date, locale)}
            style={styles.slot}
          >
            {v !== null && (
              <View
                style={[
                  styles.bar,
                  { height, backgroundColor: v === 0 ? c.border : (color?.(i) ?? c.accent) },
                  date === selected && styles.selectedBar,
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
      gap: spacing(3),
      marginTop: spacing(3),
      paddingTop: spacing(3),
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    title: { fontSize: 15, fontWeight: '600', color: c.text, ...c.heading },
    row: { gap: spacing(1) },
    label: { color: c.text, fontSize: 13 },
    muted: { color: c.muted, fontSize: 12 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_HEIGHT, gap: 2 },
    slot: { flex: 1, height: BAR_HEIGHT, justifyContent: 'flex-end' },
    bar: { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
    selectedBar: { borderWidth: 1, borderColor: c.text },
  });
