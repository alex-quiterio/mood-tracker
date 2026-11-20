/** Automatic backups run when the app opens and the last one is at least this old. */
export const BACKUP_INTERVAL_HOURS = 12;

const INTERVAL_MS = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;

/**
 * Whether an automatic backup is due: never backed up (0), or the last one is 12 hours old or more.
 * A clock that went backwards (last backup in the future) counts as due, so backups never stall.
 */
export const isBackupDue = (lastBackupAt: number, now: number): boolean =>
  !lastBackupAt || now - lastBackupAt >= INTERVAL_MS || now < lastBackupAt;

/** One file per day, so backups sort by date and a later one the same day replaces the earlier. */
export const backupFileName = (date: string) => `mood-tracker-${date}.json`;
