import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Card } from '@ui/kit/Card';
import { Habit } from '@domain/habits/habits';
import { KeptHabit, savingsMilestone } from '@domain/habits/insights';
import { formatEuros } from '@ui/foundation/i18n/format';
import { Palette, spacing, useThemedStyles, radius, typeScale } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { PressableScale } from '@ui/kit/PressableScale';

type Props = {
  /** What each habit kept away in the week shown, and up to its end. */
  week: KeptHabit[];
  total: KeptHabit[];
  /** Without prices (none set, or Money off) the jar counts doses instead of euros. */
  habits: Habit[];
  /** A week before this one: past wording, and no "more for" goal. */
  past?: boolean;
};

const sum = (kept: KeptHabit[], value: (k: KeptHabit) => number) => kept.reduce((s, k) => s + value(k), 0);

/**
 * What having less than usual kept away, as a jar filling up: euros toward something
 * real when habits have prices, otherwise doses. A tap shows the workings per habit.
 */
export function SavingsJar({ week, total, habits, past = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const usual = habits.filter((h) => h.kind === 'reduce' && !h.archived && h.usualPerDay);
  const money = usual.some((h) => h.pricePerDose);
  const euros = (n: number) => formatEuros(n, locale);
  const saved = (kept: KeptHabit[]) => Math.round(sum(kept, (k) => k.saved ?? 0) * 100) / 100;
  const doses = (kept: KeptHabit[]) => kept.map((k) => `${k.habit.emoji} ${k.fewer}`).join(' · ') || '0';

  const totalSaved = saved(total);
  const { reached, next, progress: milestoneProgress } = savingsMilestone(totalSaved);
  const milestone = (amount: number) => m.savings.milestones[amount];
  // Without money, the jar fills with the share of the week's usual that was kept away.
  const weekUsual = sum(week, (k) => (k.habit.usualPerDay ?? 0) * k.days);
  const progress = money ? milestoneProgress : weekUsual ? sum(week, (k) => k.fewer) / weekUsual : 0;
  const pct = Math.round(Math.min(1, progress) * 100);

  return (
    <Card>
      <View style={styles.row}>
        <View
          style={styles.jar}
          accessibilityLabel={money ? m.savings.jarA11y(pct) : m.savings.jarA11yDoses(pct)}
        >
          <View style={[styles.fill, { height: `${pct}%` }]} />
          <Text style={styles.jarEmoji}>🫙</Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{money ? m.savings.title : m.savings.titleDoses}</Text>
          {usual.length > 0 ? (
            <>
              <Text style={money ? styles.amount : styles.doses}>
                {money ? euros(totalSaved) : doses(total)}
              </Text>
              <Text style={styles.muted}>{past ? m.savings.byThen : m.savings.sinceStart}</Text>
              <Text style={styles.body}>
                {(past ? m.savings.thatWeek : m.savings.thisWeek)(money ? euros(saved(week)) : doses(week))}
                {money && reached ? m.savings.enoughFor(milestone(reached)) : ''}
              </Text>
              {money && next && !past && (
                <Text style={styles.muted}>
                  {m.savings.moreFor(euros(next - totalSaved), milestone(next))}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.body}>{m.savings.setUsual}</Text>
          )}
        </View>
      </View>

      {usual.length > 0 && (
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((o) => !o)}
          style={styles.howRow}
        >
          <Text style={styles.link}>{m.savings.how}</Text>
          <Text style={styles.link}>{open ? '▴' : '▾'}</Text>
        </PressableScale>
      )}
      {open && (
        <View style={styles.how}>
          {week.map((k) => (
            <Text key={k.habit.id} style={styles.body}>
              {m.savings.line(k.habit.emoji, k.fewer, k.habit.usualPerDay ?? 0, k.days)}
              {money &&
                (k.saved === null
                  ? m.savings.noPrice
                  : m.savings.priced(euros(k.habit.pricePerDose ?? 0), euros(k.saved)))}
            </Text>
          ))}
          <Text style={styles.muted}>{money ? m.savings.howMoney : m.savings.howDoses}</Text>
        </View>
      )}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(4) },
    jar: {
      width: 56,
      height: 72,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: c.border,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    fill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.moodColors[5] },
    jarEmoji: { fontSize: 26, marginBottom: spacing(4) },
    text: { flex: 1, gap: 2 },
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    amount: { fontSize: 28, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] },
    doses: { fontSize: 20, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] },
    body: { color: c.text, fontSize: 13 },
    muted: { color: c.muted, fontSize: 13 },
    howRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing(3) },
    link: { color: c.accent, fontSize: 13, fontWeight: '600' },
    how: { gap: spacing(1), paddingTop: spacing(2) },
  });
