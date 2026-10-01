import { StyleSheet, Text, View } from 'react-native';

import { Entry } from '@domain/checkins/types';
import { weekBalance } from '@domain/habits/balance';
import { Habit } from '@domain/habits/habits';
import { describeHabitWeek, habitWeek, totalSavings } from '@domain/habits/insights';
import { addDays, lastNDays } from '@domain/shared/dates';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';

import { BalanceBoard } from './BalanceBoard';
import { SavingsJar } from './SavingsJar';

/** The weekly habits view: balance, savings, and what went right. */
export function HabitsWeek({ entries, habits, today }: { entries: Entry[]; habits: Habit[]; today: string }) {
  const styles = useThemedStyles(makeStyles);
  const week = habitWeek(entries, habits, today);
  const days = new Set(lastNDays(7, today));
  const insteadNotes = entries
    .filter((e) => days.has(e.date) && e.habits?.instead)
    .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
    .slice(0, 3)
    .map((e) => e.habits!.instead!);

  return (
    <View style={styles.root}>
      <BalanceBoard week={weekBalance(entries, habits, today)} />
      <SavingsJar
        week={totalSavings(entries, habits, addDays(today, -6), today)}
        total={totalSavings(entries, habits)}
        habits={habits}
      />
      <View style={styles.card}>
        {week.map((w) => (
          <View key={w.habit.id} style={styles.line}>
            <Text style={styles.text}>{describeHabitWeek(w)}</Text>
            {w.moodWithNone !== null && w.moodWithSome !== null && (
              <Text style={styles.muted}>
                Mood with none {w.moodWithNone.toFixed(1)} · with some {w.moodWithSome.toFixed(1)}
              </Text>
            )}
          </View>
        ))}
        {insteadNotes.length > 0 && (
          <View style={styles.line}>
            <Text style={styles.text}>🌱 What you did instead</Text>
            {insteadNotes.map((n) => (
              <Text key={n} style={styles.instead}>
                “{n}”
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { gap: spacing(3) },
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    line: { gap: 2 },
    text: { color: c.text, fontSize: 14 },
    muted: { color: c.muted, fontSize: 12 },
    instead: { color: c.accent, fontSize: 13, fontStyle: 'italic' },
  });
