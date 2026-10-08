import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Entry } from '@domain/checkins/types';
import { parseLocalDate } from '@domain/shared/dates';
import { Payment } from '@domain/spending/payments';
import { SPENDING_PERIODS, SpendingPeriod, spendingOverTime } from '@domain/spending/periods';
import { dayAndMonth, formatMoneys, monthTitle } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, typeScale, useThemedStyles } from '@ui/foundation/theme/theme';
import { BarChart } from '@ui/kit/BarChart';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { Text } from '@ui/kit/Text';

type Props = {
  entries: Entry[];
  payments: Payment[];
  today: string;
};

/**
 * What really left the account in each week or month since the first check-in,
 * newest first. Periods the statements don't reach say so instead of showing zero.
 */
export function SpendingOverTimeCard({ entries, payments, today }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const [per, setPer] = useState<SpendingPeriod>('week');
  const { currency, periods } = spendingOverTime(entries, payments, per, today);
  const label = (from: string) => {
    const d = parseLocalDate(from);
    return per === 'week'
      ? m.overTime.weekOf(dayAndMonth(from, locale))
      : monthTitle(d.getFullYear(), d.getMonth(), locale);
  };

  return (
    <Card>
      <Text style={styles.title}>{m.overTime.title}</Text>
      <Text style={styles.muted}>{m.overTime.hint}</Text>
      <View style={styles.chips}>
        {SPENDING_PERIODS.map((p) => (
          <Chip key={p} label={m.overTime.periods[p]} selected={per === p} onPress={() => setPer(p)} />
        ))}
      </View>
      <BarChart
        rows={[...periods].reverse().map((p) => ({
          key: p.from,
          label: label(p.from),
          value: p.spent && (p.spent[currency] ?? 0),
          text: p.spent ? formatMoneys(p.spent, currency, locale) : m.overTime.notCovered,
        }))}
      />
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    muted: { color: c.muted, fontSize: 12, lineHeight: 16 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  });
