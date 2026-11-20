import { ExportError } from './exportFormat';

/**
 * An encrypted backup: an ordinary export file (see `exportFormat.ts`), encrypted with a key
 * derived from the user's passphrase. Versioned like the export format: keep old versions readable.
 */
export const ENCRYPTED_FORMAT = 'mood-tracker-encrypted';
const VERSION = 1;

/** How the key comes from the passphrase. Stored in the file, so it can be strengthened later. */
export type KdfParams = { name: 'pbkdf2-sha512'; iterations: number; salt: string };

export type EncryptedFile = {
  format: typeof ENCRYPTED_FORMAT;
  version: number;
  kdf: KdfParams;
  cipher: { name: 'aes-256-gcm'; nonce: string };
  /** Base64 of the ciphertext with its authentication tag. */
  data: string;
};

/** Whether two key derivations give the same key for the same passphrase. */
export const sameKdf = (a: KdfParams, b: KdfParams) =>
  a.name === b.name && a.iterations === b.iterations && a.salt === b.salt;

export function serializeEncryptedFile(kdf: KdfParams, nonce: string, data: string): string {
  const file: EncryptedFile = {
    format: ENCRYPTED_FORMAT,
    version: VERSION,
    kdf,
    cipher: { name: 'aes-256-gcm', nonce },
    data,
  };
  return JSON.stringify(file);
}

/**
 * The encrypted file in `text`, or null when it's something else (such as a plain export).
 * Throws `newer` for an encrypted file from a later version, and `invalid` for a broken one.
 */
export function parseEncryptedFile(text: string): EncryptedFile | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const file = data as Partial<EncryptedFile> | null;
  if (!file || file.format !== ENCRYPTED_FORMAT) return null;
  if (typeof file.version !== 'number' || file.version > VERSION) throw new ExportError('newer');
  const { kdf, cipher } = file;
  const valid =
    kdf?.name === 'pbkdf2-sha512' &&
    Number.isInteger(kdf.iterations) &&
    kdf.iterations > 0 &&
    typeof kdf.salt === 'string' &&
    cipher?.name === 'aes-256-gcm' &&
    typeof cipher.nonce === 'string' &&
    typeof file.data === 'string';
  if (!valid) throw new ExportError('invalid');
  return file as EncryptedFile;
}
