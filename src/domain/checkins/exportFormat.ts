import { Habit, parseHabits } from '@domain/habits/habits';
import { Urge, parseUrges } from '@domain/habits/urges';
import { PortableSettings, parsePortableSettings } from '@domain/settings/settings';
import { Payment, parsePayments } from '@domain/spending/payments';

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
// v3 adds urges.
// v4 adds the portable settings.
// v5 adds payments imported from bank statements. Older versions still import.
const VERSION = 5;

type ExportFile = {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  entries: Entry[];
  habits?: Habit[];
  urges?: Urge[];
  settings?: Partial<PortableSettings>;
  payments?: Payment[];
};

export type ImportedData = {
  entries: Entry[];
  habits: Habit[];
  urges: Urge[];
  payments: Payment[];
  /** Present when the file carries settings (version 4, and not left out of the backup). */
  settings?: Partial<PortableSettings>;
};

/** What goes into a backup. Settings are left out when the user chose to. */
export type BackupContents = {
  entries: Entry[];
  habits: Habit[];
  urges?: Urge[];
  payments?: Payment[];
  settings?: Partial<PortableSettings>;
};

export function serializeExport(
  { entries, habits, urges = [], payments = [], settings }: BackupContents,
  now: Date = new Date(),
): string {
  const file: ExportFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: now.toISOString(),
    entries,
    habits,
    urges,
    payments,
    ...(settings ? { settings } : {}),
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
  // v1 files have no habit definitions, files before v3 no urges, and before v5 no payments.
  const settings = parsePortableSettings(file.settings);
  return {
    entries: entries as Entry[],
    habits: Array.isArray(file.habits) ? parseHabits(file.habits) : [],
    urges: parseUrges(file.urges),
    payments: parsePayments(file.payments),
    ...(settings ? { settings } : {}),
  };
}
