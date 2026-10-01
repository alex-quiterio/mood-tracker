import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BreathingModal } from '../components/BreathingModal';
import { QuoteCard } from '../components/QuoteCard';
import { Button } from '../components/Button';
import { Burst, MoodBurst, makeBurst } from '../components/MoodBurst';
import { MoodPicker } from '../components/MoodPicker';
import { LiveCount, LiveCounts } from '../components/LiveCounts';
import { dayOfMonth, lastNDays, localDate, slotForTime, weekdayShort } from '../data/dates';
import { NOTE_MAX_LENGTH, entryKey } from '../data/entries';
import { burstEmojis, greetingFor, greetingText, offersBreathing, streakLabel } from '../checkin/moments';
import { currentStreak, weeklyStats } from '../data/stats';
import { Palette, spacing, useColors, useThemedStyles } from '../theme/theme';
import { Entry, Mood, SLOTS, Slot } from '../data/types';
import { describeSignals } from '../signals/describe';
import { formatSteps, previewSteps, withSteps } from '../signals/steps';
import { previewUnlocks, withUnlocks } from '../signals/unlocks';
import { EntriesStore } from '../hooks/useEntries';
import { useLivePreview } from '../hooks/useLivePreview';
import { useVoice } from '../voices/voices';

export type Tracking = { unlocks: boolean; steps: boolean };

type Props = { store: EntriesStore; tracking: Tracking; name: string };

export function CheckInScreen({ store, tracking, name }: Props) {
  const styles = useThemedStyles(makeStyles);
  const today = localDate();
  const days = lastNDays(7, today);
  const [date, setDate] = useState(today);
  const [openSlot, setOpenSlot] = useState<Slot>(slotForTime());
  const [burst, setBurst] = useState<Burst>({ key: 0, particles: [] });
  const [offerBreath, setOfferBreath] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const liveUnlocks = useLivePreview(previewUnlocks, tracking.unlocks, store.entries);
  const liveSteps = useLivePreview(previewSteps, tracking.steps, store.entries);
  const voice = useVoice();

  const greeting = greetingFor(slotForTime());
  const streak = streakLabel(currentStreak(store.entries, today));
  const week = weeklyStats(store.entries, today);
  const liveCounts: LiveCount[] = [];
  if (liveUnlocks) {
    liveCounts.push({
      icon: '📱',
      value: String(liveUnlocks.count),
      unit: liveUnlocks.count === 1 ? 'unlock' : 'unlocks',
      from: liveUnlocks.from,
      usual: week.unlockAverage === null ? null : `Usually about ${Math.round(week.unlockAverage)}`,
    });
  }
  if (liveSteps) {
    liveCounts.push({
      icon: '👟',
      value: formatSteps(liveSteps.count),
      unit: liveSteps.count === 1 ? 'step' : 'steps',
      from: liveSteps.from,
      usual: week.stepAverage === null ? null : `Usually about ${formatSteps(week.stepAverage)}`,
    });
  }

  const onSaved = (mood: Mood) => {
    setBurst((b) => makeBurst(b.key, burstEmojis(voice, mood)));
    setOfferBreath(offersBreathing(mood));
  };

  const entryFor = (slot: Slot) => store.entries.find((e) => e.date === date && e.slot === slot);

  const selectDate = (next: string) => {
    setDate(next);
    // Today opens the slot for the current time; past days open the first empty slot.
    const firstEmpty = SLOTS.find((s) => !store.entries.some((e) => e.date === next && e.slot === s));
    setOpenSlot(next === today ? slotForTime() : (firstEmpty ?? 'morning'));
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.greetingRow}>
          <Text style={styles.greeting}>
            {greetingText(slotForTime(), name)} {greeting.emoji}
          </Text>
          {streak && (
            <View style={styles.streak}>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>

        <QuoteCard date={today} />

        {date === today && <LiveCounts counts={liveCounts} today={today} />}

        {offerBreath && (
          <View style={styles.comfort}>
            <Text style={styles.comfortText}>{voice.comfort}</Text>
            <View style={styles.comfortActions}>
              <View style={styles.flex}>
                <Button
                  title="Breathe with me"
                  onPress={() => {
                    setOfferBreath(false);
                    setBreathing(true);
                  }}
                />
              </View>
              <View style={styles.flex}>
                <Button title="Not now" variant="secondary" onPress={() => setOfferBreath(false)} />
              </View>
            </View>
          </View>
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
                accessibilityLabel={`${d}, ${count} of 3 logged`}
                onPress={() => selectDate(d)}
                style={[styles.day, selected && styles.daySelected]}
              >
                <Text style={[styles.dayName, selected && styles.daySelectedText]}>
                  {d === today ? 'Today' : weekdayShort(d)}
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
              onSaved={onSaved}
            />
          );
        })}
      </ScrollView>
      <MoodBurst burst={burst} />
      <BreathingModal visible={breathing} onClose={() => setBreathing(false)} />
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
  onSaved: (mood: Mood) => void;
};

function SlotCard({ date, slot, entry, open, onOpen, store, tracking, onSaved }: SlotCardProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [note, setNote] = useState(entry?.note ?? '');

  const save = async () => {
    if (mood === null) return;
    const trimmed = note.trim();
    const now = new Date();
    try {
      const base = { date, slot, mood, ...(trimmed ? { note: trimmed } : {}), recordedAt: now.toISOString() };
      const withCounts = await withUnlocks(base, entry, tracking.unlocks, now);
      const next = await withSteps(withCounts, entry, tracking.steps, now);
      await store.save(next);
      onSaved(mood);
    } catch (e) {
      Alert.alert('Could not save', String(e));
    }
  };

  const clear = () =>
    Alert.alert('Remove this check-in?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => store.remove(date, slot) },
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
            <Text style={styles.muted}>Not logged</Text>
          )}
        </View>
        {entry?.note ? (
          <Text style={styles.notePreview} numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
        {entry && <SignalLines entry={entry} />}
      </Pressable>
    );
  }

  const unchanged = entry !== undefined && entry.mood === mood && (entry.note ?? '') === note.trim();

  return (
    <View style={[styles.card, styles.cardOpen]}>
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
      <Button title={entry ? 'Update' : 'Save'} onPress={save} disabled={mood === null || unchanged} />
      {entry && (
        <Pressable accessibilityRole="button" onPress={clear} style={styles.removeLink}>
          <Text style={styles.removeText}>Remove check-in</Text>
        </Pressable>
      )}
    </View>
  );
}

function SignalLines({ entry }: { entry: Entry }) {
  const styles = useThemedStyles(makeStyles);
  return describeSignals(entry).map((line) => (
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
    greeting: { fontSize: 17, color: c.text, fontWeight: '500', ...c.heading },
    streak: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(1),
    },
    streakText: { color: c.text, fontSize: 13, fontWeight: '600' },
    comfort: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.accent,
      gap: spacing(3),
    },
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
    cardOpen: { borderColor: c.accent },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    slotTitle: { fontSize: 18, fontWeight: '600', color: c.text, ...c.heading },
    muted: { color: c.muted },
    badgeText: { color: c.onMood },
    badge: { paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: 999 },
    notePreview: { color: c.muted },
    unlocks: { color: c.muted, fontSize: 13 },
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
