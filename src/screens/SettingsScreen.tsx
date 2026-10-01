import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { exportEntries, pickImportFile } from '../backup';
import { Button } from '../components/Button';
import { REMINDER_TIMES, disableReminders, enableReminders, formatTime } from '../reminders';
import { Palette, THEMES, THEME_LABEL, palettes, spacing, useColors, useThemedStyles } from '../theme';
import { SLOT_LABEL } from '../types';
import { EntriesStore } from '../useEntries';
import { SettingsStore } from '../useSettings';

type Props = { store: EntriesStore; settings: SettingsStore };

export function SettingsScreen({ store, settings }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const { remindersEnabled, theme } = settings.settings;

  const toggleReminders = async (enabled: boolean) => {
    setBusy(true);
    try {
      if (enabled && !(await enableReminders())) {
        Alert.alert('Notifications are off', 'Allow notifications for Mood Tracker in Android settings to get reminders.');
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
        <Text style={styles.title}>Theme</Text>
        <View style={styles.themeRow} accessibilityRole="radiogroup">
          {THEMES.map((name) => {
            const selected = name === theme;
            const preview = palettes[name];
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${THEME_LABEL[name]} theme`}
                onPress={() => settings.update({ theme: name })}
                style={[styles.themeOption, selected && styles.themeOptionSelected]}
              >
                <View style={[styles.swatch, { backgroundColor: preview.background, borderColor: preview.border }]}>
                  <View style={[styles.swatchCard, { backgroundColor: preview.surface }]} />
                  <View style={[styles.swatchDot, { backgroundColor: preview.accent }]} />
                </View>
                <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>{THEME_LABEL[name]}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.title}>Daily reminders</Text>
          <Switch
            value={remindersEnabled}
            onValueChange={toggleReminders}
            disabled={busy}
            trackColor={{ true: c.accent, false: c.border }}
            thumbColor={c.surface}
          />
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

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(4) },
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
    body: { color: c.muted, lineHeight: 20 },
    hint: { color: c.muted, fontSize: 13, textAlign: 'center' },
    themeRow: { flexDirection: 'row', gap: spacing(2) },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      gap: spacing(2),
      padding: spacing(2),
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeOptionSelected: { borderColor: c.accent },
    swatch: {
      width: '100%',
      height: 56,
      borderRadius: 8,
      borderWidth: 1,
      padding: spacing(2),
      justifyContent: 'space-between',
    },
    swatchCard: { height: 16, borderRadius: 4 },
    swatchDot: { width: 16, height: 8, borderRadius: 4, alignSelf: 'flex-end' },
    themeLabel: { color: c.muted },
    themeLabelSelected: { color: c.text, fontWeight: '600' },
  });
