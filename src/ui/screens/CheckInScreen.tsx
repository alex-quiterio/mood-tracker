import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { Card } from '@ui/kit/Card';
import { BreathingModal } from '@ui/features/practice/BreathingModal';
import { QuoteCard } from '@ui/features/checkin/QuoteCard';
import { Button } from '@ui/kit/Button';
import { Burst, MoodBurst, makeBurst } from '@ui/features/checkin/MoodBurst';
import { LiveCount, LiveCounts } from '@ui/features/checkin/LiveCounts';
import { localDate, slotForTime } from '@domain/shared/dates';
import { longDate } from '@ui/foundation/i18n/format';
import { moonA11y, moonLabel } from '@ui/foundation/i18n/moon';
import { moonOn } from '@domain/moon/phase';
import { entryKey, lastChangedAt } from '@domain/checkins/entries';
import { offersBreathing } from '@domain/checkins/moments';
import { burstEmojis } from '@ui/foundation/voices/voices';
import { greetingFor, greetingText, streakLabel } from '@ui/foundation/i18n/greetings';
import { currentStreak, weeklyStats } from '@domain/checkins/stats';
import { Palette, spacing, useThemedStyles, typeScale } from '@ui/foundation/theme/theme';
import { Mood, SLOTS, Slot } from '@domain/checkins/types';
import { pruneDrafts } from '@infrastructure/storage/draftsRepository';
import { previewSteps } from '@infrastructure/signals/steps';
import { formatSteps } from '@ui/foundation/i18n/signals';
import { previewUnlocks } from '@infrastructure/signals/unlocks';
import { EntriesStore } from '@ui/state/useEntries';
import { useLivePreview } from '@ui/features/checkin/useLivePreview';
import { PauseOrb } from '@ui/features/practice/PauseOrb';
import { PracticeModal } from '@ui/features/practice/PracticeModal';
import { LevelBar } from '@ui/features/progress/LevelBar';
import { useProgress } from '@ui/features/progress/useProgress';
import { Habit, activeHabits } from '@domain/habits/habits';
import { urgeForecast } from '@domain/habits/urges';
import { UrgeForecastCard } from '@ui/features/habits/UrgeForecastCard';
import { UrgeModal } from '@ui/features/habits/UrgeModal';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { SlotCard, Tracking } from '@ui/features/checkin/SlotCard';
import { MerchantLinks } from '@domain/spending/categories';
import { useVoice } from '@ui/foundation/theme/voiceContext';

type Props = {
  store: EntriesStore;
  tracking: Tracking;
  name: string;
  /** Opens this slot, e.g. tapped on the home-screen widget. */
  initialSlot?: Slot;
  /** Opens with the pause (breathing or focus) showing. */
  initialPause?: boolean;
  habits: Habit[];
  /** Merchants linked to habits, whose payments prefill doses. */
  links: MerchantLinks;
};

export function CheckInScreen({ store, tracking, name, initialSlot, initialPause, habits, links }: Props) {
  const styles = useThemedStyles(makeStyles);
  // Only today can be checked in; past days are read-only in History.
  const today = localDate();
  const [openSlot, setOpenSlot] = useState<Slot>(initialSlot ?? slotForTime());
  const [burst, setBurst] = useState<Burst>({ key: 0, particles: [] });
  const [offerBreath, setOfferBreath] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [practicing, setPracticing] = useState(initialPause ?? false);
  const [urging, setUrging] = useState(false);
  const reduceHabits = activeHabits(habits, 'reduce');
  const liveUnlocks = useLivePreview(previewUnlocks, tracking.unlocks, store.entries);
  const liveSteps = useLivePreview(previewSteps, tracking.steps, store.entries);
  const voice = useVoice();
  const { m, locale } = useLocale();

  useEffect(() => {
    pruneDrafts(today).catch(() => {});
  }, [today]);

  const greeting = greetingFor(slotForTime(), locale);
  const streak = streakLabel(currentStreak(store.entries, today), locale);
  const progress = useProgress(store.entries, store.urges, today);
  const week = weeklyStats(store.entries, today);
  const forecast = urgeForecast(store.urges);
  const liveCounts: LiveCount[] = [];
  if (liveUnlocks) {
    liveCounts.push({
      icon: '📱',
      value: String(liveUnlocks.count),
      unit: m.signals.unlocks(liveUnlocks.count),
      from: liveUnlocks.from,
      usual:
        week.unlockAverage === null ? null : m.checkin.usuallyAbout(String(Math.round(week.unlockAverage))),
    });
  }
  if (liveSteps) {
    liveCounts.push({
      icon: '👟',
      value: formatSteps(liveSteps.count, locale),
      unit: m.signals.steps(liveSteps.count),
      from: liveSteps.from,
      usual: week.stepAverage === null ? null : m.checkin.usuallyAbout(formatSteps(week.stepAverage, locale)),
    });
  }

  const onSaved = (mood: Mood, habitWin: boolean) => {
    setBurst((b) => makeBurst(b.key, burstEmojis(voice, mood, habitWin)));
    setOfferBreath(offersBreathing(mood));
  };

  const entryFor = (slot: Slot) => store.entries.find((e) => e.date === today && e.slot === slot);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.greetingRow}>
          <PauseOrb emoji={greeting.emoji} onPress={() => setPracticing(true)} />
          <Text style={styles.greeting}>{greetingText(slotForTime(), name, locale)}</Text>
          {streak && (
            <View style={styles.streak}>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>
        <LevelBar progress={progress} />

        <QuoteCard date={today} />

        {reduceHabits.length > 0 && forecast && (
          <UrgeForecastCard forecast={forecast} onUrge={() => setUrging(true)} />
        )}
        <View style={styles.actions}>
          {reduceHabits.length > 0 && !forecast && (
            <View style={styles.grow}>
              <Button title={m.urge.button} variant="secondary" onPress={() => setUrging(true)} />
            </View>
          )}
          <View style={styles.grow}>
            <Button title={m.checkin.pause} variant="secondary" onPress={() => setPracticing(true)} />
          </View>
        </View>

        <LiveCounts counts={liveCounts} today={today} />

        {offerBreath && (
          <Card accent>
            <Text style={styles.comfortText}>{voice.comfort}</Text>
            <View style={styles.comfortActions}>
              <View style={styles.flex}>
                <Button
                  title={m.checkin.breatheWithMe}
                  onPress={() => {
                    setOfferBreath(false);
                    setBreathing(true);
                  }}
                />
              </View>
              <View style={styles.flex}>
                <Button title={m.common.notNow} variant="secondary" onPress={() => setOfferBreath(false)} />
              </View>
            </View>
          </Card>
        )}

        <View style={styles.dateRow}>
          <Text style={[styles.dateHeading, styles.flex]}>{longDate(today, locale)}</Text>
          <Text style={styles.moon} accessibilityLabel={moonA11y(moonOn(today), locale)}>
            {moonLabel(moonOn(today), locale)}
          </Text>
        </View>

        {SLOTS.map((slot) => {
          const entry = entryFor(slot);
          return (
            <SlotCard
              // Remount when the day or saved entry changes so the draft resets.
              key={`${entryKey(today, slot)}|${entry ? lastChangedAt(entry) : ''}`}
              date={today}
              slot={slot}
              entry={entry}
              open={openSlot === slot}
              onOpen={() => setOpenSlot(slot)}
              store={store}
              tracking={tracking}
              habits={habits}
              links={links}
              onSaved={onSaved}
            />
          );
        })}
      </ScrollView>
      <MoodBurst burst={burst} />
      <BreathingModal visible={breathing} onClose={() => setBreathing(false)} />
      <PracticeModal visible={practicing} onClose={() => setPracticing(false)} />
      <UrgeModal
        visible={urging}
        habits={reduceHabits}
        onRecord={(urge) => store.addUrge(urge).catch(() => {})}
        onClose={() => setUrging(false)}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    container: { padding: spacing(4), gap: spacing(3) },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing(2),
    },
    greeting: { flex: 1, fontSize: 17, color: c.text, fontWeight: '500', ...c.heading },
    streak: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(1),
    },
    streakText: { color: c.text, fontSize: 13, fontWeight: '600' },
    comfortText: { color: c.text, fontSize: 15, lineHeight: 21 },
    comfortActions: { flexDirection: 'row', gap: spacing(2) },
    // Each button as wide as its words, sharing what's left, so neither label wraps.
    actions: { flexDirection: 'row', gap: spacing(2) },
    grow: { flexGrow: 1 },
    dateRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing(2), marginTop: spacing(1) },
    dateHeading: { ...typeScale.heading, color: c.muted, ...c.heading },
    moon: { fontSize: 13, color: c.muted },
  });
