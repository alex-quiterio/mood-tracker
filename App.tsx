import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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

import { localDate } from './src/dates';
import { configureNotificationHandler } from './src/reminders';
import { CheckInScreen } from './src/screens/CheckInScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { Palette, ThemeContext, palettes, spacing, useColors, useThemedStyles } from './src/theme';
import { EntriesStore, useEntries } from './src/useEntries';
import { SettingsStore, useSettings } from './src/useSettings';

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

  // Hold off until the saved theme is known, so the app doesn't flash the default one.
  if (!settings.loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={palettes[settings.settings.theme]}>
        <Shell store={store} settings={settings} />
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}

function Shell({ store, settings }: { store: EntriesStore; settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const today = useToday();
  const [tab, setTab] = useState<TabKey>('checkin');

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
              <CheckInScreen store={store} trackUnlocks={settings.settings.trackUnlocks} />
            )}
            {tab === 'stats' && <StatsScreen store={store} />}
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
