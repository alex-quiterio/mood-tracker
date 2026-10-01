import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EDITABLE_DAYS,
  HISTORY_MONTHS,
  MONTH_NAMES,
  MonthRef,
  canShowMonth,
  isEditable,
  isVisible,
  monthGrid,
  monthOf,
  shiftMonth,
  summarizeDay,
} from '@domain/checkins/calendar';
import { Entry, SLOTS } from '@domain/checkins/types';
import { dayOfMonth, parseLocalDate } from '@domain/shared/dates';
import { describeSignals } from '@domain/signals/describe';
import { Habit } from '@domain/habits/habits';
import { describeLog } from '@domain/habits/insights';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { useVoice } from '@ui/theme/voiceContext';

import { Button } from './Button';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  entries: Entry[];
  today: string;
  /** Opens a day on the check-in screen; only offered for the last week. */
  onEditDay: (date: string) => void;
  habits: Habit[];
};

/** Six months of check-ins, a month at a time. The last week can be edited; older days are read-only. */
export function HistoryCalendar({ entries, today, onEditDay, habits }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [month, setMonth] = useState<MonthRef>(monthOf(today));
  const [selected, setSelected] = useState<string>(today);

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ArrowButton
          label="‹"
          hint="Previous month"
          disabled={!canShowMonth(prev, today)}
          onPress={() => setMonth(prev)}
        />
        <Text style={styles.month}>
          {MONTH_NAMES[month.month]} {month.year}
        </Text>
        <ArrowButton
          label="›"
          hint="Next month"
          disabled={!canShowMonth(next, today)}
          onPress={() => setMonth(next)}
        />
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.cell, styles.weekday]}>
            {d}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((date, i) => {
            if (!date) return <View key={i} style={styles.cell} />;
            const visible = isVisible(date, today);
            const { mood, count } = summarizeDay(entries, date);
            const isSelected = date === selected;
            return (
              <Pressable
                key={date}
                disabled={!visible}
                onPress={() => setSelected(date)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !visible }}
                accessibilityLabel={`${date}: ${count} of 3 logged`}
                style={[
                  styles.cell,
                  styles.day,
                  mood !== null && { backgroundColor: c.moodColors[mood] },
                  date === today && styles.today,
                  isSelected && styles.selected,
                  !visible && styles.outside,
                ]}
              >
                <Text style={[styles.dayText, mood !== null && { color: c.onMood }]}>{dayOfMonth(date)}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      <DayDetail entries={entries} date={selected} today={today} onEditDay={onEditDay} habits={habits} />
      <Text style={styles.hint}>
        Shows the last {HISTORY_MONTHS} months. Only the last {EDITABLE_DAYS} days can be edited.
      </Text>
    </View>
  );
}

function DayDetail({
  entries,
  date,
  today,
  onEditDay,
  habits,
}: {
  entries: Entry[];
  date: string;
  today: string;
  onEditDay: (date: string) => void;
  habits: Habit[];
}) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const label = parseLocalDate(date).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.detail}>
      <Text style={styles.detailTitle}>{date === today ? 'Today' : label}</Text>
      {SLOTS.map((slot) => {
        const e = entries.find((x) => x.date === date && x.slot === slot);
        return (
          <View key={slot} style={styles.detailRow}>
            <Text style={styles.detailSlot}>{voice.slotLabels[slot]}</Text>
            {e ? (
              <View style={styles.detailBody}>
                <View style={[styles.badge, { backgroundColor: c.moodColors[e.mood] }]}>
                  <Text style={{ color: c.onMood }}>
                    {voice.moodEmoji[e.mood]} {voice.moodLabels[e.mood]}
                  </Text>
                </View>
                {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
                {e.habits && describeLog(e.habits, habits) ? (
                  <Text style={styles.signal}>{describeLog(e.habits, habits)}</Text>
                ) : null}
                {e.habits?.instead ? <Text style={styles.instead}>🌱 {e.habits.instead}</Text> : null}
                {describeSignals(e).map((line) => (
                  <Text key={line} style={styles.signal}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>Not logged</Text>
            )}
          </View>
        );
      })}
      {isEditable(date, today) ? (
        <Button title="Edit this day" variant="secondary" onPress={() => onEditDay(date)} />
      ) : (
        <Text style={styles.readOnly}>Read-only: older than {EDITABLE_DAYS} days.</Text>
      )}
    </View>
  );
}

function ArrowButton({
  label,
  hint,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={[styles.arrow, disabled && styles.outside]}
    >
      <Text style={styles.arrowText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(3),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(1),
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) },
    month: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: c.text, ...c.heading },
    arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    arrowText: { fontSize: 26, color: c.accent, lineHeight: 28 },
    week: { flexDirection: 'row', gap: spacing(1) },
    cell: { flex: 1, aspectRatio: 1 },
    weekday: { aspectRatio: undefined, textAlign: 'center', fontSize: 11, color: c.muted, fontWeight: '600' },
    day: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      backgroundColor: c.background,
    },
    dayText: { fontSize: 13, color: c.text, fontVariant: ['tabular-nums'] },
    today: { borderWidth: 2, borderColor: c.accent },
    selected: { borderWidth: 2, borderColor: c.text },
    outside: { opacity: 0.3 },
    detail: { marginTop: spacing(3), gap: spacing(2) },
    detailTitle: { fontSize: 16, fontWeight: '600', color: c.text, ...c.heading },
    detailRow: { flexDirection: 'row', gap: spacing(3), alignItems: 'flex-start' },
    detailSlot: { width: 80, color: c.muted, paddingTop: spacing(1) },
    detailBody: { flex: 1, gap: spacing(1), alignItems: 'flex-start' },
    badge: { paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: 999 },
    note: { color: c.text },
    signal: { color: c.muted, fontSize: 12 },
    instead: { color: c.accent, fontSize: 12 },
    empty: { color: c.muted, paddingTop: spacing(1) },
    readOnly: { color: c.muted, fontSize: 13, textAlign: 'center' },
    hint: { color: c.muted, fontSize: 12, textAlign: 'center', marginTop: spacing(2) },
  });
