import { StyleSheet, View } from 'react-native';

import { HabitSpend } from '@domain/spending/categories';
import { RealVsEstimate } from '@domain/spending/realVsEstimate';
import { formatEuros, formatMoneys } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, useThemedStyles } from '@ui/foundation/theme/theme';
import { Text } from '@ui/kit/Text';

/**
 * What was really spent (from the imported statement) above what the habits
 * estimate. Days the statement doesn't cover show only the estimate; nothing shows
 * when there's nothing to say.
 */
export function RealVsEstimateLines({
  value,
  byHabit = [],
}: {
  value: RealVsEstimate;
  /** The spending at merchants linked to each habit, as plain amounts. */
  byHabit?: HabitSpend[];
}) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const { real, currency, payments, estimate } = value;
  const showReal = real !== null && (payments > 0 || estimate > 0);
  if (!showReal && estimate === 0) return null;
  return (
    <View>
      {showReal && (
        <Text style={styles.real}>{m.statement.real(formatMoneys(real!, currency, locale), payments)}</Text>
      )}
      {showReal && byHabit.length > 0 && (
        <Text style={styles.estimate}>
          {byHabit.map(({ habit, spent }) => `${habit.emoji} ${formatEuros(spent, locale)}`).join(' · ')}
        </Text>
      )}
      {estimate > 0 && (
        <Text style={styles.estimate}>{m.statement.estimate(formatEuros(estimate, locale))}</Text>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    real: { color: c.text, fontSize: 13 },
    estimate: { color: c.muted, fontSize: 13 },
  });
