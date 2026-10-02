import { Alert, ScrollView, Share, StyleSheet, Text } from 'react-native';

import { monthReview } from '@domain/checkins/monthly';
import { Habit } from '@domain/habits/habits';
import { Button } from '@ui/components/Button';
import { HabitsInPromptSwitch } from '@ui/components/HabitsInPromptSwitch';
import { HistoryCalendar } from '@ui/components/HistoryCalendar';
import { MonthReviewCard } from '@ui/habits/MonthReviewCard';
import { ProgressCard } from '@ui/progress/ProgressCard';
import { useProgress } from '@ui/progress/useProgress';
import { EntriesStore } from '@ui/hooks/useEntries';
import { useLocale } from '@ui/i18n/LocaleContext';
import { buildMonthlyPrompt } from '@ui/reflection/monthPrompt';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';
import { useVoice } from '@ui/theme/voiceContext';

type Props = {
  store: EntriesStore;
  today: string;
  onEditDay: (date: string) => void;
  habits: Habit[];
  habitsInPrompt: boolean;
  onHabitsInPromptChange: (include: boolean) => void;
};

/** The longer view: the last 30 days with a reflection for Claude, and six months of calendar. */
export function HistoryScreen({
  store,
  today,
  onEditDay,
  habits,
  habitsInPrompt,
  onHabitsInPromptChange,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const voice = useVoice();
  const { m, locale } = useLocale();
  const month = monthReview(store.entries, habits, today);
  const progress = useProgress(store.entries, store.urges, today);

  const reflectMonth = async () => {
    try {
      // Opens Android's share sheet; pick the Claude app. No API calls involved.
      await Share.share({
        message: buildMonthlyPrompt(month, store.entries, voice, habitsInPrompt ? habits : null, locale),
      });
    } catch (e) {
      Alert.alert(m.stats.shareFailed, String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressCard progress={progress} />
      <MonthReviewCard review={month} />
      <HabitsInPromptSwitch value={habitsInPrompt} onChange={onHabitsInPromptChange} />
      <Button title={m.month.reflect} onPress={reflectMonth} disabled={month.logged === 0} />
      <Text style={styles.hint}>{m.month.reflectHint}</Text>

      <Text style={styles.sectionTitle}>{m.history.calendar}</Text>
      <HistoryCalendar entries={store.entries} today={today} onEditDay={onEditDay} habits={habits} />
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(4) },
    hint: { color: c.muted, textAlign: 'center', fontSize: 13 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginTop: spacing(2), ...c.heading },
  });
