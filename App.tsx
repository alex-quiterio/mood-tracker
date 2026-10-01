import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { stepCounter } from '@modules/step-counter';
import { localDate } from '@domain/shared/dates';
import { configureNotificationHandler } from '@infrastructure/notifications/handler';
import { NamePrompt } from '@ui/components/NamePrompt';
import { scheduleReminders } from '@infrastructure/notifications/reminders';
import { CheckInScreen } from '@ui/screens/CheckInScreen';
import { SettingsScreen } from '@ui/screens/SettingsScreen';
import { StatsScreen } from '@ui/screens/StatsScreen';
import { Palette, ThemeContext, paletteFor, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { EntriesStore, useEntries } from '@ui/hooks/useEntries';
import { SettingsStore, useSettings } from '@ui/hooks/useSettings';
import { activeVoice } from '@domain/voices/voices';
import { VoiceContext } from '@ui/theme/voiceContext';

configureNotificationHandler();

const TABS = [
  { key: 'checkin', title: 'Check-in', icon: '✎' },
  { key: 'stats', title: 'This week', icon: '▦' },
  { key: 'settings', title: 'Settings', icon: '⚙' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** The local date, refreshed when the app returns to the foreground (e.g. the next morning). */
function useToday() {
  const [today, setToday] = useState(localDate());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(localDate());
    });
    return () => sub.remove();
  }, []);
  return today;
}

export default function App() {
  const store = useEntries();
  const settings = useSettings();
  const { voice: voiceId, customQuotes } = settings.settings;
  const voice = useMemo(() => activeVoice(voiceId, customQuotes), [voiceId, customQuotes]);
  const { theme } = settings.settings;
  const palette = useMemo(() => paletteFor(theme, voiceId), [theme, voiceId]);

  // Hold off until the saved theme is known, so the app doesn't flash the default one.
  if (!settings.loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={palette}>
        <VoiceContext.Provider value={voice}>
          <Shell store={store} settings={settings} />
        </VoiceContext.Provider>
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

function Shell({ store, settings }: { store: EntriesStore; settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const today = useToday();
  const [tab, setTab] = useState<TabKey>('checkin');
  // A day picked in the calendar; the check-in screen opens on it.
  const [checkInDay, setCheckInDay] = useState<{ date: string; key: number } | null>(null);
  const editDay = (date: string) => {
    setCheckInDay((d) => ({ date, key: (d?.key ?? 0) + 1 }));
    setTab('checkin');
  };
  // "Not now" hides the name prompt until the next launch.
  const [nameSkipped, setNameSkipped] = useState(false);
  const { name, remindersEnabled, reminderTimes } = settings.settings;

  const saveName = async (next: string) => {
    await settings.update({ name: next });
    if (remindersEnabled) scheduleReminders(reminderTimes, next).catch(() => {});
  };
  const { trackUnlocks, trackSteps } = settings.settings;

  // Renew background step recording on launch, in case Play services dropped the subscription.
  useEffect(() => {
    if (trackSteps) stepCounter.subscribe().catch(() => {});
  }, [trackSteps]);
  const tracking = useMemo(() => ({ unlocks: trackUnlocks, steps: trackSteps }), [trackUnlocks, trackSteps]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style={c.isDark ? 'light' : 'dark'} />
      <Text style={styles.header}>{TABS.find((t) => t.key === tab)?.title}</Text>
      <KeyboardAvoidingView style={styles.content} behavior="padding">
        {!store.loaded ? (
          <ActivityIndicator style={styles.content} color={c.accent} />
        ) : (
          // Keyed on the date so screens reset to "today" after midnight.
          <View key={today} style={styles.content}>
            {tab === 'checkin' && (
              <CheckInScreen
                key={checkInDay?.key ?? 0}
                store={store}
                tracking={tracking}
                name={name}
                initialDate={checkInDay?.date}
                habits={settings.settings.habits}
              />
            )}
            {tab === 'stats' && (
              <StatsScreen
                store={store}
                today={today}
                onEditDay={editDay}
                habits={settings.settings.habits}
                habitsInPrompt={settings.settings.habitsInPrompt}
              />
            )}
            {tab === 'settings' && <SettingsScreen store={store} settings={settings} />}
          </View>
        )}
      </KeyboardAvoidingView>
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const selected = t.key === tab;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setTab(t.key)}
              style={styles.tab}
            >
              <Text style={[styles.tabIcon, selected && styles.tabSelected]}>{t.icon}</Text>
              <Text style={[styles.tabText, selected && styles.tabSelected]}>{t.title}</Text>
            </Pressable>
          );
        })}
      </View>
      <NamePrompt visible={!name && !nameSkipped} onSave={saveName} onSkip={() => setNameSkipped(true)} />
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      fontSize: 26,
      fontWeight: '700',
      color: c.text,
      paddingHorizontal: spacing(4),
      paddingTop: spacing(3),
      ...c.heading,
    },
    content: { flex: 1 },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: spacing(2) },
    tabIcon: { fontSize: 20, color: c.muted },
    tabText: { fontSize: 12, color: c.muted },
    tabSelected: { color: c.accent, fontWeight: '600' },
  });
