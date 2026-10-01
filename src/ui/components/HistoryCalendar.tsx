import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@ui/components/Card';
import {
  EDITABLE_DAYS,
  HISTORY_MONTHS,
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
import { dayOfMonth } from '@domain/shared/dates';
import { describeSignals } from '@ui/i18n/describeSignals';
import { longDate, monthTitle, weekdayInitials } from '@ui/i18n/format';
import { useLocale } from '@ui/i18n/LocaleContext';
import { describeSleep } from '@ui/i18n/sleep';
import { Habit } from '@domain/habits/habits';
import { describeLog } from '@domain/habits/insights';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { useVoice } from '@ui/theme/voiceContext';

import { Button } from './Button';

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
  const { m, locale } = useLocale();
  const c = useColors();
  const [month, setMonth] = useState<MonthRef>(monthOf(today));
  const [selected, setSelected] = useState<string>(today);

  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ArrowButton
          label="‹"
          hint={m.calendar.previousMonth}
          disabled={!canShowMonth(prev, today)}
          onPress={() => setMonth(prev)}
        />
        <Text style={styles.month}>{monthTitle(month.year, month.month, locale)}</Text>
        <ArrowButton
          label="›"
          hint={m.calendar.nextMonth}
          disabled={!canShowMonth(next, today)}
          onPress={() => setMonth(next)}
        />
      </View>

      <View style={styles.week}>
        {weekdayInitials(locale).map((d, i) => (
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
                accessibilityLabel={m.calendar.dayA11y(date, count)}
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
      <Text style={styles.hint}>{m.calendar.hint(HISTORY_MONTHS, EDITABLE_DAYS)}</Text>
    </Card>
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
  const { m, locale } = useLocale();
  const c = useColors();
  const voice = useVoice();
  const label = longDate(date, locale);

  return (
    <View style={styles.detail}>
      <Text style={styles.detailTitle}>{date === today ? m.common.today : label}</Text>
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
                {e.sleep ? <Text style={styles.signal}>{describeSleep(e.sleep, locale)}</Text> : null}
                {describeSignals(e, locale).map((line) => (
                  <Text key={line} style={styles.signal}>
                    {line}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.empty}>{m.common.notLogged}</Text>
            )}
          </View>
        );
      })}
      {isEditable(date, today) ? (
        <Button title={m.calendar.editDay} variant="secondary" onPress={() => onEditDay(date)} />
      ) : (
        <Text style={styles.readOnly}>{m.calendar.readOnly(EDITABLE_DAYS)}</Text>
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
    card: { padding: spacing(3), gap: spacing(1) },
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
