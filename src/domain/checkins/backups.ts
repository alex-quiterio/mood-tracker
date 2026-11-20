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

/** How many daily backup files the folder keeps; 0 keeps them all. */
export const BACKUP_KEEP_OPTIONS = [7, 30, 90, 0] as const;
export type BackupKeep = (typeof BACKUP_KEEP_OPTIONS)[number];

const BACKUP_FILE = /^mood-tracker-(\d{4}-\d{2}-\d{2})\.json$/;

/**
 * The backup files to delete so only the newest `keep` remain (0 keeps all). Only files named
 * like our backups are touched, so anything else the user keeps in the folder is left alone.
 */
export function backupsToPrune(fileNames: string[], keep: number): string[] {
  if (keep <= 0) return [];
  return fileNames
    .filter((name) => BACKUP_FILE.test(name))
    .sort()
    .reverse()
    .slice(keep);
}
