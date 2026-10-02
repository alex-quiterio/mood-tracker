import { useEffect, useEffectEvent } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useLocale } from '@ui/foundation/i18n/LocaleContext';
import { Palette, spacing, useThemedStyles } from '@ui/foundation/theme/theme';

import { Button } from '@ui/kit/Button';

/** Covers the app until you unlock it; the system prompt opens straight away. */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { m } = useLocale();

  // Prompt once when the lock screen appears; the button prompts again.
  const promptOnShow = useEffectEvent(onUnlock);
  useEffect(() => {
    promptOnShow();
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>{m.lock.lockedTitle}</Text>
      <Text style={styles.body}>{m.lock.lockedBody}</Text>
      <View style={styles.action}>
        <Button title={m.lock.unlock} onPress={onUnlock} />
      </View>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(8), gap: spacing(3) },
    icon: { fontSize: 48 },
    title: { fontSize: 22, fontWeight: '700', color: c.text, textAlign: 'center', ...c.heading },
    body: { color: c.muted, textAlign: 'center' },
    action: { alignSelf: 'stretch', marginTop: spacing(4) },
  });
