import Constants from 'expo-constants';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LANGUAGE_SETTINGS } from '@domain/settings/language';
import { Card } from '@ui/components/Card';
import { Chip } from '@ui/components/Chip';
import { EntriesStore } from '@ui/hooks/useEntries';
import { SettingsStore } from '@ui/hooks/useSettings';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, THEMES, paletteFor, spacing, useThemedStyles } from '@ui/theme/theme';

import { BackupSettings } from './settings/BackupSettings';
import { HabitSettings } from './settings/HabitSettings';
import { LockSettings } from './settings/LockSettings';
import { NameSettings } from './settings/NameSettings';
import { ReminderSettings } from './settings/ReminderSettings';
import { StepSettings } from './settings/StepSettings';
import { UnlockSettings } from './settings/UnlockSettings';
import { VoiceSettings } from './settings/VoiceSettings';

type Props = { store: EntriesStore; settings: SettingsStore };

export function SettingsScreen({ store, settings }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <NameSettings settings={settings} />
      <LanguageSettings settings={settings} />
      <ThemeSettings settings={settings} />
      <VoiceSettings settings={settings} />
      <HabitSettings settings={settings} />
      <ReminderSettings settings={settings} />
      <UnlockSettings settings={settings} />
      <StepSettings settings={settings} />
      <LockSettings settings={settings} />
      <BackupSettings store={store} settings={settings} />
      <Text style={styles.version}>
        {m.settings.version(
          Constants.expoConfig?.version ?? '?',
          String(Constants.expoConfig?.android?.versionCode ?? '?'),
        )}
      </Text>
    </ScrollView>
  );
}

function LanguageSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  return (
    <Card>
      <Text style={styles.title}>{m.settings.language}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {LANGUAGE_SETTINGS.map((option) => (
          <Chip
            key={option}
            label={m.settings.languages[option]}
            selected={option === settings.settings.language}
            onPress={() => settings.update({ language: option })}
          />
        ))}
      </View>
    </Card>
  );
}

/** Light, Dim or Dark, previewed in the current voice's tones. */
function ThemeSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();
  const { theme, voice } = settings.settings;
  return (
    <Card>
      <Text style={styles.title}>{m.settings.theme}</Text>
      <View style={styles.themeRow} accessibilityRole="radiogroup">
        {THEMES.map((name) => {
          const selected = name === theme;
          const preview = paletteFor(name, voice);
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
                style={[styles.swatch, { backgroundColor: preview.background, borderColor: preview.border }]}
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
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { padding: spacing(4), gap: spacing(4) },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    version: { color: c.muted, fontSize: 12, textAlign: 'center', marginBottom: spacing(2) },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
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
