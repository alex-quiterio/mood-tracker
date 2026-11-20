import { requireOptionalNativeModule } from 'expo';

type BackupCryptoNative = {
  pbkdf2Sha512Async(password: string, salt: string, iterations: number, length: number): Promise<string>;
  aesGcmEncryptAsync(key: string, nonce: string, plaintext: string): Promise<string>;
  aesGcmDecryptAsync(key: string, nonce: string, data: string): Promise<string>;
};

/**
 * Native PBKDF2 and AES-GCM for encrypted backups, all in base64. Null when the module is
 * missing (Expo Go, iOS, web, tests): callers fall back to the same maths in JavaScript.
 */
export const backupCrypto = requireOptionalNativeModule<BackupCryptoNative>('BackupCrypto');
