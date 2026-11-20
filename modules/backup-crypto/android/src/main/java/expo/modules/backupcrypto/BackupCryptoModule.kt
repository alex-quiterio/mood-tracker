package expo.modules.backupcrypto

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

/**
 * PBKDF2-HMAC-SHA512 and AES-256-GCM for encrypted backups, done natively because Hermes has no
 * JIT and the same work in JavaScript takes minutes. Bytes cross the bridge as base64. The
 * results match the JavaScript fallback (`@noble`) byte for byte, so files open either way.
 */
class BackupCryptoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BackupCrypto")

    AsyncFunction("pbkdf2Sha512Async") { password: String, salt: String, iterations: Int, length: Int ->
      encode(pbkdf2Sha512(decode(password), decode(salt), iterations, length))
    }

    AsyncFunction("aesGcmEncryptAsync") { key: String, nonce: String, plaintext: String ->
      encode(aesGcm(Cipher.ENCRYPT_MODE, decode(key), decode(nonce), decode(plaintext)))
    }

    // Throws (AEADBadTagException) when the key is wrong or the data was changed.
    AsyncFunction("aesGcmDecryptAsync") { key: String, nonce: String, data: String ->
      encode(aesGcm(Cipher.DECRYPT_MODE, decode(key), decode(nonce), decode(data)))
    }
  }

  private fun decode(base64: String): ByteArray = Base64.decode(base64, Base64.NO_WRAP)

  private fun encode(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.NO_WRAP)

  /** RFC 8018 PBKDF2 over raw password bytes (the JS side sends UTF-8), with HMAC-SHA512. */
  private fun pbkdf2Sha512(password: ByteArray, salt: ByteArray, iterations: Int, length: Int): ByteArray {
    val mac = Mac.getInstance("HmacSHA512")
    mac.init(SecretKeySpec(password, "HmacSHA512"))
    val hashLength = mac.macLength
    val blocks = (length + hashLength - 1) / hashLength
    val out = ByteArray(blocks * hashLength)
    for (block in 1..blocks) {
      mac.update(salt)
      mac.update(
        byteArrayOf(
          (block ushr 24).toByte(),
          (block ushr 16).toByte(),
          (block ushr 8).toByte(),
          block.toByte(),
        ),
      )
      var u = mac.doFinal()
      val t = u.copyOf()
      for (i in 2..iterations) {
        u = mac.doFinal(u)
        for (k in t.indices) t[k] = (t[k].toInt() xor u[k].toInt()).toByte()
      }
      System.arraycopy(t, 0, out, (block - 1) * hashLength, hashLength)
    }
    return out.copyOf(length)
  }

  /** AES-GCM with a 128-bit tag appended to the ciphertext, as the JS side expects. */
  private fun aesGcm(mode: Int, key: ByteArray, nonce: ByteArray, input: ByteArray): ByteArray {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(mode, SecretKeySpec(key, "AES"), GCMParameterSpec(128, nonce))
    return cipher.doFinal(input)
  }
}
