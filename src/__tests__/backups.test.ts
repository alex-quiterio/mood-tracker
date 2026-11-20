import { describe, expect, it } from '@jest/globals';

import { BACKUP_INTERVAL_HOURS, backupFileName, isBackupDue } from '@domain/checkins/backups';
import { parseExport, serializeExport } from '@domain/checkins/exportFormat';
import {
  DEFAULT_SETTINGS,
  parsePortableSettings,
  parseSettings,
  settingsForBackup,
} from '@domain/settings/settings';

describe('isBackupDue', () => {
  const at = (iso: string) => new Date(iso).getTime();

  it('is due when there has never been a backup', () => {
    expect(isBackupDue(0, at('2026-10-02T09:00:00Z'))).toBe(true);
  });

  it('waits 12 hours', () => {
    expect(BACKUP_INTERVAL_HOURS).toBe(12);
    const last = at('2026-10-02T09:00:00Z');
    expect(isBackupDue(last, last)).toBe(false);
    expect(isBackupDue(last, at('2026-10-02T20:59:59Z'))).toBe(false);
    expect(isBackupDue(last, at('2026-10-02T21:00:00Z'))).toBe(true);
    expect(isBackupDue(last, at('2026-10-09T09:00:00Z'))).toBe(true);
  });

  it('is due when the clock went backwards', () => {
    expect(isBackupDue(at('2026-10-02T09:00:00Z'), at('2026-10-01T09:00:00Z'))).toBe(true);
  });
});

describe('backupFileName', () => {
  it('names one file per local date', () => {
    expect(backupFileName('2026-10-02')).toBe('mood-tracker-2026-10-02.json');
  });
});

describe('backup settings', () => {
  it('default to no folder, off and never backed up', () => {
    const s = parseSettings({});
    expect(s.backupFolder).toBe('');
    expect(s.autoBackup).toBe(false);
    expect(s.lastBackup).toBe('');
    expect(s.lastBackupAt).toBe(0);
    expect(DEFAULT_SETTINGS.autoBackup).toBe(false);
  });

  it('keep valid values and drop invalid ones', () => {
    const folder = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments';
    expect(
      parseSettings({
        backupFolder: folder,
        autoBackup: true,
        lastBackup: '2026-09-30',
        lastBackupAt: 1_790_000_000_000,
      }),
    ).toMatchObject({
      backupFolder: folder,
      autoBackup: true,
      lastBackup: '2026-09-30',
      lastBackupAt: 1_790_000_000_000,
    });
    expect(
      parseSettings({ backupFolder: 3, autoBackup: 'yes', lastBackup: '2026-02-30', lastBackupAt: 'x' }),
    ).toMatchObject({
      backupFolder: '',
      autoBackup: false,
      lastBackup: '',
      lastBackupAt: 0,
    });
  });
});

describe('settings in backups', () => {
  const custom = parseSettings({
    name: 'Ana',
    theme: 'dark',
    language: 'pt-PT',
    appLock: true,
    remindersEnabled: true,
    backupFolder: 'content://folder',
  });

  it('is on by default and carries only the portable settings', () => {
    expect(DEFAULT_SETTINGS.backupSettings).toBe(true);
    expect(parseSettings({ backupSettings: false }).backupSettings).toBe(false);
    const portable = settingsForBackup(custom);
    expect(portable).toMatchObject({ name: 'Ana', theme: 'dark', language: 'pt-PT' });
    for (const key of [
      'appLock',
      'remindersEnabled',
      'backupFolder',
      'autoBackup',
      'lastBackupAt',
      'habits',
      'trackSteps',
    ]) {
      expect(portable).not.toHaveProperty(key);
    }
  });

  it('leaves them out when turned off', () => {
    expect(settingsForBackup({ ...custom, backupSettings: false })).toBeUndefined();
    expect(parseExport(serializeExport({ entries: [], habits: [], urges: [] })).settings).toBeUndefined();
  });

  it('round-trips through an export, and older files simply have none', () => {
    const file = serializeExport({ entries: [], habits: [], urges: [], settings: settingsForBackup(custom) });
    expect(parseExport(file).settings).toMatchObject({ name: 'Ana', theme: 'dark', language: 'pt-PT' });
    const v3 = JSON.stringify({ format: 'mood-tracker-export', version: 3, exportedAt: 'x', entries: [] });
    expect(parseExport(v3).settings).toBeUndefined();
  });

  it('keeps only the settings the file has, and ignores a device-bound one', () => {
    expect(parsePortableSettings({ theme: 'dim', appLock: true, language: 'klingon' })).toEqual({
      theme: 'dim',
      language: 'system',
    });
    expect(parsePortableSettings('x')).toBeUndefined();
  });
});
