import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Switch, Text, View } from 'react-native';

import { saveUnlockCheckpoint } from '@infrastructure/storage/checkpoints';
import { unlockStats } from '@modules/unlock-stats';
import { Button } from '@ui/components/Button';
import { Card } from '@ui/components/Card';
import { SettingsStore } from '@ui/hooks/useSettings';
import { useLocale } from '@ui/i18n/LocaleContext';
import { Palette, useColors, useThemedStyles } from '@ui/theme/theme';

/** Counting phone unlocks, which needs Android's special "Usage access" permission. */
export function UnlockSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const { m } = useLocale();
  const supported = unlockStats.isSupported();
  const [hasAccess, setHasAccess] = useState(() => unlockStats.hasUsageAccess());
  // Set while the user is in Android settings granting access, so we can finish turning tracking on.
  const enablingRef = useRef(false);
  const enabled = settings.settings.trackUnlocks;

  const enable = async () => {
    // Count from now, not from whenever tracking was last on.
    await saveUnlockCheckpoint(new Date());
    await settings.update({ trackUnlocks: true });
  };

  // Back from Android settings: refresh access, and finish turning tracking on if it was granted.
  const onActive = useEffectEvent(() => {
    const access = unlockStats.hasUsageAccess();
    setHasAccess(access);
    if (enablingRef.current && access) enable();
    enablingRef.current = false;
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onActive();
    });
    return () => sub.remove();
  }, []);

  const toggle = async (on: boolean) => {
    if (!on) return settings.update({ trackUnlocks: false });
    if (unlockStats.hasUsageAccess()) return enable();
    Alert.alert(m.unlockSettings.accessTitle, m.unlockSettings.accessBody, [
      { text: m.common.cancel, style: 'cancel' },
      {
        text: m.common.openSettings,
        onPress: () => {
          enablingRef.current = true;
          unlockStats.openUsageAccessSettings();
        },
      },
    ]);
  };

  return (
    <Card>
      <View style={styles.switchRow}>
        <Text style={styles.title}>{m.unlockSettings.title}</Text>
        <Switch
          value={enabled && supported}
          onValueChange={toggle}
          disabled={!supported}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>{supported ? m.unlockSettings.body : m.unlockSettings.unsupported}</Text>
      {supported && enabled && !hasAccess && (
        <>
          <Text style={styles.warning}>{m.unlockSettings.accessOff}</Text>
          <Button
            title={m.unlockSettings.openAccess}
            variant="secondary"
            onPress={unlockStats.openUsageAccessSettings}
          />
        </>
      )}
    </Card>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    warning: { color: c.danger },
  });
