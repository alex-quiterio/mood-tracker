import * as LocalAuthentication from 'expo-local-authentication';

/**
 * The phone's own lock: fingerprint, face or PIN/pattern. The app never stores a
 * code of its own; it asks Android to confirm it's you.
 */

/** True when the phone has any screen lock set up (a PIN is enough). */
export async function canUseDeviceLock(): Promise<boolean> {
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) >= LocalAuthentication.SecurityLevel.SECRET;
  } catch {
    return false;
  }
}

/** Shows the system prompt. Resolves true only when the user confirmed. */
export async function confirmWithDeviceLock(text: { prompt: string; cancel: string }): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: text.prompt,
      cancelLabel: text.cancel,
      // Let PIN or pattern stand in when biometrics fail or aren't set up.
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
