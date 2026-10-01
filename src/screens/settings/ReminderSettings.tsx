import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { disableReminders, enableReminders, scheduleReminders } from '../../reminders/schedule';
import {
  REMINDER_STEP_MINUTES,
  canShift,
  formatRange,
  formatTime,
  shiftReminderTime,
} from '../../reminders/times';
import { Palette, spacing, useColors, useThemedStyles } from '../../theme/theme';
import { SLOTS, SLOT_LABEL, Slot } from '../../data/types';
import { SettingsStore } from '../../hooks/useSettings';

/** Daily reminders, one per slot, each movable within its slot's window. */
export function ReminderSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const { remindersEnabled, reminderTimes, name } = settings.settings;

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      if (enabled && !(await enableReminders(reminderTimes, name))) {
        Alert.alert(
          'Notifications are off',
          'Allow notifications for Mood Tracker in Android settings to get reminders.',
        );
        return;
      }
      if (!enabled) await disableReminders();
      await settings.update({ remindersEnabled: enabled });
    } catch (e) {
      Alert.alert('Could not update reminders', String(e));
    } finally {
      setBusy(false);
    }
  };

  const shift = async (slot: Slot, direction: -1 | 1) => {
    const next = {
      ...reminderTimes,
      [slot]: shiftReminderTime(slot, reminderTimes[slot], direction * REMINDER_STEP_MINUTES),
    };
    await settings.update({ reminderTimes: next });
    if (remindersEnabled) {
      scheduleReminders(next, name).catch((e) => Alert.alert('Could not update reminders', String(e)));
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.switchRow}>
        <Text style={styles.title}>Daily reminders</Text>
        <Switch
          value={remindersEnabled}
          onValueChange={toggle}
          disabled={busy}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      {SLOTS.map((slot) => {
        const time = reminderTimes[slot];
        return (
          <View key={slot} style={styles.timeRow}>
            <View style={styles.timeLabel}>
              <Text style={styles.slot}>{SLOT_LABEL[slot]}</Text>
              <Text style={styles.range}>{formatRange(slot)}</Text>
            </View>
            <StepButton
              label="−"
              hint={`Earlier ${SLOT_LABEL[slot].toLowerCase()} reminder`}
              disabled={!canShift(slot, time, -1)}
              onPress={() => shift(slot, -1)}
            />
            <Text
              style={[styles.time, !remindersEnabled && styles.timeOff]}
              accessibilityLabel={`${SLOT_LABEL[slot]} reminder at ${formatTime(time)}`}
            >
              {formatTime(time)}
            </Text>
            <StepButton
              label="+"
              hint={`Later ${SLOT_LABEL[slot].toLowerCase()} reminder`}
              disabled={!canShift(slot, time, 1)}
              onPress={() => shift(slot, 1)}
            />
          </View>
        );
      })}
    </View>
  );
}

function StepButton({
  label,
  hint,
  disabled,
  onPress,
}: {
  label: string;
  hint: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.stepButton, (pressed || disabled) && styles.dimmed]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    section: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
    timeLabel: { flex: 1 },
    slot: { fontSize: 15, color: c.text },
    range: { fontSize: 12, color: c.muted, marginTop: 1 },
    time: {
      width: 64,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      fontVariant: ['tabular-nums'],
    },
    timeOff: { color: c.muted },
    stepButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepText: { fontSize: 20, lineHeight: 22, color: c.accent, fontWeight: '600' },
    dimmed: { opacity: 0.35 },
  });
