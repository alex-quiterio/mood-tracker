import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@ui/components/Card';
import { BreathingModal } from '@ui/components/BreathingModal';
import { QuoteCard } from '@ui/components/QuoteCard';
import { Button } from '@ui/components/Button';
import { Burst, MoodBurst, makeBurst } from '@ui/components/MoodBurst';
import { LiveCount, LiveCounts } from '@ui/components/LiveCounts';
import { dayOfMonth, lastNDays, localDate, slotForTime } from '@domain/shared/dates';
import { weekdayShort } from '@ui/i18n/format';
import { entryKey } from '@domain/checkins/entries';
import { offersBreathing } from '@domain/checkins/moments';
import { burstEmojis } from '@ui/voices/voices';
import { greetingFor, greetingText, streakLabel } from '@ui/i18n/greetings';
import { currentStreak, weeklyStats } from '@domain/checkins/stats';
import { Palette, spacing, useThemedStyles } from '@ui/theme/theme';
import { Mood, SLOTS, Slot } from '@domain/checkins/types';
import { previewSteps } from '@infrastructure/signals/steps';
import { formatSteps } from '@ui/i18n/signals';
import { previewUnlocks } from '@infrastructure/signals/unlocks';
import { EntriesStore } from '@ui/hooks/useEntries';
import { useLivePreview } from '@ui/hooks/useLivePreview';
import { PauseOrb } from '@ui/practice/PauseOrb';
import { PracticeModal } from '@ui/practice/PracticeModal';
import { Habit, activeHabits } from '@domain/habits/habits';
import { UrgeModal } from '@ui/habits/UrgeModal';
import { useLocale } from '@ui/i18n/LocaleContext';
import { SlotCard, Tracking } from '@ui/checkin/SlotCard';
import { useVoice } from '@ui/theme/voiceContext';

type Props = {
  store: EntriesStore;
  tracking: Tracking;
  name: string;
  /** Opens on this day instead of today, e.g. from the calendar. */
  initialDate?: string;
  /** Opens this slot, e.g. tapped on the home-screen widget. */
  initialSlot?: Slot;
  /** Opens with the pause (breathing or focus) showing. */
  initialPause?: boolean;
  habits: Habit[];
};

export function CheckInScreen({
  store,
  tracking,
  name,
  initialDate,
  initialSlot,
  initialPause,
  habits,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const today = localDate();
  const days = lastNDays(7, today);
  const [date, setDate] = useState(initialDate && days.includes(initialDate) ? initialDate : today);
  const firstEmptySlot = (day: string) =>
    SLOTS.find((s) => !store.entries.some((e) => e.date === day && e.slot === s)) ?? 'morning';
  // Today opens the slot for the current time; past days open their first empty slot.
  const [openSlot, setOpenSlot] = useState<Slot>(
    initialSlot ?? (date === today ? slotForTime() : firstEmptySlot(date)),
  );
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

  const greeting = greetingFor(slotForTime(), locale);
  const streak = streakLabel(currentStreak(store.entries, today), locale);
  const week = weeklyStats(store.entries, today);
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

  const entryFor = (slot: Slot) => store.entries.find((e) => e.date === date && e.slot === slot);

  const selectDate = (next: string) => {
    setDate(next);
    setOpenSlot(next === today ? slotForTime() : firstEmptySlot(next));
  };

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

        <QuoteCard date={today} />

        {reduceHabits.length > 0 && (
          <Button title={m.urge.button} variant="secondary" onPress={() => setUrging(true)} />
        )}

        {date === today && <LiveCounts counts={liveCounts} today={today} />}

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

        <View style={styles.dayStrip}>
          {days.map((d) => {
            const selected = d === date;
            const count = store.entries.filter((e) => e.date === d).length;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={m.checkin.dayA11y(d, count)}
                onPress={() => selectDate(d)}
                style={[styles.day, selected && styles.daySelected]}
              >
                <Text style={[styles.dayName, selected && styles.daySelectedText]}>
                  {d === today ? m.common.today : weekdayShort(d, locale)}
                </Text>
                <Text style={[styles.dayNumber, selected && styles.daySelectedText]}>{dayOfMonth(d)}</Text>
                <Text style={[styles.dayDots, selected && styles.daySelectedText]}>
                  {'●'.repeat(count)}
                  {'○'.repeat(3 - count)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {SLOTS.map((slot) => {
          const entry = entryFor(slot);
          return (
            <SlotCard
              // Remount when the day or saved entry changes so the draft resets.
              key={`${entryKey(date, slot)}|${entry?.recordedAt ?? ''}`}
              date={date}
              slot={slot}
              entry={entry}
              open={openSlot === slot}
              onOpen={() => setOpenSlot(slot)}
              store={store}
              tracking={tracking}
              habits={habits}
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
    dayStrip: { flexDirection: 'row', gap: spacing(1), marginBottom: spacing(1) },
    day: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing(2),
      borderRadius: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    daySelected: { backgroundColor: c.accent, borderColor: c.accent },
    daySelectedText: { color: c.accentText },
    dayName: { fontSize: 11, color: c.muted },
    dayNumber: { fontSize: 17, fontWeight: '600', color: c.text },
    dayDots: { fontSize: 7, color: c.muted, letterSpacing: 1, marginTop: 2 },
  });
