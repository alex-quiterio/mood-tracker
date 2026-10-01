import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '@ui/components/Button';
import { HistoryCalendar } from '@ui/components/HistoryCalendar';
import { Habit } from '@domain/habits/habits';
import { HabitsWeek } from '@ui/habits/HabitsWeek';
import { dayOfMonth, weekdayShort } from '@domain/shared/dates';
import { buildReflectionPrompt } from '@domain/voices/prompt';
import { formatSteps, formatStepsShort } from '@domain/signals/format';
import { formatAverage, weeklyStats } from '@domain/checkins/stats';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { SLOTS } from '@domain/checkins/types';
import { useVoice } from '@ui/theme/voiceContext';
import { EntriesStore } from '@ui/hooks/useEntries';

type Props = {
  store: EntriesStore;
  today: string;
  onEditDay: (date: string) => void;
  habits: Habit[];
  habitsInPrompt: boolean;
};

export function StatsScreen({ store, today, onEditDay, habits, habitsInPrompt }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const stats = weeklyStats(store.entries);

  const reflect = async () => {
    try {
      // Opens Android's share sheet; pick the Claude app. No API calls involved.
      await Share.share({ message: buildReflectionPrompt(stats, voice, habitsInPrompt ? habits : null) });
    } catch (e) {
      Alert.alert('Could not open the share sheet', String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summary}>
        <SummaryTile label="Overall average" value={formatAverage(stats.overallAverage)} />
        <SummaryTile label="Check-ins logged" value={`${stats.logged} / ${stats.possible}`} />
        {stats.unlockAverage !== null && (
          <SummaryTile label="Unlocks per check-in" value={String(Math.round(stats.unlockAverage))} />
        )}
        {stats.stepAverage !== null && (
          <SummaryTile label="Steps per check-in" value={formatSteps(stats.stepAverage)} />
        )}
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={[styles.dayCell, styles.headerText]}>Last 7 days</Text>
          {SLOTS.map((slot) => (
            <Text key={slot} style={[styles.cell, styles.headerText]}>
              {voice.slotLabels[slot]}
            </Text>
          ))}
        </View>

        {stats.days.map((day) => (
          <View key={day.date} style={styles.row}>
            <Text style={styles.dayCell}>
              {weekdayShort(day.date)} {dayOfMonth(day.date)}
            </Text>
            {SLOTS.map((slot) => {
              const e = day.entries[slot];
              return (
                <View
                  key={slot}
                  style={[styles.cell, styles.moodCell, e && { backgroundColor: c.moodColors[e.mood] }]}
                  accessibilityLabel={`${day.date} ${slot}: ${
                    e
                      ? `mood ${e.mood}${e.unlocks === undefined ? '' : `, ${e.unlocks} unlocks`}${
                          e.steps === undefined ? '' : `, ${e.steps} steps`
                        }`
                      : 'not logged'
                  }`}
                >
                  <Text style={e ? styles.moodText : styles.emptyText}>
                    {e ? `${voice.moodEmoji[e.mood]} ${e.mood}` : '–'}
                  </Text>
                  {e?.unlocks !== undefined && <Text style={styles.cellSignal}>📱 {e.unlocks}</Text>}
                  {e?.steps !== undefined && (
                    <Text style={styles.cellSignal}>👟 {formatStepsShort(e.steps)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View style={[styles.row, styles.averageRow]}>
          <Text style={[styles.dayCell, styles.headerText]}>Average</Text>
          {SLOTS.map((slot) => (
            <Text key={slot} style={[styles.cell, styles.averageText]}>
              {formatAverage(stats.slotAverages[slot])}
            </Text>
          ))}
        </View>

        {stats.unlockAverage !== null && (
          <View style={styles.row}>
            <Text style={[styles.dayCell, styles.headerText]}>📱 Unlocks</Text>
            {SLOTS.map((slot) => {
              const avg = stats.slotUnlockAverages[slot];
              return (
                <Text key={slot} style={[styles.cell, styles.averageText]}>
                  {avg === null ? '–' : Math.round(avg)}
                </Text>
              );
            })}
          </View>
        )}

        {stats.stepAverage !== null && (
          <View style={styles.row}>
            <Text style={[styles.dayCell, styles.headerText]}>👟 Steps</Text>
            {SLOTS.map((slot) => {
              const avg = stats.slotStepAverages[slot];
              return (
                <Text key={slot} style={[styles.cell, styles.averageText]}>
                  {avg === null ? '–' : formatStepsShort(avg)}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      <Button title="Reflect with Claude" onPress={reflect} disabled={stats.logged === 0} />
      <Text style={styles.hint}>
        Builds a text summary of this week and opens the share sheet. Send it to the Claude app.
      </Text>

      <Text style={styles.sectionTitle}>Habits</Text>
      <HabitsWeek entries={store.entries} habits={habits} today={today} />

      <Text style={styles.sectionTitle}>History</Text>
      <HistoryCalendar entries={store.entries} today={today} onEditDay={onEditDay} habits={habits} />
    </ScrollView>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(4) },
    summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3) },
    tile: {
      flexGrow: 1,
      flexBasis: '30%',
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
    },
    tileValue: { fontSize: 28, fontWeight: '700', color: c.text },
    tileLabel: { color: c.muted, marginTop: spacing(1) },
    table: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(3),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(1),
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    dayCell: { width: 76, color: c.text },
    cell: { flex: 1, textAlign: 'center' },
    headerText: { fontSize: 12, color: c.muted, fontWeight: '600' },
    moodCell: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing(2),
      borderRadius: 8,
      backgroundColor: c.background,
    },
    moodText: { color: c.onMood },
    cellSignal: { color: c.onMood, fontSize: 11, marginTop: 2, opacity: 0.8 },
    emptyText: { color: c.muted },
    averageRow: {
      marginTop: spacing(1),
      paddingTop: spacing(2),
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    averageText: { fontWeight: '700', color: c.text },
    hint: { color: c.muted, textAlign: 'center', fontSize: 13 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginTop: spacing(2), ...c.heading },
  });
