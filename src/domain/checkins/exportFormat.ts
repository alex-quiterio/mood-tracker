import { Habit, parseHabits } from '@domain/habits/habits';
import { Urge, parseUrges } from '@domain/habits/urges';

import { parseEntry } from './entries';
import { Entry } from './types';

/** Why a file couldn't be imported; the UI shows the matching message. */
export type ExportErrorCode = 'notJson' | 'notExport' | 'newer' | 'invalid';

export class ExportError extends Error {
  constructor(readonly code: ExportErrorCode) {
    super(code);
  }
}

/** The backup file format. Versioned: keep older versions importable. */
const FORMAT = 'mood-tracker-export';
// v2 adds habit definitions, so logged habits keep their names on another phone.
// v3 adds urges. Older versions still import.
const VERSION = 3;

type ExportFile = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  entries: Entry[];
  habits?: Habit[];
  urges?: Urge[];
};

export type ImportedData = { entries: Entry[]; habits: Habit[]; urges: Urge[] };

export function serializeExport(
  entries: Entry[],
  habits: Habit[],
  urges: Urge[] = [],
  now: Date = new Date(),
): string {
  const file: ExportFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: now.toISOString(),
    entries,
    habits,
    urges,
  };
  return JSON.stringify(file, null, 2);
}

/** Parses an export file. Throws an ExportError when the file isn't one. */
export function parseExport(text: string): ImportedData {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ExportError('notJson');
  }
  const file = data as Partial<ExportFile> | null;
  if (!file || file.format !== FORMAT || !Array.isArray(file.entries)) {
    throw new ExportError('notExport');
  }
  if (typeof file.version !== 'number' || file.version > VERSION) {
    throw new ExportError('newer');
  }
  const entries = file.entries.map(parseEntry);
  if (entries.some((e) => e === null)) {
    throw new ExportError('invalid');
  }
  // v1 files have no habit definitions, and files before v3 have no urges.
  return {
    entries: entries as Entry[],
    habits: Array.isArray(file.habits) ? parseHabits(file.habits) : [],
    urges: parseUrges(file.urges),
  };
}
