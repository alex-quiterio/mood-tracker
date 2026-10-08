import { Alert, ScrollView, Share, StyleSheet } from 'react-native';
import { Text } from '@ui/kit/Text';

import { monthReview } from '@domain/checkins/monthly';
import { Habit } from '@domain/habits/habits';
import { addDays } from '@domain/shared/dates';
import { MerchantLinks } from '@domain/spending/categories';
import { Button } from '@ui/kit/Button';
import { HabitsInPromptSwitch } from '@ui/features/habits/HabitsInPromptSwitch';
import { Tracking } from '@ui/features/checkin/SlotCard';
import { HistoryCalendar } from '@ui/features/history/HistoryCalendar';
import { MonthReviewCard } from '@ui/features/habits/MonthReviewCard';
import { SpendingCard } from '@ui/features/habits/SpendingCard';
import { EstimateVsSpentCard } from '@ui/features/spending/EstimateVsSpentCard';
import { ProgressCard } from '@ui/features/progress/ProgressCard';
import { useProgress } from '@ui/features/progress/useProgress';
import { EntriesStore } from '@ui/state/useEntries';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { buildMonthlyPrompt } from '@ui/features/reflection/monthPrompt';
import { Palette, spacing, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';
import { useVoice } from '@ui/foundation/theme/voiceContext';

type Props = {
  store: EntriesStore;
  today: string;
  tracking: Tracking;
  habits: Habit[];
  habitsInPrompt: boolean;
  onHabitsInPromptChange: (include: boolean) => void;
  showSpending: boolean;
  merchantHabits: MerchantLinks;
  onLinkMerchant: (merchant: string, habitId: string | null) => void;
};

/**
 * The longer view: the last 30 days with a reflection for Claude and their money,
 * and six months of calendar (the last week editable). The week's money is on the week tab.
 */
export function HistoryScreen({
  store,
  today,
  tracking,
  habits,
  habitsInPrompt,
  onHabitsInPromptChange,
  showSpending,
  merchantHabits,
  onLinkMerchant,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const voice = useVoice();
  const { m, locale } = useLocale();
  const month = monthReview(store.entries, habits, today);
  const progress = useProgress(store.entries, store.urges, today);
  const hasStatement = store.payments.length > 0;

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

      {(showSpending || hasStatement) && <Text style={styles.sectionTitle}>{m.history.money}</Text>}
      {showSpending && (
        <SpendingCard
          entries={store.entries}
          habits={habits}
          payments={store.payments}
          today={today}
          period="last30"
        />
      )}
      {hasStatement && (
        <EstimateVsSpentCard
          entries={store.entries}
          habits={habits}
          payments={store.payments}
          links={merchantHabits}
          onLink={onLinkMerchant}
          from={addDays(today, -29)}
          to={today}
          periodLabel={m.compare.last30}
        />
      )}

      <Text style={styles.sectionTitle}>{m.history.calendar}</Text>
      <HistoryCalendar
        store={store}
        tracking={tracking}
        today={today}
        habits={habits}
        links={merchantHabits}
      />
    </ScrollView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(4) },
    hint: { color: c.muted, textAlign: 'center', fontSize: 13 },
    sectionTitle: { ...typeScale.title, color: c.text, marginTop: spacing(2), ...c.heading },
  });
