import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@ui/components/Card';
import { BreathingModal } from '@ui/components/BreathingModal';
import { QuoteCard } from '@ui/components/QuoteCard';
import { Button } from '@ui/components/Button';
import { Burst, MoodBurst, makeBurst } from '@ui/components/MoodBurst';
import { MoodPicker } from '@ui/components/MoodPicker';
import { LiveCount, LiveCounts } from '@ui/components/LiveCounts';
import { dayOfMonth, lastNDays, localDate, slotForTime } from '@domain/shared/dates';
import { weekdayShort } from '@domain/i18n/format';
import { NOTE_MAX_LENGTH, entryKey } from '@domain/checkins/entries';
import {
  burstEmojis,
  greetingFor,
  greetingText,
  offersBreathing,
  streakLabel,
} from '@domain/checkins/moments';
import { currentStreak, weeklyStats } from '@domain/checkins/stats';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { Entry, Mood, SLOTS, Slot } from '@domain/checkins/types';
import { describeSignals } from '@domain/signals/describe';
import { previewSteps, withSteps } from '@infrastructure/signals/steps';
import { formatSteps } from '@domain/signals/format';
import { previewUnlocks, withUnlocks } from '@infrastructure/signals/unlocks';
import { EntriesStore } from '@ui/hooks/useEntries';
import { useLivePreview } from '@ui/hooks/useLivePreview';
import { PauseOrb } from '@ui/practice/PauseOrb';
import { PracticeModal } from '@ui/practice/PracticeModal';
import { Habit, HabitLog, EMPTY_LOG, cleanLog, isWin, sameLog } from '@domain/habits/habits';
import { describeLog } from '@domain/habits/insights';
import { HabitLogger } from '@ui/habits/HabitLogger';
import { useLocale } from '@ui/i18n/LocaleContext';
import { useVoice } from '@ui/theme/voiceContext';

export type Tracking = { unlocks: boolean; steps: boolean };

type Props = {
  store: EntriesStore;
  tracking: Tracking;
  name: string;
  /** Opens on this day instead of today, e.g. from the calendar. */
  initialDate?: string;
  habits: Habit[];
};

export function CheckInScreen({ store, tracking, name, initialDate, habits }: Props) {
  const styles = useThemedStyles(makeStyles);
  const today = localDate();
  const days = lastNDays(7, today);
  const [date, setDate] = useState(initialDate && days.includes(initialDate) ? initialDate : today);
  const firstEmptySlot = (day: string) =>
    SLOTS.find((s) => !store.entries.some((e) => e.date === day && e.slot === s)) ?? 'morning';
  // Today opens the slot for the current time; past days open their first empty slot.
  const [openSlot, setOpenSlot] = useState<Slot>(date === today ? slotForTime() : firstEmptySlot(date));
  const [burst, setBurst] = useState<Burst>({ key: 0, particles: [] });
  const [offerBreath, setOfferBreath] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [practicing, setPracticing] = useState(false);
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
    </View>
  );
}

type SlotCardProps = {
  date: string;
  slot: Slot;
  entry: Entry | undefined;
  open: boolean;
  onOpen: () => void;
  store: EntriesStore;
  tracking: Tracking;
  habits: Habit[];
  onSaved: (mood: Mood, habitWin: boolean) => void;
};

function SlotCard({ date, slot, entry, open, onOpen, store, tracking, habits, onSaved }: SlotCardProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const { m } = useLocale();
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [note, setNote] = useState(entry?.note ?? '');
  const [habitLog, setHabitLog] = useState<HabitLog>(entry?.habits ?? EMPTY_LOG);

  const save = async () => {
    if (mood === null) return;
    const trimmed = note.trim();
    const now = new Date();
    try {
      const logged = cleanLog(habitLog);
      const base = {
        date,
        slot,
        mood,
        ...(trimmed ? { note: trimmed } : {}),
        ...(logged ? { habits: logged } : {}),
        recordedAt: now.toISOString(),
      };
      const withCounts = await withUnlocks(base, entry, tracking.unlocks, now);
      const next = await withSteps(withCounts, entry, tracking.steps, now);
      await store.save(next);
      onSaved(mood, isWin(logged));
    } catch (e) {
      Alert.alert(m.checkin.couldNotSave, String(e));
    }
  };

  const clear = () =>
    Alert.alert(m.checkin.removeTitle, undefined, [
      { text: m.common.cancel, style: 'cancel' },
      { text: m.common.remove, style: 'destructive', onPress: () => store.remove(date, slot) },
    ]);

  if (!open) {
    return (
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.slotTitle}>{voice.slotLabels[slot]}</Text>
          {entry ? (
            <View style={[styles.badge, { backgroundColor: c.moodColors[entry.mood] }]}>
              <Text style={styles.badgeText}>
                {voice.moodEmoji[entry.mood]} {voice.moodLabels[entry.mood]}
              </Text>
            </View>
          ) : (
            <Text style={styles.muted}>{m.common.notLogged}</Text>
          )}
        </View>
        {entry?.note ? (
          <Text style={styles.notePreview} numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
        {entry?.habits && <HabitLines log={entry.habits} habits={habits} />}
        {entry && <SignalLines entry={entry} />}
      </Pressable>
    );
  }

  const unchanged =
    entry !== undefined &&
    entry.mood === mood &&
    (entry.note ?? '') === note.trim() &&
    sameLog(entry.habits, habitLog);

  return (
    <Card accent>
      <View style={styles.cardHeader}>
        <Text style={styles.slotTitle}>{voice.slotLabels[slot]}</Text>
        {mood !== null && <Text style={styles.muted}>{voice.moodLabels[mood]}</Text>}
      </View>
      <MoodPicker value={mood} onChange={setMood} />
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder={voice.notePrompts[slot]}
        placeholderTextColor={c.muted}
        maxLength={NOTE_MAX_LENGTH}
        multiline
      />
      <HabitLogger habits={habits} log={habitLog} onChange={setHabitLog} />
      <Button
        title={entry ? m.common.update : m.common.save}
        onPress={save}
        disabled={mood === null || unchanged}
      />
      {entry && (
        <Pressable accessibilityRole="button" onPress={clear} style={styles.removeLink}>
          <Text style={styles.removeText}>{m.checkin.removeLink}</Text>
        </Pressable>
      )}
    </Card>
  );
}

function HabitLines({ log, habits }: { log: HabitLog; habits: Habit[] }) {
  const styles = useThemedStyles(makeStyles);
  const summary = describeLog(log, habits);
  return (
    <>
      {summary ? <Text style={styles.unlocks}>{summary}</Text> : null}
      {log.instead ? <Text style={styles.instead}>🌱 {log.instead}</Text> : null}
    </>
  );
}

function SignalLines({ entry }: { entry: Entry }) {
  const styles = useThemedStyles(makeStyles);
  const { locale } = useLocale();
  return describeSignals(entry, locale).map((line) => (
    <Text key={line} style={styles.unlocks}>
      {line}
    </Text>
  ));
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
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    slotTitle: { fontSize: 18, fontWeight: '600', color: c.text, ...c.heading },
    muted: { color: c.muted },
    badgeText: { color: c.onMood },
    badge: { paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: 999 },
    notePreview: { color: c.muted },
    unlocks: { color: c.muted, fontSize: 13 },
    instead: { color: c.accent, fontSize: 13 },
    noteInput: {
      minHeight: 64,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing(3),
      fontSize: 15,
      color: c.text,
      textAlignVertical: 'top',
    },
    removeLink: { alignSelf: 'center', padding: spacing(1) },
    removeText: { color: c.danger },
  });
