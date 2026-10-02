import { StyleSheet, Text } from 'react-native';

import { Card } from '@ui/components/Card';
import { Entry } from '@domain/checkins/types';
import { Habit, activeHabits } from '@domain/habits/habits';
import { spent, totalSpent } from '@domain/habits/insights';
import { addDays } from '@domain/shared/dates';
import { formatEuros } from '@ui/i18n/format';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, useThemedStyles } from '@ui/theme/theme';

type Props = { entries: Entry[]; habits: Habit[]; today: string };

/** What doses cost: neutral numbers (doses × price), with no judgment and no red. Optional in Settings. */
export function SpendingCard({ entries, habits, today }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const priced = activeHabits(habits, 'reduce').filter((h) => h.pricePerDose);
  const weekFrom = addDays(today, -6);

  return (
    <Card>
      <Text style={styles.title}>{m.spending.title}</Text>
      {priced.length === 0 ? (
        <Text style={styles.muted}>{m.spending.setPrice}</Text>
      ) : (
        <>
          <Text style={styles.body}>
            {m.spending.thisWeek(formatEuros(totalSpent(entries, priced, weekFrom, today), locale))} ·{' '}
            {m.spending.inAll(formatEuros(totalSpent(entries, priced), locale))}
          </Text>
          <Text style={styles.muted}>
            {priced
              .map((h) =>
                m.spending.perHabit(h.emoji, formatEuros(spent(entries, h, weekFrom, today), locale)),
              )
              .join('  ')}
          </Text>
        </>
      )}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { fontSize: 15, fontWeight: '600', color: c.text, ...c.heading },
    body: { color: c.text, fontSize: 14 },
    muted: { color: c.muted, fontSize: 13 },
  });
