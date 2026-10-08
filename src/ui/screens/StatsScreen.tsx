import { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { ArrowButton } from '@ui/kit/ArrowButton';
import { Button } from '@ui/kit/Button';
import { HabitsInPromptSwitch } from '@ui/features/habits/HabitsInPromptSwitch';
import { Habit } from '@domain/habits/habits';
import { MerchantLinks } from '@domain/spending/categories';
import { EstimateVsSpentCard } from '@ui/features/spending/EstimateVsSpentCard';
import { HabitsWeek } from '@ui/features/habits/HabitsWeek';
import { addDays, dayOfMonth, weekStart } from '@domain/shared/dates';
import { dayAndMonth, weekdayShort, formatAverage, formatHours } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { sleepWeek } from '@domain/checkins/sleep';
import { buildReflectionPrompt } from '@ui/features/reflection/prompt';
import { formatSteps, formatStepsShort } from '@ui/foundation/i18n/signals';
import { firstWeekStart, thisWeekStats, weekShownUntil } from '@domain/checkins/stats';
import { Palette, spacing, useColors, useThemedStyles, radius, typeScale } from '@ui/foundation/theme/theme';
import { SLOTS } from '@domain/checkins/types';
import { useVoice } from '@ui/foundation/theme/voiceContext';
import { EntriesStore } from '@ui/state/useEntries';

type Props = {
  store: EntriesStore;
  today: string;
  habits: Habit[];
  habitsInPrompt: boolean;
  onHabitsInPromptChange: (include: boolean) => void;
  showSpending: boolean;
  merchantHabits: MerchantLinks;
  onLinkMerchant: (merchant: string, habitId: string | null) => void;
};

export function StatsScreen({
  store,
  today,
  habits,
  habitsInPrompt,
  onHabitsInPromptChange,
  showSpending,
  merchantHabits,
  onLinkMerchant,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const { m, locale } = useLocale();
  // Weeks back from this one, as far as the week of the first check-in.
  const [weeksBack, setWeeksBack] = useState(0);
  const monday = addDays(weekStart(today), -7 * weeksBack);
  const canGoBack = addDays(monday, -7) >= firstWeekStart(store.entries, today);
  const shownUntil = weekShownUntil(monday, today);
  const isThisWeek = weeksBack === 0;
  const stats = thisWeekStats(store.entries, shownUntil);
  const sleep = sleepWeek(store.entries, shownUntil);

  const share = async (message: string) => {
    try {
      // Opens Android's share sheet; pick the Claude app. No API calls involved.
      await Share.share({ message });
    } catch (e) {
      Alert.alert(m.stats.shareFailed, String(e));
    }
  };
  const reflect = () =>
    share(buildReflectionPrompt(stats, voice, habitsInPrompt ? habits : null, locale, store.urges));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.weekPicker}>
        <ArrowButton
          label="‹"
          hint={m.stats.previousWeek}
          disabled={!canGoBack}
          onPress={() => setWeeksBack((n) => n + 1)}
        />
        <Text style={styles.weekTitle}>
          {isThisWeek
            ? m.stats.thisWeek
            : m.stats.weekRange(dayAndMonth(monday, locale), dayAndMonth(addDays(monday, 6), locale))}
        </Text>
        <ArrowButton
          label="›"
          hint={m.stats.nextWeek}
          disabled={isThisWeek}
          onPress={() => setWeeksBack((n) => Math.max(0, n - 1))}
        />
      </View>

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
          <Text style={[styles.dayCell, styles.headerText]}>
            {isThisWeek ? m.stats.thisWeek : m.stats.week}
          </Text>
          {SLOTS.map((slot) => (
            <Text key={slot} style={[styles.cell, styles.headerText]}>
              {voice.slotLabels[slot]}
            </Text>
          ))}
        </View>

        {stats.days.map((day) => (
          <View key={day.date} style={[styles.row, day.future && styles.futureRow]}>
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

      <HabitsInPromptSwitch value={habitsInPrompt} onChange={onHabitsInPromptChange} />
      <Button title={m.stats.reflect} onPress={reflect} disabled={stats.logged === 0} />
      <Text style={styles.hint}>{m.stats.reflectHint}</Text>

      <Text style={styles.sectionTitle}>{m.stats.habits}</Text>
      <HabitsWeek
        entries={store.entries}
        urges={store.urges}
        payments={store.payments}
        habits={habits}
        today={shownUntil}
        past={!isThisWeek}
        showSpending={showSpending}
      />
      {store.payments.length > 0 && (
        <EstimateVsSpentCard
          entries={store.entries}
          habits={habits}
          payments={store.payments}
          links={merchantHabits}
          onLink={onLinkMerchant}
          from={monday}
          to={shownUntil}
          periodLabel={isThisWeek ? m.compare.thisWeek : m.compare.thatWeek}
        />
      )}
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
    weekPicker: { flexDirection: 'row', alignItems: 'center' },
    weekTitle: { flex: 1, textAlign: 'center', ...typeScale.heading, color: c.text, ...c.heading },
    summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3) },
    tile: {
      flexGrow: 1,
      flexBasis: '30%',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
    },
    tileValue: { fontSize: 28, fontWeight: '700', color: c.text },
    tileLabel: { color: c.muted, marginTop: spacing(1) },
    table: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing(3),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(1),
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    futureRow: { opacity: 0.4 },
    dayCell: { width: 76, color: c.text },
    cell: { flex: 1, textAlign: 'center' },
    headerText: { fontSize: 12, color: c.muted, fontWeight: '600' },
    moodCell: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing(2),
      borderRadius: radius.sm,
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
    sectionTitle: { ...typeScale.title, color: c.text, marginTop: spacing(2), ...c.heading },
  });
