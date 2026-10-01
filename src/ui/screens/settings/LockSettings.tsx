import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { canUseDeviceLock, confirmWithDeviceLock } from '@infrastructure/security/deviceLock';
import { Card } from '@ui/components/Card';
import { SettingsStore } from '@ui/hooks/useSettings';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, useColors, useThemedStyles } from '@ui/theme/theme';

/** Turning the app lock on or off; both need the phone's fingerprint, face or PIN. */
export function LockSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m } = useLocale();
  const [busy, setBusy] = useState(false);

  const toggle = async (on: boolean) => {
    setBusy(true);
    try {
      if (on && !(await canUseDeviceLock())) {
        Alert.alert(m.lock.title, m.lock.unavailable);
        return;
      }
      // Confirm it's you either way, so nobody else can switch the lock off.
      if (await confirmWithDeviceLock({ prompt: m.lock.confirmTitle, cancel: m.common.cancel })) {
        await settings.update({ appLock: on });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.switchRow}>
        <Text style={styles.title}>{m.lock.title}</Text>
        <Switch
          value={settings.settings.appLock}
          onValueChange={toggle}
          disabled={busy}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>{m.lock.body}</Text>
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
  });
