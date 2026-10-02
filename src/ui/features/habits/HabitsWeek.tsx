import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@ui/kit/Card';
import { Entry } from '@domain/checkins/types';
import { weekBalance } from '@domain/habits/balance';
import { Habit } from '@domain/habits/habits';
import { Urge } from '@domain/habits/urges';
import { habitWeek, recentInsteadNotes, totalSavings } from '@domain/habits/insights';
import { describeHabitWeek } from '@ui/foundation/i18n/habits';
import { formatDecimal } from '@ui/foundation/i18n/format';
import { addDays } from '@domain/shared/dates';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';

import { BalanceBoard } from './BalanceBoard';
import { SavingsJar } from './SavingsJar';
import { SpendingCard } from './SpendingCard';

/** The weekly habits view: balance, savings, and what went right. */
type Props = { entries: Entry[]; urges: Urge[]; habits: Habit[]; today: string; showSpending: boolean };

export function HabitsWeek({ entries, urges, habits, today, showSpending }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m, locale } = useLocale();
  const week = habitWeek(entries, habits, today);
  const insteadNotes = recentInsteadNotes(entries, today);

  return (
    <View style={styles.root}>
      <BalanceBoard week={weekBalance(entries, habits, today, urges)} />
      <SavingsJar
        week={totalSavings(entries, habits, addDays(today, -6), today)}
        total={totalSavings(entries, habits)}
        habits={habits}
      />
      {showSpending && <SpendingCard entries={entries} habits={habits} today={today} />}
      <Card>
        {week.map((w) => (
          <View key={w.habit.id} style={styles.line}>
            <Text style={styles.text}>{describeHabitWeek(w, locale)}</Text>
            {w.moodWithNone !== null && w.moodWithSome !== null && (
              <Text style={styles.muted}>
                {m.habits.moodWithNone(
                  formatDecimal(w.moodWithNone, 1, locale),
                  formatDecimal(w.moodWithSome, 1, locale),
                )}
              </Text>
            )}
          </View>
        ))}
        {insteadNotes.length > 0 && (
          <View style={styles.line}>
            <Text style={styles.text}>{m.habits.insteadTitle}</Text>
            {insteadNotes.map((n) => (
              <Text key={n} style={styles.instead}>
                “{n}”
              </Text>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(3) },
    line: { gap: 2 },
    text: { color: c.text, fontSize: 14 },
    muted: { color: c.muted, fontSize: 12 },
    instead: { color: c.accent, fontSize: 13, fontStyle: 'italic' },
  });
