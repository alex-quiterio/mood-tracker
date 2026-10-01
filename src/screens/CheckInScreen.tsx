import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { MoodPicker } from '../components/MoodPicker';
import { dayOfMonth, lastNDays, localDate, slotForTime, weekdayShort } from '../dates';
import { NOTE_MAX_LENGTH, entryKey } from '../entries';
import { Palette, moodColors, onMoodColor, spacing, useColors, useThemedStyles } from '../theme';
import { Entry, MOOD_EMOJI, MOOD_LABEL, Mood, SLOTS, SLOT_LABEL, Slot } from '../types';
import { EntriesStore } from '../useEntries';

type Props = { store: EntriesStore };

export function CheckInScreen({ store }: Props) {
  const styles = useThemedStyles(makeStyles);
  const today = localDate();
  const days = lastNDays(7, today);
  const [date, setDate] = useState(today);
  const [openSlot, setOpenSlot] = useState<Slot>(slotForTime());

  const entryFor = (slot: Slot) => store.entries.find((e) => e.date === date && e.slot === slot);

  const selectDate = (next: string) => {
    setDate(next);
    // Today opens the slot for the current time; past days open the first empty slot.
    const firstEmpty = SLOTS.find((s) => !store.entries.some((e) => e.date === next && e.slot === s));
    setOpenSlot(next === today ? slotForTime() : (firstEmpty ?? 'morning'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
          />
        );
      })}
    </ScrollView>
  );
}

type SlotCardProps = {
  date: string;
  slot: Slot;
  entry: Entry | undefined;
  open: boolean;
  onOpen: () => void;
  store: EntriesStore;
};

function SlotCard({ date, slot, entry, open, onOpen, store }: SlotCardProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [note, setNote] = useState(entry?.note ?? '');

  const save = async () => {
    if (mood === null) return;
    const trimmed = note.trim();
    try {
      await store.save({
        date,
        slot,
        mood,
        ...(trimmed ? { note: trimmed } : {}),
        recordedAt: new Date().toISOString(),
      });
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
          <Text style={styles.slotTitle}>{SLOT_LABEL[slot]}</Text>
          {entry ? (
            <View style={[styles.badge, { backgroundColor: moodColors[entry.mood] }]}>
              <Text style={styles.badgeText}>
                {MOOD_EMOJI[entry.mood]} {MOOD_LABEL[entry.mood]}
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
      </Pressable>
    );
  }

  const unchanged = entry !== undefined && entry.mood === mood && (entry.note ?? '') === note.trim();

  return (
    <View style={[styles.card, styles.cardOpen]}>
      <View style={styles.cardHeader}>
        <Text style={styles.slotTitle}>{SLOT_LABEL[slot]}</Text>
        {mood !== null && <Text style={styles.muted}>{MOOD_LABEL[mood]}</Text>}
      </View>
      <MoodPicker value={mood} onChange={setMood} />
      <TextInput
        style={styles.noteInput}
        value={note}
        onChangeText={setNote}
        placeholder="Add a note (optional)"
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(3) },
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
    slotTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    muted: { color: c.muted },
    badgeText: { color: onMoodColor },
    badge: { paddingHorizontal: spacing(3), paddingVertical: spacing(1), borderRadius: 999 },
    notePreview: { color: c.muted },
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
