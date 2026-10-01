import { useEffect, useState } from 'react';
import { Alert, AppState, Linking, PermissionsAndroid, StyleSheet, Switch, Text, View } from 'react-native';

import { stepCounter } from '@modules/step-counter';
import { Button } from '@ui/components/Button';
import { startStepRecording } from '@infrastructure/signals/steps';
import { Palette, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { SettingsStore } from '@ui/hooks/useSettings';

/** Asks for "Physical activity". True when granted (or not needed before Android 10). */
async function ensurePermission(): Promise<boolean> {
  if (stepCounter.hasPermission()) return true;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION, {
    title: 'Count your steps?',
    message: 'Mood Tracker asks your phone for your steps at each check-in. The count stays on this phone.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) return true;
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'Physical activity is off',
      'Android won’t ask again. Turn on "Physical activity" for Mood Tracker in its app settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ],
    );
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
      const granted = await ensurePermission();
      setHasPermission(granted);
      if (!granted) return;
      // Starts background recording, and counts from now rather than from when tracking was last on.
      if (!(await startStepRecording())) {
        Alert.alert(
          'Could not start step counting',
          'Google Play services did not start recording steps. Try again later.',
        );
        return;
      }
      await settings.update({ trackSteps: true });
    } catch (e) {
      Alert.alert('Could not turn on step counting', String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.switchRow}>
        <Text style={styles.title}>Steps</Text>
        <Switch
          value={enabled && supported}
          onValueChange={toggle}
          disabled={!supported || busy}
          trackColor={{ true: c.accent, false: c.border }}
          thumbColor={c.surface}
        />
      </View>
      <Text style={styles.body}>
        {supported
          ? 'Counts your steps since your last check-in and adds them to the stats and the Claude prompt. Google Play services records the steps in the background, on this phone and without an account. Only check-ins saved for the current time slot get a count; steps are counted from when you turn this on.'
          : 'Needs an up-to-date Google Play services and an installed build of the app (it does not work in Expo Go).'}
      </Text>
      {supported && enabled && !hasPermission && (
        <>
          <Text style={styles.warning}>
            Physical activity permission is off, so steps are not being counted.
          </Text>
          <Button title="Open app settings" variant="secondary" onPress={() => Linking.openSettings()} />
        </>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    section: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: spacing(4),
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing(3),
    },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '600', color: c.text },
    body: { color: c.muted, lineHeight: 20 },
    warning: { color: c.danger },
  });
