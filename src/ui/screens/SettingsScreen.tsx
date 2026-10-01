import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { unlockStats } from '@modules/unlock-stats';
import { mergeHabits } from '@domain/habits/habits';
import { ExportError } from '@domain/checkins/exportFormat';
import { LANGUAGE_SETTINGS } from '@domain/i18n/locale';
import { exportEntries, pickImportFile } from '@infrastructure/backup/backupFiles';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Button } from '@ui/components/Button';
import { scheduleReminders } from '@infrastructure/notifications/reminders';
import { NAME_MAX_LENGTH, cleanName } from '@domain/settings/settings';
import { saveUnlockCheckpoint } from '@infrastructure/storage/checkpoints';
import { Palette, THEMES, paletteFor, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { EntriesStore } from '@ui/hooks/useEntries';
import { SettingsStore } from '@ui/hooks/useSettings';
import { HabitSettings } from './settings/HabitSettings';
import { ReminderSettings } from './settings/ReminderSettings';
import { StepSettings } from './settings/StepSettings';
import { VoiceSettings } from './settings/VoiceSettings';

type Props = { store: EntriesStore; settings: SettingsStore };

export function SettingsScreen({ store, settings }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const { theme, language } = settings.settings;
  const errorText = (e: unknown) =>
    e instanceof ExportError ? m.backupErrors[e.code] : e instanceof Error ? e.message : String(e);

  const doExport = async () => {
    try {
      await exportEntries(store.entries, settings.settings.habits, {
        dialogTitle: m.settings.shareDialog,
        unavailable: m.backupErrors.unavailable,
      });
    } catch (e) {
      Alert.alert(m.settings.exportFailed, errorText(e));
    }
  };

  const doImport = async () => {
    try {
      const incoming = await pickImportFile();
      if (!incoming) return;
      await store.importEntries(incoming.entries);
      await settings.update({ habits: mergeHabits(settings.settings.habits, incoming.habits) });
      Alert.alert(m.settings.importDone, m.settings.importDoneBody(incoming.entries.length));
    } catch (e) {
      Alert.alert(m.settings.importFailed, errorText(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <NameSettings settings={settings} />

      <View style={styles.section}>
        <Text style={styles.title}>{m.settings.language}</Text>
        <View style={styles.languageRow} accessibilityRole="radiogroup">
          {LANGUAGE_SETTINGS.map((option) => {
            const selected = option === language;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => settings.update({ language: option })}
                style={[styles.languageOption, selected && styles.languageOptionSelected]}
              >
                <Text style={[styles.languageText, selected && styles.languageTextSelected]}>
                  {m.settings.languages[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>{m.settings.theme}</Text>
        <View style={styles.themeRow} accessibilityRole="radiogroup">
          {THEMES.map((name) => {
            const selected = name === theme;
            const preview = paletteFor(name, settings.settings.voice);
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={m.settings.themeA11y(m.settings.themes[name])}
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
                  {m.settings.themes[name]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <VoiceSettings settings={settings} />

      <HabitSettings settings={settings} />

      <ReminderSettings settings={settings} />

      <UnlockSettings settings={settings} />

      <StepSettings settings={settings} />

      <View style={styles.section}>
        <Text style={styles.title}>{m.settings.data}</Text>
        <Text style={styles.body}>{m.settings.dataBody(store.entries.length)}</Text>
        <Button title={m.settings.export} onPress={doExport} disabled={store.entries.length === 0} />
        <Button title={m.settings.import} variant="secondary" onPress={doImport} />
        <Text style={styles.hint}>{m.settings.importHint}</Text>
      </View>
    </ScrollView>
  );
}

function NameSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const [draft, setDraft] = useState(settings.settings.name);
  const { m, locale } = useLocale();

  const save = async () => {
    const name = cleanName(draft);
    setDraft(name);
    if (name === settings.settings.name) return;
    await settings.update({ name });
    // Reminders mention the name, so refresh them.
    const { remindersEnabled, reminderTimes } = settings.settings;
    if (remindersEnabled) scheduleReminders(reminderTimes, name, locale).catch(() => {});
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{m.name.settingsTitle}</Text>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        onEndEditing={save}
        onSubmitEditing={save}
        placeholder={m.name.promptTitle}
        placeholderTextColor={c.muted}
        maxLength={NAME_MAX_LENGTH}
        autoCapitalize="words"
        returnKeyType="done"
      />
    </View>
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
  const { m } = useLocale();

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
    Alert.alert(m.unlockSettings.accessTitle, m.unlockSettings.accessBody, [
      { text: m.common.cancel, style: 'cancel' },
      {
        text: m.common.openSettings,
        onPress: () => {
          enablingRef.current = true;
          unlockStats.openUsageAccessSettings();
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.switchRow}>
        <Text style={styles.title}>{m.unlockSettings.title}</Text>
        <Switch
          value={enabled && supported}
          onValueChange={toggle}
          disabled={!supported}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>{supported ? m.unlockSettings.body : m.unlockSettings.unsupported}</Text>
      {supported && enabled && !hasAccess && (
        <>
          <Text style={styles.warning}>{m.unlockSettings.accessOff}</Text>
          <Button
            title={m.unlockSettings.openAccess}
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
    languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    languageOption: {
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    languageOptionSelected: { backgroundColor: c.accent, borderColor: c.accent },
    languageText: { color: c.text },
    languageTextSelected: { color: c.accentText, fontWeight: '600' },
    warning: { color: c.danger },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing(3),
      fontSize: 16,
      color: c.text,
      backgroundColor: c.background,
    },
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
