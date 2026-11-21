import { getRandomBytes } from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { localDate } from '@domain/shared/dates';
import { backupFileName, backupsToPrune } from '@domain/checkins/backups';
import { BackupContents, serializeExport } from '@domain/checkins/exportFormat';

import { BackupKey, NONCE_BYTES, SALT_BYTES, deriveKey, encryptBackup, newKdf } from './encryption';

/** A backup file's text: the export as is, or encrypted when there's a key. */
const backupText = async (contents: BackupContents, key: BackupKey | null) =>
  key
    ? encryptBackup(serializeExport(contents), key, getRandomBytes(NONCE_BYTES))
    : serializeExport(contents);

/** A new backup key for `passphrase`, with a fresh random salt. Takes a moment: it's meant to be slow. */
export const newBackupKey = (passphrase: string) => deriveKey(passphrase, newKdf(getRandomBytes(SALT_BYTES)));

/** Writes a backup (entries, habit definitions, urges, payments, portable settings) to a JSON file and opens the share sheet to save it elsewhere. */
export async function exportEntries(
  contents: BackupContents,
  text: { dialogTitle: string; unavailable: string },
  key: BackupKey | null = null,
): Promise<void> {
  const file = new File(Paths.cache, backupFileName(localDate()));
  if (file.exists) file.delete();
  file.create();
  await file.write(await backupText(contents, key));

  if (!(await Sharing.isAvailableAsync())) throw new Error(text.unavailable);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: text.dialogTitle,
  });
}

/** Lets the user pick an export file and returns its text (maybe encrypted). Null when they cancel. */
export async function pickImportFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).text();
}

/** Lets the user pick a folder for backups; Android keeps the permission across restarts. Null when they cancel. */
export async function pickBackupFolder(): Promise<string | null> {
  try {
    return (await Directory.pickDirectoryAsync()).uri;
  } catch (e) {
    if (String((e as { code?: unknown })?.code ?? '').includes('CANCEL')) return null;
    throw e;
  }
}

/** Writes today's backup into the chosen folder. A second backup on the same day replaces the first. */
export async function writeBackup(
  folderUri: string,
  contents: BackupContents,
  date: string = localDate(),
  keep = 0,
  key: BackupKey | null = null,
): Promise<void> {
  const text = await backupText(contents, key);
  const folder = new Directory(folderUri);
  const name = backupFileName(date);
  // Delete rather than overwrite: SAF's "w" mode doesn't always truncate, which could leave a broken file.
  folder
    .list()
    .find((item) => item instanceof File && item.name === name)
    ?.delete();
  await folder.createFile(name, 'application/json').write(text);
  pruneBackups(folder, keep);
}

/** Deletes the oldest backup files beyond `keep`. Quiet on failure: the new backup is already saved. */
function pruneBackups(folder: Directory, keep: number): void {
  if (keep <= 0) return;
  try {
    const files = folder.list().filter((item): item is File => item instanceof File);
    const stale = new Set(
      backupsToPrune(
        files.map((f) => f.name),
        keep,
      ),
    );
    for (const file of files) if (stale.has(file.name)) file.delete();
  } catch {
    // Left for the next backup to try again.
  }
}

/** A readable name for a picked folder, e.g. "Documents/Mood" from a content://…/tree/primary%3ADocuments%2FMood URI. */
export function folderLabel(uri: string): string {
  const tree = uri.split('/tree/')[1]?.split('/')[0];
  if (!tree) return uri;
  const path = decodeURIComponent(tree);
  return path.replace(/^primary:/, '') || path;
}
