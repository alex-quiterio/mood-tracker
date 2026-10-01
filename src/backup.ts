import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { localDate } from './dates';
import { parseEntry } from './entries';
import { Entry } from './types';

const FORMAT = 'mood-tracker-export';
const VERSION = 1;

type ExportFile = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  entries: Entry[];
};

export function serializeExport(entries: Entry[], now: Date = new Date()): string {
  const file: ExportFile = { format: FORMAT, version: VERSION, exportedAt: now.toISOString(), entries };
  return JSON.stringify(file, null, 2);
}

/** Parses an export file. Throws with a readable message when the file isn't one. */
export function parseExport(text: string): Entry[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  const file = data as Partial<ExportFile> | null;
  if (!file || file.format !== FORMAT || !Array.isArray(file.entries)) {
    throw new Error('This is not a Mood Tracker export file.');
  }
  if (typeof file.version !== 'number' || file.version > VERSION) {
    throw new Error('This export was made by a newer version of the app.');
  }
  const entries = file.entries.map(parseEntry);
  if (entries.some((e) => e === null)) {
    throw new Error('The file contains invalid entries; nothing was imported.');
  }
  return entries as Entry[];
}

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
