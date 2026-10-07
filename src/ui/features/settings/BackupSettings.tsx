import { Alert, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { backupFileName, isBackupDue } from '@domain/checkins/backups';
import { ExportError } from '@domain/checkins/exportFormat';
import { mergeHabits } from '@domain/habits/habits';
import { localDate } from '@domain/shared/dates';
import { settingsForBackup } from '@domain/settings/settings';
import {
  exportEntries,
  folderLabel,
  pickBackupFolder,
  pickImportFile,
  writeBackup,
} from '@infrastructure/backup/backupFiles';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { EntriesStore } from '@ui/state/useEntries';
import { SettingsStore } from '@ui/state/useSettings';
import { longDate } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

type Props = { store: EntriesStore; settings: SettingsStore };

/** Backups: everything lives on this phone, so keep a copy in a folder, or export now and then. */
export function BackupSettings({ store, settings }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const { backupFolder, autoBackup, lastBackup, habits, backupSettings } = settings.settings;
  const hasEntries = store.entries.length > 0;
  const errorText = (e: unknown) =>
    e instanceof ExportError ? m.backupErrors[e.code] : e instanceof Error ? e.message : String(e);

  /** Writes today's backup to `folder`. True when it worked. */
  const backUp = async (folder: string, confirm: boolean) => {
    const today = localDate();
    try {
      writeBackup(folder, store.entries, habits, store.urges, settingsForBackup(settings.settings), today);
      await settings.update({ lastBackup: today });
      if (confirm) {
        Alert.alert(
          m.backupSettings.done,
          m.backupSettings.doneBody(backupFileName(today), folderLabel(folder)),
        );
      }
      return true;
    } catch {
      Alert.alert(m.backupSettings.failed, m.backupSettings.failedBody);
      return false;
    }
  };

  const chooseFolder = async () => {
    try {
      const folder = await pickBackupFolder();
      if (!folder) return;
      await settings.update({ backupFolder: folder });
      if (hasEntries) await backUp(folder, true);
    } catch (e) {
      Alert.alert(m.backupSettings.failed, errorText(e));
    }
  };

  const toggleAuto = async (on: boolean) => {
    await settings.update({ autoBackup: on });
    if (on && hasEntries && isBackupDue(lastBackup || null, localDate())) await backUp(backupFolder, false);
  };

  const doExport = async () => {
    try {
      await exportEntries(store.entries, habits, store.urges, settingsForBackup(settings.settings), {
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
      await store.importUrges(incoming.urges);
      await settings.update({ ...incoming.settings, habits: mergeHabits(habits, incoming.habits) });
      const body = m.settings.importDoneBody(incoming.entries.length);
      Alert.alert(
        m.settings.importDone,
        incoming.settings ? `${body} ${m.settings.importSettingsRestored}` : body,
      );
    } catch (e) {
      Alert.alert(m.settings.importFailed, errorText(e));
    }
  };

  return (
    <Card>
      <Text style={styles.title}>{m.settings.data}</Text>
      <Text style={styles.body}>{m.settings.dataBody(store.entries.length)}</Text>

      <Text style={styles.folder}>
        {backupFolder ? m.backupSettings.folder(folderLabel(backupFolder)) : m.backupSettings.noFolder}
      </Text>
      <Button
        title={backupFolder ? m.backupSettings.changeFolder : m.backupSettings.chooseFolder}
        variant={backupFolder ? 'secondary' : undefined}
        onPress={chooseFolder}
      />
      {!backupFolder && <Text style={styles.hint}>{m.backupSettings.folderHint}</Text>}
      {!!backupFolder && (
        <>
          <Button
            title={m.backupSettings.backUpNow}
            onPress={() => backUp(backupFolder, true)}
            disabled={!hasEntries}
          />
          <View style={styles.switchRow}>
            <Text style={styles.label}>{m.backupSettings.auto}</Text>
            <Switch
              value={autoBackup}
              onValueChange={toggleAuto}
              trackColor={{ true: c.accent, false: c.border }}
              thumbColor={c.surface}
            />
          </View>
          <Text style={styles.body}>{m.backupSettings.autoBody}</Text>
          <Text style={styles.body}>
            {lastBackup ? m.backupSettings.last(longDate(lastBackup, locale)) : m.backupSettings.never}
          </Text>
        </>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.label}>{m.backupSettings.includeSettings}</Text>
        <Switch
          value={backupSettings}
          onValueChange={(on) => settings.update({ backupSettings: on })}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>{m.backupSettings.includeSettingsBody}</Text>

      <View style={styles.divider} />
      <Button title={m.settings.export} variant="secondary" onPress={doExport} disabled={!hasEntries} />
      <Button title={m.settings.import} variant="secondary" onPress={doImport} />
      <Text style={styles.hint}>{m.settings.importHint}</Text>
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    folder: { color: c.text, fontWeight: '500' },
    label: { fontSize: 16, color: c.text, flexShrink: 1 },
    hint: { color: c.muted, fontSize: 13, textAlign: 'center' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    divider: { height: 1, backgroundColor: c.border, marginVertical: spacing(1) },
  });
