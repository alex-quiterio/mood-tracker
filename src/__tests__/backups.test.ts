import { describe, expect, it } from '@jest/globals';

import { BACKUP_INTERVAL_DAYS, backupFileName, isBackupDue } from '@domain/checkins/backups';
import { parseExport, serializeExport } from '@domain/checkins/exportFormat';
import {
  DEFAULT_SETTINGS,
  parsePortableSettings,
  parseSettings,
  settingsForBackup,
} from '@domain/settings/settings';

describe('isBackupDue', () => {
  it('is due when there has never been a backup', () => {
    expect(isBackupDue(null, '2026-10-02')).toBe(true);
  });

  it('waits a full week', () => {
    expect(BACKUP_INTERVAL_DAYS).toBe(7);
    expect(isBackupDue('2026-10-02', '2026-10-02')).toBe(false);
    expect(isBackupDue('2026-09-26', '2026-10-02')).toBe(false);
    expect(isBackupDue('2026-09-25', '2026-10-02')).toBe(true);
    expect(isBackupDue('2026-08-01', '2026-10-02')).toBe(true);
  });

  it('counts across month and year ends', () => {
    expect(isBackupDue('2026-12-28', '2027-01-03')).toBe(false);
    expect(isBackupDue('2026-12-28', '2027-01-04')).toBe(true);
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
    expect(DEFAULT_SETTINGS.autoBackup).toBe(false);
  });

  it('keep valid values and drop invalid ones', () => {
    const folder = 'content://com.android.externalstorage.documents/tree/primary%3ADocuments';
    expect(parseSettings({ backupFolder: folder, autoBackup: true, lastBackup: '2026-09-30' })).toMatchObject(
      {
        backupFolder: folder,
        autoBackup: true,
        lastBackup: '2026-09-30',
      },
    );
    expect(parseSettings({ backupFolder: 3, autoBackup: 'yes', lastBackup: '2026-02-30' })).toMatchObject({
      backupFolder: '',
      autoBackup: false,
      lastBackup: '',
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
    for (const key of ['appLock', 'remindersEnabled', 'backupFolder', 'autoBackup', 'habits', 'trackSteps']) {
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
