import { StyleSheet } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Card } from '@ui/kit/Card';
import { Entry } from '@domain/checkins/types';
import { Habit, activeHabits } from '@domain/habits/habits';
import { spent, totalSpent } from '@domain/habits/insights';
import { addDays, weekStart } from '@domain/shared/dates';
import { formatEuros, formatMoneys } from '@ui/foundation/i18n/format';
import { Payment } from '@domain/spending/payments';
import { realVsEstimate } from '@domain/spending/realVsEstimate';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';

/**
 * `today` is the last day shown. 'week': the week ending then (`past` when it isn't
 * the current one). 'last30': the 30 days up to then, and everything before.
 */
type Props = {
  entries: Entry[];
  habits: Habit[];
  payments: Payment[];
  today: string;
  period: 'week' | 'last30';
  past?: boolean;
};

/** What doses cost: neutral numbers (doses × price), with no judgment and no red. Optional in Settings. */
export function SpendingCard({ entries, habits, payments, today, period, past = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const priced = activeHabits(habits, 'reduce').filter((h) => h.pricePerDose);
  const from = period === 'week' ? weekStart(today) : addDays(today, -29);
  // What the imported statement says was really spent, above the habits' estimate.
  const real = realVsEstimate(entries, habits, payments, from, today);
  const shown = formatEuros(totalSpent(entries, priced, from, today), locale);

  return (
    <Card>
      <Text style={styles.title}>{m.spending.title}</Text>
      {real.real && (
        <Text style={styles.body}>{m.statement.week(formatMoneys(real.real, real.currency, locale))}</Text>
      )}
      {priced.length === 0 ? (
        <Text style={styles.muted}>{m.spending.setPrice}</Text>
      ) : (
        <>
          <Text style={styles.body}>
            {period === 'week'
              ? (past ? m.spending.thatWeek : m.spending.thisWeek)(shown)
              : `${m.spending.last30(shown)} · ${m.spending.inAll(
                  formatEuros(totalSpent(entries, priced, undefined, today), locale),
                )}`}
          </Text>
          <Text style={styles.muted}>
            {priced
              .map((h) => m.spending.perHabit(h.emoji, formatEuros(spent(entries, h, from, today), locale)))
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
