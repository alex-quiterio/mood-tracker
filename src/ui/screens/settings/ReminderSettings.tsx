import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@ui/components/Card';
import { RoundButton } from '@ui/components/RoundButton';
import {
  disableReminders,
  enableReminders,
  scheduleReminders,
} from '@infrastructure/notifications/reminders';
import { reminderMessages } from '@ui/i18n/reminders';
import {
  REMINDER_STEP_MINUTES,
  canShift,
  formatRange,
  formatTime,
  shiftReminderTime,
} from '@domain/reminders/times';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { SLOTS, Slot } from '@domain/checkins/types';
import { SettingsStore } from '@ui/hooks/useSettings';
import { useLocale } from '@ui/i18n/LocaleContext';

/** Daily reminders, one per slot, each movable within its slot's window. */
export function ReminderSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const { remindersEnabled, reminderTimes, name } = settings.settings;
  const { m, locale } = useLocale();

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      if (
        enabled &&
        !(await enableReminders(reminderTimes, reminderMessages(name, locale), m.reminders.channel))
      ) {
        Alert.alert(m.reminders.offTitle, m.reminders.offBody);
        return;
      }
      if (!enabled) await disableReminders();
      await settings.update({ remindersEnabled: enabled });
    } catch (e) {
      Alert.alert(m.reminders.failed, String(e));
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
      scheduleReminders(next, reminderMessages(name, locale)).catch((e) =>
        Alert.alert(m.reminders.failed, String(e)),
      );
    }
  };

  return (
    <Card>
      <View style={styles.switchRow}>
        <Text style={styles.title}>{m.reminders.title}</Text>
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
              <Text style={styles.slot}>{m.slots[slot]}</Text>
              <Text style={styles.range}>{formatRange(slot)}</Text>
            </View>
            <RoundButton
              label="−"
              accessibilityLabel={m.reminders.earlier(m.slots[slot])}
              disabled={!canShift(slot, time, -1)}
              onPress={() => shift(slot, -1)}
            />
            <Text
              style={[styles.time, !remindersEnabled && styles.timeOff]}
              accessibilityLabel={m.reminders.atA11y(m.slots[slot], formatTime(time))}
            >
              {formatTime(time)}
            </Text>
            <RoundButton
              label="+"
              accessibilityLabel={m.reminders.later(m.slots[slot])}
              disabled={!canShift(slot, time, 1)}
              onPress={() => shift(slot, 1)}
            />
          </View>
        );
      })}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
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
  });
