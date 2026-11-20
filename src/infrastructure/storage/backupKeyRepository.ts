import * as SecureStore from 'expo-secure-store';

import { KdfParams } from '@domain/checkins/encryptedFormat';

import { BackupKey, fromBase64, toBase64 } from '@infrastructure/backup/encryption';

/**
 * The key backups are encrypted with, kept in Android's Keystore-backed secure storage so
 * automatic backups can encrypt without asking. The passphrase itself is never stored.
 * Encryption is on exactly when a key is saved here.
 */
const KEY = 'backupKey';

/** The saved key, or null when encryption is off. Throws when it can't be read, so a backup fails instead of going out unencrypted. */
export async function loadBackupKey(): Promise<BackupKey | null> {
  const stored = await SecureStore.getItemAsync(KEY);
  if (!stored) return null;
  const { kdf, key } = JSON.parse(stored) as { kdf: KdfParams; key: string };
  return { kdf, key: fromBase64(key) };
}

export const saveBackupKey = ({ kdf, key }: BackupKey) =>
  SecureStore.setItemAsync(KEY, JSON.stringify({ kdf, key: toBase64(key) }));

export const deleteBackupKey = () => SecureStore.deleteItemAsync(KEY);
