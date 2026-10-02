import { Alert, ScrollView, Share, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@ui/components/Button';
import { HistoryCalendar } from '@ui/components/HistoryCalendar';
import { Habit } from '@domain/habits/habits';
import { HabitsWeek } from '@ui/habits/HabitsWeek';
import { dayOfMonth } from '@domain/shared/dates';
import { weekdayShort, formatAverage, formatHours } from '@ui/i18n/format';
import { useLocale } from '@ui/i18n/LocaleContext';
import { sleepWeek } from '@domain/checkins/sleep';
import { MonthReviewCard } from '@ui/habits/MonthReviewCard';
import { monthReview } from '@domain/checkins/monthly';
import { buildMonthlyPrompt } from '@ui/reflection/monthPrompt';
import { buildReflectionPrompt } from '@ui/reflection/prompt';
import { formatSteps, formatStepsShort } from '@ui/i18n/signals';
import { weeklyStats } from '@domain/checkins/stats';
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
  onHabitsInPromptChange: (include: boolean) => void;
  showSpending: boolean;
};

export function StatsScreen({
  store,
  today,
  onEditDay,
  habits,
  habitsInPrompt,
  onHabitsInPromptChange,
  showSpending,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const { m, locale } = useLocale();
  const stats = weeklyStats(store.entries);
  const sleep = sleepWeek(store.entries, today);
  const month = monthReview(store.entries, habits, today);

  const share = async (message: string) => {
    try {
      // Opens Android's share sheet; pick the Claude app. No API calls involved.
      await Share.share({ message });
    } catch (e) {
      Alert.alert(m.stats.shareFailed, String(e));
    }
  };
  const reflect = () => share(buildReflectionPrompt(stats, voice, habitsInPrompt ? habits : null, locale));
  const reflectMonth = () =>
    share(buildMonthlyPrompt(month, store.entries, voice, habitsInPrompt ? habits : null, locale));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.summary}>
        <SummaryTile label={m.stats.overallAverage} value={formatAverage(stats.overallAverage, locale)} />
        <SummaryTile label={m.stats.logged} value={`${stats.logged} / ${stats.possible}`} />
        {stats.unlockAverage !== null && (
          <SummaryTile label={m.stats.unlocksPerCheckIn} value={String(Math.round(stats.unlockAverage))} />
        )}
        {stats.stepAverage !== null && (
          <SummaryTile label={m.stats.stepsPerCheckIn} value={formatSteps(stats.stepAverage, locale)} />
        )}
        {sleep.averageHours !== null && (
          <SummaryTile
            label={m.sleep.perNight}
            value={m.sleep.hours(formatHours(sleep.averageHours, locale))}
          />
        )}
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={[styles.dayCell, styles.headerText]}>{m.stats.last7Days}</Text>
          {SLOTS.map((slot) => (
            <Text key={slot} style={[styles.cell, styles.headerText]}>
              {voice.slotLabels[slot]}
            </Text>
          ))}
        </View>

        {stats.days.map((day) => (
          <View key={day.date} style={styles.row}>
            <Text style={styles.dayCell}>
              {weekdayShort(day.date, locale)} {dayOfMonth(day.date)}
            </Text>
            {SLOTS.map((slot) => {
              const e = day.entries[slot];
              return (
                <View
                  key={slot}
                  style={[styles.cell, styles.moodCell, e && { backgroundColor: c.moodColors[e.mood] }]}
                  accessibilityLabel={m.stats.cellA11y(
                    day.date,
                    voice.slotLabels[slot],
                    e
                      ? [
                          m.stats.moodDetail(e.mood),
                          ...(e.unlocks === undefined ? [] : [m.stats.unlocksDetail(e.unlocks)]),
                          ...(e.steps === undefined ? [] : [m.stats.stepsDetail(e.steps)]),
                        ].join(', ')
                      : m.common.notLogged,
                  )}
                >
                  <Text style={e ? styles.moodText : styles.emptyText}>
                    {e ? `${voice.moodEmoji[e.mood]} ${e.mood}` : '–'}
                  </Text>
                  {e?.unlocks !== undefined && <Text style={styles.cellSignal}>📱 {e.unlocks}</Text>}
                  {e?.steps !== undefined && (
                    <Text style={styles.cellSignal}>👟 {formatStepsShort(e.steps, locale)}</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View style={[styles.row, styles.averageRow]}>
          <Text style={[styles.dayCell, styles.headerText]}>{m.stats.average}</Text>
          {SLOTS.map((slot) => (
            <Text key={slot} style={[styles.cell, styles.averageText]}>
              {formatAverage(stats.slotAverages[slot], locale)}
            </Text>
          ))}
        </View>

        {stats.unlockAverage !== null && (
          <View style={styles.row}>
            <Text style={[styles.dayCell, styles.headerText]}>{m.stats.unlocksRow}</Text>
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
            <Text style={[styles.dayCell, styles.headerText]}>{m.stats.stepsRow}</Text>
            {SLOTS.map((slot) => {
              const avg = stats.slotStepAverages[slot];
              return (
                <Text key={slot} style={[styles.cell, styles.averageText]}>
                  {avg === null ? '–' : formatStepsShort(avg, locale)}
                </Text>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.promptRow}>
        <Text style={styles.promptLabel}>{m.stats.includeHabits}</Text>
        <Switch
          value={habitsInPrompt}
          onValueChange={onHabitsInPromptChange}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
          accessibilityLabel={m.stats.includeHabitsA11y}
        />
      </View>
      <Button title={m.stats.reflect} onPress={reflect} disabled={stats.logged === 0} />
      <Text style={styles.hint}>{m.stats.reflectHint}</Text>

      <Text style={styles.sectionTitle}>{m.stats.habits}</Text>
      <HabitsWeek
        entries={store.entries}
        urges={store.urges}
        habits={habits}
        today={today}
        showSpending={showSpending}
      />

      <MonthReviewCard review={month} />
      <Button
        title={m.month.reflect}
        variant="secondary"
        onPress={reflectMonth}
        disabled={month.logged === 0}
      />
      <Text style={styles.hint}>{m.month.reflectHint}</Text>

      <Text style={styles.sectionTitle}>{m.stats.history}</Text>
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
    promptRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    promptLabel: { color: c.text, fontSize: 15 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginTop: spacing(2), ...c.heading },
  });
