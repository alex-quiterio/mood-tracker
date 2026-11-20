import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { isBackupDue } from '@domain/checkins/backups';
import { localDate } from '@domain/shared/dates';
import { writeBackup } from '@infrastructure/backup/backupFiles';
import { loadBackupKey } from '@infrastructure/storage/backupKeyRepository';

import { EntriesStore } from '@ui/state/useEntries';

import { backupContents } from './backupContents';
import { SettingsStore } from '@ui/state/useSettings';

/** After a failed attempt, wait this long before trying again (the folder may be gone). */
const RETRY_MS = 60 * 60 * 1000;

/**
 * Saves a backup to the chosen folder when the app opens or returns to the foreground and the
 * last one is 12 hours old. Failures stay quiet: a later open tries again, and Settings shows the last date.
 */
export function useAutoBackup(store: EntriesStore, settings: SettingsStore) {
  const lastTry = useRef(0);
  // The latest store and settings, so the foreground listener never reads stale ones.
  const latest = useRef({ store, settings });
  useEffect(() => {
    latest.current = { store, settings };
  });
  const { loaded, entries } = store;
  const { autoBackup, backupFolder, lastBackupAt } = settings.settings;

  useEffect(() => {
    if (!loaded || !autoBackup || !backupFolder || entries.length === 0) return;
    const run = async () => {
      const now = Date.now();
      const { store: s, settings: st } = latest.current;
      if (!isBackupDue(st.settings.lastBackupAt, now) || now - lastTry.current < RETRY_MS) return;
      lastTry.current = now;
      const today = localDate(new Date(now));
      try {
        // Encrypted when a key is saved; with none, the backup is a plain file as before.
        const key = await loadBackupKey();
        await writeBackup(backupFolder, backupContents(s, st.settings), today, st.settings.keepBackups, key);
        st.update({ lastBackup: today, lastBackupAt: now }).catch(() => {});
      } catch {
        // The folder may be gone or its permission revoked; Settings shows the last good backup.
      }
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [loaded, autoBackup, backupFolder, lastBackupAt, entries.length]);
}
