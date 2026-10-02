import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { NOTE_MAX_LENGTH, saveTimes } from '@domain/checkins/entries';
import { Sleep, isEmptySleep, sameSleep } from '@domain/checkins/sleep';
import { Entry, Mood, Slot } from '@domain/checkins/types';
import { EMPTY_LOG, Habit, HabitLog, cleanLog, isWin, sameLog } from '@domain/habits/habits';
import { describeLog } from '@domain/habits/insights';
import { applyUrgeFloors, urgeFloors } from '@domain/habits/urges';
import { describeSignals } from '@ui/i18n/describeSignals';
import { withSteps } from '@infrastructure/signals/steps';
import { withUnlocks } from '@infrastructure/signals/unlocks';
import { Button } from '@ui/components/Button';
import { Card } from '@ui/components/Card';
import { MoodPicker } from '@ui/components/MoodPicker';
import { formatInteger } from '@ui/i18n/format';
import { describeLoggedAt } from '@ui/i18n/loggedAt';
import { describeSleep } from '@ui/i18n/sleep';
import { SleepLogger } from './SleepLogger';
import { HabitLogger } from '@ui/habits/HabitLogger';
import { EntriesStore } from '@ui/hooks/useEntries';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { useVoice } from '@ui/theme/voiceContext';

/** Which phone signals to count when a live check-in is saved. */
export type Tracking = { unlocks: boolean; steps: boolean };

export type SlotCardProps = {
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

/** One slot of a day: collapsed it shows what was logged, open it edits the check-in. */
/** The character count shows once a note is this close to the limit. */
const NOTE_COUNTER_FROM = 200;

export function SlotCard({
  date,
  slot,
  entry,
  open,
  onOpen,
  store,
  tracking,
  habits,
  onSaved,
}: SlotCardProps) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const voice = useVoice();
  const { m, locale, timeZone } = useLocale();
  const loggedLine = entry ? (
    <Text style={styles.loggedAt}>{describeLoggedAt(entry, timeZone, locale)}</Text>
  ) : null;
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [note, setNote] = useState(entry?.note ?? '');
  const floors = urgeFloors(store.urges, date, slot);
  const [draftLog, setHabitLog] = useState<HabitLog>(entry?.habits ?? EMPTY_LOG);
  // Urges that took the best of you are a minimum for the doses.
  const habitLog = applyUrgeFloors(draftLog, floors);
  // Only the morning check-in asks about last night.
  const asksSleep = slot === 'morning';
  const [sleep, setSleep] = useState<Sleep>(entry?.sleep ?? {});

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
        ...(asksSleep && !isEmptySleep(sleep) ? { sleep } : {}),
        ...saveTimes(entry, now),
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
        {loggedLine}
        {entry?.note ? (
          <Text style={styles.notePreview} numberOfLines={2}>
            {entry.note}
          </Text>
        ) : null}
        {entry?.sleep ? <Text style={styles.unlocks}>{describeSleep(entry.sleep, locale)}</Text> : null}
        {entry?.habits && <HabitLines log={entry.habits} habits={habits} />}
        {entry && <SignalLines entry={entry} />}
      </Pressable>
    );
  }

  const unchanged =
    entry !== undefined &&
    entry.mood === mood &&
    (entry.note ?? '') === note.trim() &&
    sameLog(entry.habits, habitLog) &&
    sameSleep(entry.sleep, asksSleep ? sleep : undefined);

  return (
    <Card accent>
      <View style={styles.cardHeader}>
        <Text style={styles.slotTitle}>{voice.slotLabels[slot]}</Text>
        {mood !== null && <Text style={styles.muted}>{voice.moodLabels[mood]}</Text>}
      </View>
      {loggedLine}
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
      {note.length > NOTE_MAX_LENGTH - NOTE_COUNTER_FROM && (
        <Text style={styles.noteCount}>
          {formatInteger(note.length, locale)} / {formatInteger(NOTE_MAX_LENGTH, locale)}
        </Text>
      )}
      {asksSleep && <SleepLogger sleep={sleep} onChange={setSleep} />}
      <HabitLogger habits={habits} log={habitLog} floors={floors} onChange={setHabitLog} />
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
    loggedAt: { color: c.muted, fontSize: 12, marginTop: -spacing(2) },
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
      // Long notes scroll inside the box instead of pushing Save off the screen.
      maxHeight: 240,
    },
    noteCount: { color: c.muted, fontSize: 12, textAlign: 'right', marginTop: -spacing(2) },
    removeLink: { alignSelf: 'center', padding: spacing(1) },
    removeText: { color: c.danger },
  });
