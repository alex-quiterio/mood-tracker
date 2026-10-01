import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { NAME_MAX_LENGTH, cleanName } from '@domain/settings/settings';
import { scheduleReminders } from '@infrastructure/notifications/reminders';
import { reminderMessages } from '@ui/i18n/reminders';
import { Card } from '@ui/components/Card';
import { SettingsStore } from '@ui/hooks/useSettings';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';

/** What the app calls you; saved when you finish typing. */
export function NameSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const [draft, setDraft] = useState(settings.settings.name);

  const save = async () => {
    const name = cleanName(draft);
    setDraft(name);
    if (name === settings.settings.name) return;
    await settings.update({ name });
    // Reminders mention the name, so refresh them.
    const { remindersEnabled, reminderTimes } = settings.settings;
    if (remindersEnabled) scheduleReminders(reminderTimes, reminderMessages(name, locale)).catch(() => {});
  };

  return (
    <Card>
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
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: spacing(3),
      fontSize: 16,
      color: c.text,
      backgroundColor: c.background,
    },
  });
