import { Habit, parseHabits } from '@domain/habits/habits';

import { parseEntry } from './entries';
import { Entry } from './types';

/** The backup file format. Versioned: keep older versions importable. */
const FORMAT = 'mood-tracker-export';
// v2 adds habit definitions, so logged habits keep their names on another phone. v1 still imports.
const VERSION = 2;

type ExportFile = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  entries: Entry[];
  habits?: Habit[];
};

export type ImportedData = { entries: Entry[]; habits: Habit[] };

export function serializeExport(entries: Entry[], habits: Habit[], now: Date = new Date()): string {
  const file: ExportFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: now.toISOString(),
    entries,
    habits,
  };
  return JSON.stringify(file, null, 2);
}

/** Parses an export file. Throws with a readable message when the file isn't one. */
export function parseExport(text: string): ImportedData {
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
  // v1 files have no habit definitions.
  return { entries: entries as Entry[], habits: Array.isArray(file.habits) ? parseHabits(file.habits) : [] };
}
