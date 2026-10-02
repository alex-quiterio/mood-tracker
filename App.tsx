import { useLocales } from 'expo-localization';
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
import { LockScreen } from '@ui/components/LockScreen';
import { NamePrompt } from '@ui/components/NamePrompt';
import { useQuickCheckIn } from '@ui/hooks/useQuickCheckIn';
import { useAutoBackup } from '@ui/hooks/useAutoBackup';
import { homeWidgetState, useHomeWidget, useWidgetLinks } from '@ui/hooks/useHomeWidget';
import { useVoice } from '@ui/theme/voiceContext';
import { Slot } from '@domain/checkins/types';
import { useAppLock } from '@ui/hooks/useAppLock';
import { setScreenPrivacy } from '@infrastructure/security/screenPrivacy';
import { scheduleReminders } from '@infrastructure/notifications/reminders';
import { reminderMessages } from '@ui/i18n/reminders';
import { CheckInScreen } from '@ui/screens/CheckInScreen';
import { SettingsScreen } from '@ui/screens/SettingsScreen';
import { StatsScreen } from '@ui/screens/StatsScreen';
import { HistoryScreen } from '@ui/screens/HistoryScreen';
import { Palette, ThemeContext, paletteFor, spacing, useColors, useThemedStyles } from '@ui/theme/theme';
import { EntriesStore, useEntries } from '@ui/hooks/useEntries';
import { SettingsStore, useSettings } from '@ui/hooks/useSettings';
import { localeFor } from '@domain/settings/language';
import { messages } from '@ui/i18n/messages';
import { localizeHabits } from '@ui/i18n/habits';
import { activeVoice } from '@ui/voices/voices';
import { LocaleContext, useLocale } from '@ui/i18n/LocaleContext';
import { VoiceContext } from '@ui/theme/voiceContext';

configureNotificationHandler();

const TABS = [
  { key: 'checkin', icon: '✎' },
  { key: 'stats', icon: '▦' },
  { key: 'history', icon: '↺' },
  { key: 'settings', icon: '⚙' },
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
  const { voice: voiceId, customQuotes, language } = settings.settings;
  // Follows the phone's language live (useLocales re-renders when it changes).
  const deviceTag = useLocales()[0]?.languageTag;
  const locale = localeFor(language, deviceTag);
  const localeValue = useMemo(() => ({ locale, m: messages(locale) }), [locale]);
  const voice = useMemo(() => activeVoice(voiceId, customQuotes, locale), [voiceId, customQuotes, locale]);
  const { theme } = settings.settings;
  const palette = useMemo(() => paletteFor(theme, voiceId), [theme, voiceId]);

  // Hold off until the saved theme is known, so the app doesn't flash the default one.
  if (!settings.loaded) return null;

  return (
    <SafeAreaProvider>
      <LocaleContext.Provider value={localeValue}>
        <ThemeContext.Provider value={palette}>
          <VoiceContext.Provider value={voice}>
            <Shell store={store} settings={settings} />
          </VoiceContext.Provider>
        </ThemeContext.Provider>
      </LocaleContext.Provider>
    </SafeAreaProvider>
  );
}

function Shell({ store, settings }: { store: EntriesStore; settings: SettingsStore }) {
  const styles = useThemedStyles(makeStyles);
  const c = useColors();
  const today = useToday();
  useQuickCheckIn(store);
  useAutoBackup(store, settings, today);
  const [tab, setTab] = useState<TabKey>('checkin');
  const { m, locale } = useLocale();
  const lock = useAppLock(settings.settings.appLock, { prompt: m.lock.prompt, cancel: m.common.cancel });
  // Untouched preset habits show in the app's language.
  const habits = useMemo(
    () => localizeHabits(settings.settings.habits, locale),
    [settings.settings.habits, locale],
  );
  // A day picked in the calendar, or a slot or pause tapped on the widget; the check-in screen opens on it.
  const [checkInDay, setCheckInDay] = useState<{
    date: string;
    slot?: Slot;
    pause?: boolean;
    key: number;
  } | null>(null);
  const openCheckIn = (date: string, open: { slot?: Slot; pause?: boolean } = {}) => {
    setCheckInDay((d) => ({ date, ...open, key: (d?.key ?? 0) + 1 }));
    setTab('checkin');
  };
  const editDay = (date: string) => openCheckIn(date);
  useWidgetLinks((target) => {
    if (target.kind === 'stats') setTab('stats');
    else openCheckIn(localDate(), target.kind === 'pause' ? { pause: true } : { slot: target.slot });
  });
  // "Not now" hides the name prompt until the next launch.
  const [nameSkipped, setNameSkipped] = useState(false);
  const { name, remindersEnabled, reminderTimes } = settings.settings;
  const voice = useVoice();
  // With App lock on, the widget doesn't show who the phone belongs to.
  const widgetName = settings.settings.appLock ? '' : name;
  useHomeWidget(
    store.loaded
      ? homeWidgetState({ entries: store.entries, today, name: widgetName, m, locale, voice, palette: c })
      : null,
  );

  const saveName = async (next: string) => {
    await settings.update({ name: next });
    if (remindersEnabled) scheduleReminders(reminderTimes, reminderMessages(next, locale)).catch(() => {});
  };
  const { trackUnlocks, trackSteps } = settings.settings;

  // Reminders are written in the app's language, so reschedule them when it changes.
  useEffect(() => {
    if (remindersEnabled) scheduleReminders(reminderTimes, reminderMessages(name, locale)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  // Renew background step recording on launch, in case Play services dropped the subscription.
  useEffect(() => {
    if (trackSteps) stepCounter.subscribe().catch(() => {});
  }, [trackSteps]);
  const tracking = useMemo(() => ({ unlocks: trackUnlocks, steps: trackSteps }), [trackUnlocks, trackSteps]);

  // Keep the recent-apps preview blank while the lock is on.
  useEffect(() => {
    setScreenPrivacy(settings.settings.appLock);
  }, [settings.settings.appLock]);

  if (lock.locked) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar style={c.isDark ? 'light' : 'dark'} />
        <LockScreen onUnlock={lock.unlock} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style={c.isDark ? 'light' : 'dark'} />
      <Text style={styles.header}>{m.tabs[tab]}</Text>
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
                initialSlot={checkInDay?.slot}
                initialPause={checkInDay?.pause}
                habits={habits}
              />
            )}
            {tab === 'stats' && (
              <StatsScreen
                store={store}
                today={today}
                habits={habits}
                habitsInPrompt={settings.settings.habitsInPrompt}
                showSpending={settings.settings.showSpending}
                onHabitsInPromptChange={(include) => settings.update({ habitsInPrompt: include })}
              />
            )}
            {tab === 'history' && (
              <HistoryScreen
                store={store}
                today={today}
                onEditDay={editDay}
                habits={habits}
                habitsInPrompt={settings.settings.habitsInPrompt}
                onHabitsInPromptChange={(include) => settings.update({ habitsInPrompt: include })}
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
              onPress={() => {
                // A day opened from the calendar is for that visit; Check-in opens on today again.
                if (t.key !== 'checkin') setCheckInDay(null);
                setTab(t.key);
              }}
              style={styles.tab}
            >
              <Text style={[styles.tabIcon, selected && styles.tabSelected]}>{t.icon}</Text>
              <Text style={[styles.tabText, selected && styles.tabSelected]}>{m.tabs[t.key]}</Text>
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
