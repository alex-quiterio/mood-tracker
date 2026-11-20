import { createCipheriv, pbkdf2Sync } from 'node:crypto';

import { describe, expect, it } from '@jest/globals';

import { ENCRYPTED_FORMAT, parseEncryptedFile } from '@domain/checkins/encryptedFormat';
import { ExportError, parseExport, serializeExport } from '@domain/checkins/exportFormat';
import {
  KDF_ITERATIONS,
  decryptBackup,
  deriveKey,
  encryptBackup,
  fromBase64,
  jsEngine,
  newKdf,
  toBase64,
  unlockBackup,
  utf8Decode,
  utf8Encode,
} from '@infrastructure/backup/encryption';

// Fewer iterations keep the tests quick; the file records how many were used.
const fastKdf = { ...newKdf(new Uint8Array(16).fill(7)), iterations: 1000 };
const nonce = new Uint8Array(12).fill(3);
const contents = {
  entries: [
    {
      date: '2026-11-20',
      slot: 'evening' as const,
      mood: 4 as const,
      note: 'Café com a Inês 🌙',
      recordedAt: '2026-11-20T20:00:00.000Z',
    },
  ],
  habits: [],
};

describe('encrypted backups', () => {
  it('round-trips an export through the passphrase', async () => {
    const key = await deriveKey('correct horse battery', fastKdf);
    const text = await encryptBackup(serializeExport(contents), key, nonce);
    expect(text).not.toContain('Inês');
    const file = parseEncryptedFile(text)!;
    expect(file.format).toBe(ENCRYPTED_FORMAT);
    expect(file.kdf).toEqual(fastKdf);
    expect(parseExport(await unlockBackup(file, 'correct horse battery')).entries).toEqual(contents.entries);
    expect(parseExport(await decryptBackup(file, key)).entries[0].note).toBe('Café com a Inês 🌙');
  });

  it('refuses the wrong passphrase and a tampered file', async () => {
    const key = await deriveKey('correct horse battery', fastKdf);
    const file = parseEncryptedFile(await encryptBackup(serializeExport(contents), key, nonce))!;
    await expect(unlockBackup(file, 'wrong horse battery')).rejects.toEqual(
      new ExportError('wrongPassphrase'),
    );
    const bytes = fromBase64(file.data);
    bytes[0] ^= 1;
    await expect(decryptBackup({ ...file, data: toBase64(bytes) }, key)).rejects.toEqual(
      new ExportError('wrongPassphrase'),
    );
  });

  it('leaves plain exports alone and rejects broken or newer encrypted files', () => {
    expect(parseEncryptedFile(serializeExport(contents))).toBeNull();
    expect(parseEncryptedFile('not json')).toBeNull();
    expect(() => parseEncryptedFile(JSON.stringify({ format: ENCRYPTED_FORMAT, version: 2 }))).toThrow(
      new ExportError('newer'),
    );
    expect(() =>
      parseEncryptedFile(JSON.stringify({ format: ENCRYPTED_FORMAT, version: 1, kdf: {} })),
    ).toThrow(new ExportError('invalid'));
  });

  it('derives keys slowly by default', () => {
    expect(newKdf(new Uint8Array(16)).iterations).toBe(KDF_ITERATIONS);
    expect(KDF_ITERATIONS).toBeGreaterThanOrEqual(210_000);
  });

  it('encodes UTF-8 and base64 by hand like the platform would', () => {
    const text = 'ação · 🌙 · 日本';
    expect(Array.from(utf8Encode(text))).toEqual(Array.from(Buffer.from(text, 'utf8')));
    expect(utf8Decode(utf8Encode(text))).toBe(text);
    const big = new Uint8Array(100_000).map((_, i) => i % 256);
    expect(toBase64(big)).toBe(Buffer.from(big).toString('base64'));
    expect(fromBase64(toBase64(big))).toEqual(big);
  });

  // The Kotlin module uses the platform's HMAC-SHA512 and AES/GCM/NoPadding. Node's are the same
  // standard algorithms, so matching them byte for byte means files open on either side.
  it('matches standard PBKDF2-SHA512 and AES-256-GCM byte for byte', async () => {
    const password = utf8Encode('pässwörd 🌙');
    const salt = fromBase64(fastKdf.salt);
    const key = await jsEngine.pbkdf2Sha512(password, salt, 1000, 32);
    expect(Buffer.from(key)).toEqual(
      pbkdf2Sync(Buffer.from(password), Buffer.from(salt), 1000, 32, 'sha512'),
    );

    const plain = utf8Encode(serializeExport(contents));
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    const expected = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
    expect(Buffer.from(await jsEngine.aesGcmEncrypt(key, nonce, plain))).toEqual(expected);
    expect(await jsEngine.aesGcmDecrypt(key, nonce, new Uint8Array(expected))).toEqual(plain);
  });
});
