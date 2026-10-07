import { Alert, ScrollView, Share, StyleSheet, Text } from 'react-native';

import { monthReview } from '@domain/checkins/monthly';
import { Habit } from '@domain/habits/habits';
import { Button } from '@ui/kit/Button';
import { HabitsInPromptSwitch } from '@ui/features/habits/HabitsInPromptSwitch';
import { Tracking } from '@ui/features/checkin/SlotCard';
import { HistoryCalendar } from '@ui/features/history/HistoryCalendar';
import { MonthReviewCard } from '@ui/features/habits/MonthReviewCard';
import { ProgressCard } from '@ui/features/progress/ProgressCard';
import { useProgress } from '@ui/features/progress/useProgress';
import { EntriesStore } from '@ui/state/useEntries';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { buildMonthlyPrompt } from '@ui/features/reflection/monthPrompt';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';
import { useVoice } from '@ui/foundation/theme/voiceContext';

type Props = {
  store: EntriesStore;
  today: string;
  tracking: Tracking;
  habits: Habit[];
  habitsInPrompt: boolean;
  onHabitsInPromptChange: (include: boolean) => void;
};

/** The longer view: the last 30 days with a reflection for Claude, and six months of calendar (the last week editable). */
export function HistoryScreen({
  store,
  today,
  tracking,
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
        message: buildMonthlyPrompt(
          month,
          store.entries,
          voice,
          habitsInPrompt ? habits : null,
          locale,
          store.urges,
        ),
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
      <HistoryCalendar store={store} tracking={tracking} today={today} habits={habits} />
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(4) },
    hint: { color: c.muted, textAlign: 'center', fontSize: 13 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginTop: spacing(2), ...c.heading },
  });
