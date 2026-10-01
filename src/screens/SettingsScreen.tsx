import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { unlockStats } from '../../modules/unlock-stats';
import { exportEntries, pickImportFile } from '../backup';
import { Button } from '../components/Button';
import { REMINDER_TIMES, disableReminders, enableReminders, formatTime } from '../reminders';
import { saveUnlockCheckpoint } from '../storage';
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
      Alert.alert(
        'Import complete',
        `Read ${incoming.length} entries. Where both had the same check-in, the newer one was kept.`,
      );
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
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: preview.background, borderColor: preview.border },
                  ]}
                >
                  <View style={[styles.swatchCard, { backgroundColor: preview.surface }]} />
                  <View style={[styles.swatchDot, { backgroundColor: preview.accent }]} />
                </View>
                <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>
                  {THEME_LABEL[name]}
                </Text>
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

      <UnlockSettings settings={settings} />

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

function UnlockSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const supported = unlockStats.isSupported();
  const [hasAccess, setHasAccess] = useState(() => unlockStats.hasUsageAccess());
  // Set while the user is in Android settings granting access, so we can finish turning tracking on.
  const enablingRef = useRef(false);
  const enabled = settings.settings.trackUnlocks;

  const enable = async () => {
    // Count from now, not from whenever tracking was last on.
    await saveUnlockCheckpoint(new Date());
    await settings.update({ trackUnlocks: true });
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const access = unlockStats.hasUsageAccess();
      setHasAccess(access);
      if (enablingRef.current && access) enable();
      enablingRef.current = false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (on: boolean) => {
    if (!on) return settings.update({ trackUnlocks: false });
    if (unlockStats.hasUsageAccess()) return enable();
    Alert.alert(
      'Allow usage access',
      'Android only shares unlock counts with apps that have usage access. On the next screen, find Mood Tracker and turn on "Permit usage access", then come back.\n\nIf it is greyed out or says "Restricted setting": open Android Settings > Apps > Mood Tracker, tap the ⋮ menu, choose "Allow restricted settings", then try again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open settings',
          onPress: () => {
            enablingRef.current = true;
            unlockStats.openUsageAccessSettings();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.switchRow}>
        <Text style={styles.title}>Phone unlocks</Text>
        <Switch
          value={enabled && supported}
          onValueChange={toggle}
          disabled={!supported}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>
        {supported
          ? 'Counts how often you unlocked your phone since your last check-in, and adds it to the stats and the Claude prompt. Only check-ins saved for the current time slot get a count. The data stays on this phone.'
          : 'Needs Android 9 or later and an installed build of the app (it does not work in Expo Go).'}
      </Text>
      {supported && enabled && !hasAccess && (
        <>
          <Text style={styles.warning}>Usage access is off, so unlocks are not being counted.</Text>
          <Button
            title="Open usage access settings"
            variant="secondary"
            onPress={unlockStats.openUsageAccessSettings}
          />
        </>
      )}
    </View>
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
    warning: { color: c.danger },
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
