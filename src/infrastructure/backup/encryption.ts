import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha512 } from '@noble/hashes/sha2.js';

import { EncryptedFile, KdfParams, serializeEncryptedFile } from '@domain/checkins/encryptedFormat';
import { ExportError } from '@domain/checkins/exportFormat';
import { backupCrypto } from '@modules/backup-crypto';

/** OWASP's recommendation for PBKDF2-HMAC-SHA512. Paid once when the passphrase is set, and on import. */
export const KDF_ITERATIONS = 210_000;
export const SALT_BYTES = 16;
export const NONCE_BYTES = 12;
export const MIN_PASSPHRASE_LENGTH = 8;
const KEY_BYTES = 32;

/** A key derived from the passphrase, with what's needed to derive it again from a file. */
export type BackupKey = { kdf: KdfParams; key: Uint8Array };

/** The two operations backups need. AES-GCM output is the ciphertext with its 16-byte tag appended. */
export type CryptoEngine = {
  pbkdf2Sha512(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    length: number,
  ): Promise<Uint8Array>;
  aesGcmEncrypt(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array>;
  /** Rejects when the key is wrong or the data was changed. */
  aesGcmDecrypt(key: Uint8Array, nonce: Uint8Array, data: Uint8Array): Promise<Uint8Array>;
};

/** Pure JavaScript: right everywhere, but far too slow on Hermes for the key derivation. */
export const jsEngine: CryptoEngine = {
  pbkdf2Sha512: (password, salt, c, dkLen) => pbkdf2Async(sha512, password, salt, { c, dkLen }),
  aesGcmEncrypt: async (key, nonce, plaintext) => gcm(key, nonce).encrypt(plaintext),
  aesGcmDecrypt: async (key, nonce, data) => gcm(key, nonce).decrypt(data),
};

/** The native module (`modules/backup-crypto`) in a release build; the JS engine without it (Expo Go, tests). */
const defaultEngine: CryptoEngine = backupCrypto
  ? {
      pbkdf2Sha512: async (password, salt, iterations, length) =>
        fromBase64(
          await backupCrypto!.pbkdf2Sha512Async(toBase64(password), toBase64(salt), iterations, length),
        ),
      aesGcmEncrypt: async (key, nonce, plaintext) =>
        fromBase64(
          await backupCrypto!.aesGcmEncryptAsync(toBase64(key), toBase64(nonce), toBase64(plaintext)),
        ),
      aesGcmDecrypt: async (key, nonce, data) =>
        fromBase64(await backupCrypto!.aesGcmDecryptAsync(toBase64(key), toBase64(nonce), toBase64(data))),
    }
  : jsEngine;

/** Derives the AES-256 key for `passphrase` with the given parameters (a new salt, or a file's own). */
export async function deriveKey(
  passphrase: string,
  kdf: KdfParams,
  engine: CryptoEngine = defaultEngine,
): Promise<BackupKey> {
  const key = await engine.pbkdf2Sha512(
    utf8Encode(passphrase),
    fromBase64(kdf.salt),
    kdf.iterations,
    KEY_BYTES,
  );
  return { kdf, key };
}

export const newKdf = (salt: Uint8Array): KdfParams => ({
  name: 'pbkdf2-sha512',
  iterations: KDF_ITERATIONS,
  salt: toBase64(salt),
});

/** Encrypts an export file's text. `nonce` must be fresh random bytes for every call. */
export async function encryptBackup(
  plain: string,
  { kdf, key }: BackupKey,
  nonce: Uint8Array,
  engine: CryptoEngine = defaultEngine,
): Promise<string> {
  const data = await engine.aesGcmEncrypt(key, nonce, utf8Encode(plain));
  return serializeEncryptedFile(kdf, toBase64(nonce), toBase64(data));
}

/** The export file inside `file`. Rejects with `wrongPassphrase` when the key doesn't open it. */
export async function decryptBackup(
  file: EncryptedFile,
  { key }: BackupKey,
  engine: CryptoEngine = defaultEngine,
): Promise<string> {
  try {
    return utf8Decode(await engine.aesGcmDecrypt(key, fromBase64(file.cipher.nonce), fromBase64(file.data)));
  } catch {
    throw new ExportError('wrongPassphrase');
  }
}

/** Derives the key from `passphrase` with the file's own parameters, then decrypts. */
export async function unlockBackup(
  file: EncryptedFile,
  passphrase: string,
  engine: CryptoEngine = defaultEngine,
): Promise<string> {
  return decryptBackup(file, await deriveKey(passphrase, file.kdf, engine), engine);
}

// Base64 and UTF-8 by hand: atob/btoa exist on Hermes, TextDecoder isn't guaranteed.

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function utf8Encode(text: string): Uint8Array {
  const out: number[] = [];
  for (const char of text) {
    const c = char.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}

export function utf8Decode(bytes: Uint8Array): string {
  const chars: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let c: number;
    if (b < 0x80) c = bytes[i++];
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i + 1] & 63);
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63);
    else c = ((b & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63);
    if (b >= 0x80) i += b < 0xe0 ? 2 : b < 0xf0 ? 3 : 4;
    chars.push(String.fromCodePoint(c));
  }
  return chars.join('');
}
