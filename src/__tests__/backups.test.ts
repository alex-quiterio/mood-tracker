import { describe, expect, it } from '@jest/globals';

import { BACKUP_INTERVAL_DAYS, backupFileName, isBackupDue } from '@domain/checkins/backups';
import { DEFAULT_SETTINGS, parseSettings } from '@domain/settings/settings';

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
