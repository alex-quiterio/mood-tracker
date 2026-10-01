import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { exportEntries, pickImportFile } from '../backup';
import { Button } from '../components/Button';
import { REMINDER_TIMES, disableReminders, enableReminders, formatTime } from '../reminders';
import { loadSettings, saveSettings } from '../storage';
import { colors, spacing } from '../theme';
import { SLOT_LABEL } from '../types';
import { EntriesStore } from '../useEntries';

type Props = { store: EntriesStore };

export function SettingsScreen({ store }: Props) {
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => setRemindersEnabled(s.remindersEnabled));
  }, []);

  const toggleReminders = async (enabled: boolean) => {
    setBusy(true);
    try {
      if (enabled && !(await enableReminders())) {
        Alert.alert('Notifications are off', 'Allow notifications for Mood Tracker in Android settings to get reminders.');
        return;
      }
      if (!enabled) await disableReminders();
      setRemindersEnabled(enabled);
      await saveSettings({ remindersEnabled: enabled });
    } catch (e) {
      Alert.alert('Could not update reminders', String(e));
    } finally {
      setBusy(false);
    }
  };

  const doExport = async () => {
    try {
      await exportEntries(store.entries);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    }
  };

  const doImport = async () => {
    try {
      const incoming = await pickImportFile();
      if (!incoming) return;
      await store.importEntries(incoming);
      Alert.alert('Import complete', `Read ${incoming.length} entries. Where both had the same check-in, the newer one was kept.`);
    } catch (e) {
      Alert.alert('Import failed', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.title}>Daily reminders</Text>
          <Switch value={remindersEnabled} onValueChange={toggleReminders} disabled={busy} />
        </View>
        <Text style={styles.body}>
          {REMINDER_TIMES.map((r) => `${SLOT_LABEL[r.slot]} ${formatTime(r.hour, r.minute)}`).join(' · ')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Your data</Text>
        <Text style={styles.body}>
          Everything is stored only on this phone ({store.entries.length} check-ins). Uninstalling the app or
          switching phones deletes it, so export a backup now and then and save it somewhere safe.
        </Text>
        <Button title="Export backup (JSON)" onPress={doExport} disabled={store.entries.length === 0} />
        <Button title="Import backup" variant="secondary" onPress={doImport} />
        <Text style={styles.hint}>Importing merges with what is already here. Nothing is deleted.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), gap: spacing(4) },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing(4),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(3),
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { color: colors.muted, lineHeight: 20 },
  hint: { color: colors.muted, fontSize: 13, textAlign: 'center' },
});
