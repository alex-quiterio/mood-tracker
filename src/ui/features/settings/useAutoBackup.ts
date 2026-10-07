import { useEffect, useRef } from 'react';

import { isBackupDue } from '@domain/checkins/backups';
import { settingsForBackup } from '@domain/settings/settings';
import { writeBackup } from '@infrastructure/backup/backupFiles';

import { EntriesStore } from '@ui/state/useEntries';
import { SettingsStore } from '@ui/state/useSettings';

/**
 * Saves a backup to the chosen folder when the app opens (or the day changes) and the last one
 * is a week old. Failures stay quiet: the next open tries again, and Settings shows the last date.
 */
export function useAutoBackup(store: EntriesStore, settings: SettingsStore, today: string) {
  const tried = useRef<string | null>(null);
  const { loaded, entries, urges } = store;
  const { autoBackup, backupFolder, lastBackup, habits } = settings.settings;

  useEffect(() => {
    if (!loaded || !autoBackup || !backupFolder || entries.length === 0) return;
    if (!isBackupDue(lastBackup || null, today) || tried.current === today) return;
    tried.current = today;
    try {
      writeBackup(backupFolder, entries, habits, urges, settingsForBackup(settings.settings), today);
      settings.update({ lastBackup: today }).catch(() => {});
    } catch {
      // The folder may be gone or its permission revoked; Settings shows the last good backup.
    }
    // Runs once per day the app is opened; later edits wait for next week's backup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, autoBackup, backupFolder, lastBackup, today]);
}
