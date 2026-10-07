import { StyleSheet } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Card } from '@ui/kit/Card';
import { Entry } from '@domain/checkins/types';
import { Habit, activeHabits } from '@domain/habits/habits';
import { spent, totalSpent } from '@domain/habits/insights';
import { weekStart } from '@domain/shared/dates';
import { formatEuros } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';

/** `today` is the last day of the week shown; `past` when that week isn't the current one. */
type Props = { entries: Entry[]; habits: Habit[]; today: string; past?: boolean };

/** What doses cost: neutral numbers (doses × price), with no judgment and no red. Optional in Settings. */
export function SpendingCard({ entries, habits, today, past = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const priced = activeHabits(habits, 'reduce').filter((h) => h.pricePerDose);
  const weekFrom = weekStart(today);

  return (
    <Card>
      <Text style={styles.title}>{m.spending.title}</Text>
      {priced.length === 0 ? (
        <Text style={styles.muted}>{m.spending.setPrice}</Text>
      ) : (
        <>
          <Text style={styles.body}>
            {(past ? m.spending.thatWeek : m.spending.thisWeek)(
              formatEuros(totalSpent(entries, priced, weekFrom, today), locale),
            )}{' '}
            ·{' '}
            {(past ? m.spending.byThen : m.spending.inAll)(
              formatEuros(totalSpent(entries, priced, undefined, today), locale),
            )}
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
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    body: { color: c.text, fontSize: 14 },
    muted: { color: c.muted, fontSize: 13 },
  });
