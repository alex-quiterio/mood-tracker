import { StyleSheet, Text, View } from 'react-native';

import { Habit } from '@domain/habits/habits';
import { formatEuros, savingsMilestone } from '@domain/habits/insights';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';
import { useLocale } from '@ui/i18n/LocaleContext';

type Props = { week: number; total: number; habits: Habit[] };

/** Money kept by having less than usual, as a jar filling toward something real. */
export function SavingsJar({ week, total, habits }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const priced = habits.filter((h) => h.kind === 'reduce' && !h.archived && h.pricePerDose);
  const ready = priced.some((h) => h.usualPerDay);
  const { reached, next, progress } = savingsMilestone(total, locale);

  return (
    <View style={styles.card}>
      <View style={styles.jar} accessibilityLabel={m.savings.jarA11y(Math.round(progress * 100))}>
        <View style={[styles.fill, { height: `${Math.round(Math.min(1, progress) * 100)}%` }]} />
        <Text style={styles.jarEmoji}>🫙</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{m.savings.title}</Text>
        {ready ? (
          <>
            <Text style={styles.amount}>{formatEuros(total, locale)}</Text>
            <Text style={styles.body}>
              {m.savings.thisWeek(formatEuros(week, locale))}
              {reached ? m.savings.enoughFor(reached.label) : ''}
            </Text>
            {next && (
              <Text style={styles.muted}>
                {m.savings.moreFor(formatEuros(next.amount - total, locale), next.label)}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.body}>{m.savings.setUsual}</Text>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(4),
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
    },
    jar: {
      width: 56,
      height: 72,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: c.border,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    fill: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.moodColors[5] },
    jarEmoji: { fontSize: 26, marginBottom: spacing(4) },
    text: { flex: 1, gap: 2 },
    title: { fontSize: 15, fontWeight: '600', color: c.text, ...c.heading },
    amount: { fontSize: 28, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] },
    body: { color: c.text, fontSize: 13 },
    muted: { color: c.muted, fontSize: 13 },
  });
