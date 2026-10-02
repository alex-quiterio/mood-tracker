import { addDays } from '@domain/shared/dates';

/** Automatic backups run when the app opens and the last one is at least this old. */
export const BACKUP_INTERVAL_DAYS = 7;

/** Whether an automatic backup is due: never backed up, or the last one is a week old or more. */
export const isBackupDue = (lastBackup: string | null, today: string): boolean =>
  !lastBackup || addDays(lastBackup, BACKUP_INTERVAL_DAYS) <= today;

/** One file per day, so backups sort by date and a second one the same day replaces the first. */
export const backupFileName = (date: string) => `mood-tracker-${date}.json`;
