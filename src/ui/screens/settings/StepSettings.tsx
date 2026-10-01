import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, PermissionsAndroid, StyleSheet, Switch, Text, View } from 'react-native';

import { stepCounter } from '@modules/step-counter';
import { Button } from '@ui/components/Button';
import { Card } from '@ui/components/Card';
import { startStepRecording } from '@infrastructure/signals/steps';
import { Palette, useColors, useThemedStyles } from '@ui/theme/theme';
import { SettingsStore } from '@ui/hooks/useSettings';
import { Messages } from '@domain/i18n/messages';
import { useLocale } from '@ui/i18n/LocaleContext';

/** Asks for "Physical activity". True when granted (or not needed before Android 10). */
async function ensurePermission(m: Messages): Promise<boolean> {
  if (stepCounter.hasPermission()) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION, {
    title: m.stepSettings.askTitle,
    message: m.stepSettings.askBody,
    buttonPositive: m.common.allow,
    buttonNegative: m.common.notNow,
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(m.stepSettings.deniedTitle, m.stepSettings.deniedBody, [
      { text: m.common.cancel, style: 'cancel' },
      { text: m.common.openSettings, onPress: () => Linking.openSettings() },
    ]);
  }
  return false;
}

export function StepSettings({ settings }: { settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const supported = stepCounter.isSupported();
  const [hasPermission, setHasPermission] = useState(() => stepCounter.hasPermission());
  const [busy, setBusy] = useState(false);
  const enabled = settings.settings.trackSteps;
  const { m } = useLocale();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setHasPermission(stepCounter.hasPermission());
    });
    return () => sub.remove();
  }, []);

  const toggle = async (on: boolean) => {
    if (!on) return settings.update({ trackSteps: false });
    setBusy(true);
    try {
      const granted = await ensurePermission(m);
      setHasPermission(granted);
      if (!granted) return;
      // Starts background recording, and counts from now rather than from when tracking was last on.
      if (!(await startStepRecording())) {
        Alert.alert(m.stepSettings.startFailedTitle, m.stepSettings.startFailedBody);
        return;
      }
      await settings.update({ trackSteps: true });
    } catch (e) {
      Alert.alert(m.stepSettings.failed, String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <View style={styles.switchRow}>
        <Text style={styles.title}>{m.stepSettings.title}</Text>
        <Switch
          value={enabled && supported}
          onValueChange={toggle}
          disabled={!supported || busy}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>{supported ? m.stepSettings.body : m.stepSettings.unsupported}</Text>
      {supported && enabled && !hasPermission && (
        <>
          <Text style={styles.warning}>{m.stepSettings.permissionOff}</Text>
          <Button
            title={m.common.openAppSettings}
            variant="secondary"
            onPress={() => Linking.openSettings()}
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
