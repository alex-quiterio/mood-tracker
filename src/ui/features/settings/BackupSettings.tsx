import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@ui/kit/Text';

import { BACKUP_KEEP_OPTIONS, backupFileName, isBackupDue } from '@domain/checkins/backups';
import { parseEncryptedFile } from '@domain/checkins/encryptedFormat';
import { ExportError, parseExport } from '@domain/checkins/exportFormat';
import { mergeHabits } from '@domain/habits/habits';
import { localDate } from '@domain/shared/dates';
import {
  exportEntries,
  folderLabel,
  newBackupKey,
  pickBackupFolder,
  pickImportFile,
  writeBackup,
} from '@infrastructure/backup/backupFiles';
import { BackupKey, decryptBackup, unlockBackup } from '@infrastructure/backup/encryption';
import { deleteBackupKey, loadBackupKey, saveBackupKey } from '@infrastructure/storage/backupKeyRepository';
import { Button } from '@ui/kit/Button';
import { Card } from '@ui/kit/Card';
import { Chip } from '@ui/kit/Chip';
import { EntriesStore } from '@ui/state/useEntries';
import { SettingsStore } from '@ui/state/useSettings';
import { longDate } from '@ui/foundation/i18n/format';
import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/foundation/theme/theme';

import { backupContents } from './backupContents';
import { usePassphrasePrompt } from './PassphrasePrompt';

type Props = { store: EntriesStore; settings: SettingsStore };

/** Backups: everything lives on this phone, so keep a copy in a folder, or export now and then. */
export function BackupSettings({ store, settings }: Props) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m, locale } = useLocale();
  const { backupFolder, autoBackup, lastBackup, lastBackupAt, keepBackups, habits, backupSettings } =
    settings.settings;
  const hasEntries = store.entries.length > 0;
  // Backups are encrypted exactly when a key is saved in secure storage.
  const [backupKey, setBackupKey] = useState<BackupKey | null>(null);
  useEffect(() => {
    loadBackupKey()
      .then(setBackupKey)
      .catch(() => {});
  }, []);
  const passphrase = usePassphrasePrompt();
  const errorText = (e: unknown) =>
    e instanceof ExportError ? m.backupErrors[e.code] : e instanceof Error ? e.message : String(e);

  /** Writes today's backup to `folder`. True when it worked. */
  const backUp = async (folder: string, confirm: boolean) => {
    const now = new Date();
    const today = localDate(now);
    try {
      await writeBackup(
        folder,
        backupContents(store, settings.settings),
        today,
        settings.settings.keepBackups,
        backupKey,
      );
      await settings.update({ lastBackup: today, lastBackupAt: now.getTime() });
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
    if (on && hasEntries && isBackupDue(lastBackupAt, Date.now())) await backUp(backupFolder, false);
  };

  const doExport = async () => {
    try {
      await exportEntries(
        backupContents(store, settings.settings),
        {
          dialogTitle: m.settings.shareDialog,
          unavailable: m.backupErrors.unavailable,
        },
        backupKey,
      );
    } catch (e) {
      Alert.alert(m.settings.exportFailed, errorText(e));
    }
  };

  /** The export inside a picked file: as is, opened with the saved key, or after asking for its passphrase. Null when cancelled. */
  const openBackup = async (text: string): Promise<string | null> => {
    const file = parseEncryptedFile(text);
    if (!file) return text;
    if (backupKey) {
      try {
        return await decryptBackup(file, backupKey);
      } catch {
        // Made with another passphrase (an older one, or another phone): ask for it.
      }
    }
    let plain: string | null = null;
    const ok = await passphrase.ask('enter', async (entered) => {
      try {
        plain = await unlockBackup(file, entered);
        return null;
      } catch {
        return m.backupErrors.wrongPassphrase;
      }
    });
    return ok ? plain : null;
  };

  const toggleEncryption = async (on: boolean) => {
    if (on) {
      await passphrase.ask('set', async (chosen) => {
        const key = await newBackupKey(chosen);
        await saveBackupKey(key);
        setBackupKey(key);
        return null;
      });
      return;
    }
    Alert.alert(m.backupSettings.encryptOffTitle, m.backupSettings.encryptOffBody, [
      { text: m.common.cancel, style: 'cancel' },
      {
        text: m.backupSettings.encryptOff,
        onPress: async () => {
          await deleteBackupKey();
          setBackupKey(null);
        },
      },
    ]);
  };

  const doImport = async () => {
    try {
      const text = await pickImportFile();
      if (!text) return;
      const plain = await openBackup(text);
      if (plain === null) return;
      const incoming = parseExport(plain);
      await store.importEntries(incoming.entries);
      await store.importUrges(incoming.urges);
      await store.importPayments(incoming.payments);
      await store.addCapturedDays(incoming.dailyUnlocks);
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
          <Text style={styles.label}>{m.backupSettings.keep}</Text>
          <View style={styles.chips}>
            {BACKUP_KEEP_OPTIONS.map((n) => (
              <Chip
                key={n}
                label={n ? m.backupSettings.keepDays(n) : m.backupSettings.keepAll}
                selected={keepBackups === n}
                onPress={() => settings.update({ keepBackups: n })}
              />
            ))}
          </View>
          <Text style={styles.body}>{m.backupSettings.keepBody}</Text>
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

      <View style={styles.switchRow}>
        <Text style={styles.label}>{m.backupSettings.encrypt}</Text>
        <Switch
          value={!!backupKey}
          onValueChange={toggleEncryption}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>
        {backupKey ? m.backupSettings.encryptOnBody : m.backupSettings.encryptBody}
      </Text>
      {passphrase.modal}

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
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1) },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    divider: { height: 1, backgroundColor: c.border, marginVertical: spacing(1) },
  });
