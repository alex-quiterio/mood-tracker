import { StyleSheet } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Card } from '@ui/kit/Card';
import { MonthReview } from '@domain/checkins/monthly';
import { formatDecimal, weekdayName } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';

/** Simple patterns from the last 30 days: best and hardest weekday, lowest time of day, mood by habit. */
export function MonthReviewCard({ review }: { review: MonthReview }) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const avg = (n: number) => formatDecimal(n, 1, locale);
  const lines = [
    ...(review.bestWeekday
      ? [m.month.best(weekdayName(review.bestWeekday.weekday, locale), avg(review.bestWeekday.average))]
      : []),
    ...(review.hardestWeekday
      ? [
          m.month.hardest(
            weekdayName(review.hardestWeekday.weekday, locale),
            avg(review.hardestWeekday.average),
          ),
        ]
      : []),
    ...(review.lowestSlot
      ? [m.month.lowestSlot(m.slots[review.lowestSlot.slot], avg(review.lowestSlot.average))]
      : []),
    ...review.habitMoods.map((h) =>
      m.month.habitMoods(h.habit.emoji, h.habit.name, avg(h.none), avg(h.some)),
    ),
  ];

  return (
    <Card>
      <Text style={styles.title}>{m.month.title}</Text>
      {lines.length > 0 ? (
        lines.map((line) => (
          <Text key={line} style={styles.line}>
            {line}
          </Text>
        ))
      ) : (
        <Text style={styles.muted}>{m.month.notEnough}</Text>
      )}
      <Text style={styles.muted}>{m.month.hint}</Text>
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { ...typeScale.heading, color: c.text, ...c.heading },
    line: { color: c.text, fontSize: 14 },
    muted: { color: c.muted, fontSize: 12 },
  });
