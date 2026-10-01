import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { dayOfMonth, weekdayShort } from '../dates';
import { buildReflectionPrompt } from '../prompt';
import { formatAverage, weeklyStats } from '../stats';
import { colors, moodColors, spacing } from '../theme';
import { MOOD_EMOJI, SLOTS, SLOT_LABEL } from '../types';
import { EntriesStore } from '../useEntries';

type Props = { store: EntriesStore };

export function StatsScreen({ store }: Props) {
  const stats = weeklyStats(store.entries);

  const reflect = async () => {
    try {
      // Opens Android's share sheet; pick the Claude app. No API calls involved.
      await Share.share({ message: buildReflectionPrompt(stats) });
    } catch (e) {
      Alert.alert('Could not open the share sheet', String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summary}>
        <SummaryTile label="Overall average" value={formatAverage(stats.overallAverage)} />
        <SummaryTile label="Check-ins logged" value={`${stats.logged} / ${stats.possible}`} />
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={[styles.dayCell, styles.headerText]}>Last 7 days</Text>
          {SLOTS.map((slot) => (
            <Text key={slot} style={[styles.cell, styles.headerText]}>
              {SLOT_LABEL[slot]}
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
                  style={[styles.cell, styles.moodCell, e && { backgroundColor: moodColors[e.mood] }]}
                  accessibilityLabel={`${day.date} ${slot}: ${e ? e.mood : 'not logged'}`}
                >
                  <Text style={e ? styles.moodText : styles.emptyText}>
                    {e ? `${MOOD_EMOJI[e.mood]} ${e.mood}` : '–'}
                  </Text>
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
      </View>

      <Button title="Reflect with Claude" onPress={reflect} disabled={stats.logged === 0} />
      <Text style={styles.hint}>
        Builds a text summary of this week and opens the share sheet. Send it to the Claude app.
      </Text>
    </ScrollView>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), gap: spacing(4) },
  summary: { flexDirection: 'row', gap: spacing(3) },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileValue: { fontSize: 28, fontWeight: '700', color: colors.text },
  tileLabel: { color: colors.muted, marginTop: spacing(1) },
  table: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing(3),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(1),
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  dayCell: { width: 76, color: colors.text },
  cell: { flex: 1, textAlign: 'center' },
  headerText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  moodCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(2),
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  moodText: { color: colors.text },
  emptyText: { color: colors.muted },
  averageRow: { marginTop: spacing(1), paddingTop: spacing(2), borderTopWidth: 1, borderTopColor: colors.border },
  averageText: { fontWeight: '700', color: colors.text },
  hint: { color: colors.muted, textAlign: 'center', fontSize: 13 },
});
