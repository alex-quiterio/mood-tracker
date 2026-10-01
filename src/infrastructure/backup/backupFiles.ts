import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { localDate } from '../../domain/shared/dates';
import { parseExport, serializeExport } from '../../domain/checkins/exportFormat';
import { Entry } from '../../domain/checkins/types';

/** Writes all entries to a JSON file and opens the share sheet so it can be saved elsewhere. */
export async function exportEntries(entries: Entry[]): Promise<void> {
  const file = new File(Paths.cache, `mood-tracker-${localDate()}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(serializeExport(entries));

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your mood data',
  });
}

/** Lets the user pick an export file. Returns null when they cancel. */
export async function pickImportFile(): Promise<Entry[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  return parseExport(await new File(result.assets[0].uri).text());
}
