import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { localDate } from '@domain/shared/dates';
import { backupFileName } from '@domain/checkins/backups';
import { BackupContents, ImportedData, parseExport, serializeExport } from '@domain/checkins/exportFormat';

/** Writes a backup (entries, habit definitions, urges, payments, portable settings) to a JSON file and opens the share sheet to save it elsewhere. */
export async function exportEntries(
  contents: BackupContents,
  text: { dialogTitle: string; unavailable: string },
): Promise<void> {
  const file = new File(Paths.cache, backupFileName(localDate()));
  if (file.exists) file.delete();
  file.create();
  file.write(serializeExport(contents));

  if (!(await Sharing.isAvailableAsync())) throw new Error(text.unavailable);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: text.dialogTitle,
  });
}

/** Lets the user pick an export file. Returns null when they cancel. */
export async function pickImportFile(): Promise<ImportedData | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return parseExport(await new File(result.assets[0].uri).text());
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
export function writeBackup(folderUri: string, contents: BackupContents, date: string = localDate()): void {
  const folder = new Directory(folderUri);
  const name = backupFileName(date);
  // Delete rather than overwrite: SAF's "w" mode doesn't always truncate, which could leave a broken file.
  folder
    .list()
    .find((item) => item instanceof File && item.name === name)
    ?.delete();
  folder.createFile(name, 'application/json').write(serializeExport(contents));
}

/** A readable name for a picked folder, e.g. "Documents/Mood" from a content://…/tree/primary%3ADocuments%2FMood URI. */
export function folderLabel(uri: string): string {
  const tree = uri.split('/tree/')[1]?.split('/')[0];
  if (!tree) return uri;
  const path = decodeURIComponent(tree);
  return path.replace(/^primary:/, '') || path;
}
