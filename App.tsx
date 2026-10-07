import { useCalendars, useLocales } from 'expo-localization';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { stepCounter } from '@modules/step-counter';
import { localDate } from '@domain/shared/dates';
import { configureNotificationHandler } from '@infrastructure/notifications/handler';
import { LockScreen } from '@ui/features/lock/LockScreen';
import { NamePrompt } from '@ui/features/settings/NamePrompt';
import { useQuickCheckIn } from '@ui/features/checkin/useQuickCheckIn';
import { useAutoBackup } from '@ui/features/settings/useAutoBackup';
import { homeWidgetState, useHomeWidget, useWidgetLinks } from '@ui/features/widget/useHomeWidget';
import { useVoice } from '@ui/foundation/theme/voiceContext';
import { Slot } from '@domain/checkins/types';
import { useAppLock } from '@ui/features/lock/useAppLock';
import { setScreenPrivacy } from '@infrastructure/security/screenPrivacy';
import { scheduleReminders } from '@infrastructure/notifications/reminders';
import { reminderMessages } from '@ui/foundation/i18n/reminders';
import { CheckInScreen } from '@ui/screens/CheckInScreen';
import { SettingsScreen } from '@ui/screens/SettingsScreen';
import { StatsScreen } from '@ui/screens/StatsScreen';
import { Text } from '@ui/kit/Text';
import { HistoryScreen } from '@ui/screens/HistoryScreen';
import {
  Palette,
  ThemeContext,
  paletteFor,
  spacing,
  useColors,
  useThemedStyles,
  radius,
  typeScale,
  withAlpha,
} from '@ui/foundation/theme/theme';
import { EntriesStore, useEntries } from '@ui/state/useEntries';
import { SettingsStore, useSettings } from '@ui/state/useSettings';
import { localeFor } from '@domain/settings/language';
import { timeZoneFor } from '@domain/settings/timeZone';
import { voiceForDay } from '@domain/voices/rotation';
import { messages } from '@ui/foundation/i18n/messages';
import { localizeHabits } from '@ui/foundation/i18n/habits';
import { activeVoice } from '@ui/foundation/voices/voices';
import { LocaleContext, useLocale } from '@ui/foundation/i18n/LocaleContext';
import { VoiceContext } from '@ui/foundation/theme/voiceContext';

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
  const { voice: chosenVoice, voiceRotation, rotationVoices, customQuotes, language } = settings.settings;
  // With rotation on, the voice changes by itself each day or week.
  const today = useToday();
  const voiceId = voiceForDay(voiceRotation, rotationVoices, chosenVoice, today);
  // Follows the phone's language live (useLocales re-renders when it changes).
  const deviceTag = useLocales()[0]?.languageTag;
  const locale = localeFor(language, deviceTag);
  // Check-in times show in the phone's zone (following it when you travel) or a fixed one.
  const deviceZone = useCalendars()[0]?.timeZone;
  const timeZone = timeZoneFor(settings.settings.timeZone, deviceZone);
  const localeValue = useMemo(() => ({ locale, m: messages(locale), timeZone }), [locale, timeZone]);
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
  // The tabs sit side by side in a pager: swipe between them, or tap one in the tab bar.
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const tabIndex = TABS.findIndex((t) => t.key === tab);
  const showTab = (key: TabKey) => {
    setTab(key);
    pager.current?.scrollTo({ x: TABS.findIndex((t) => t.key === key) * width, animated: true });
  };
  const onSwiped = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const swipedTo = TABS[Math.min(TABS.length - 1, Math.max(0, index))].key;
    if (swipedTo !== tab) setTab(swipedTo);
  };
  const { m, locale } = useLocale();
  const lock = useAppLock(settings.settings.appLock, { prompt: m.lock.prompt, cancel: m.common.cancel });
  // Untouched preset habits show in the app's language.
  const habits = useMemo(
    () => localizeHabits(settings.settings.habits, locale),
    [settings.settings.habits, locale],
  );
  // A slot or pause tapped on the widget; the check-in screen opens on it.
  const [checkInOpen, setCheckInOpen] = useState<{ slot?: Slot; pause?: boolean; key: number } | null>(null);
  const openCheckIn = (open: { slot?: Slot; pause?: boolean } = {}) => {
    setCheckInOpen((o) => ({ ...open, key: (o?.key ?? 0) + 1 }));
    showTab('checkin');
  };
  useWidgetLinks((target) => {
    if (target.kind === 'stats') showTab('stats');
    else openCheckIn(target.kind === 'pause' ? { pause: true } : { slot: target.slot });
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
          <ScrollView
            key={today}
            ref={pager}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentOffset={{ x: tabIndex * width, y: 0 }}
            onMomentumScrollEnd={onSwiped}
            style={styles.content}
          >
            <View style={[styles.page, { width }]}>
              <CheckInScreen
                key={checkInOpen?.key ?? 0}
                store={store}
                tracking={tracking}
                name={name}
                initialSlot={checkInOpen?.slot}
                initialPause={checkInOpen?.pause}
                habits={habits}
              />
            </View>
            <View style={[styles.page, { width }]}>
              <StatsScreen
                store={store}
                today={today}
                habits={habits}
                habitsInPrompt={settings.settings.habitsInPrompt}
                showSpending={settings.settings.showSpending}
                onHabitsInPromptChange={(include) => settings.update({ habitsInPrompt: include })}
              />
            </View>
            <View style={[styles.page, { width }]}>
              <HistoryScreen
                store={store}
                today={today}
                tracking={tracking}
                habits={habits}
                habitsInPrompt={settings.settings.habitsInPrompt}
                onHabitsInPromptChange={(include) => settings.update({ habitsInPrompt: include })}
              />
            </View>
            <View style={[styles.page, { width }]}>
              <SettingsScreen store={store} settings={settings} />
            </View>
          </ScrollView>
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
              onPress={() => showTab(t.key)}
              style={[styles.tab, selected && styles.tabActive]}
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
      ...typeScale.display,
      color: c.text,
      paddingHorizontal: spacing(4),
      paddingTop: spacing(3),
      ...c.heading,
    },
    content: { flex: 1 },
    page: { flex: 1 },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
      padding: spacing(2),
      gap: spacing(2),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: spacing(2),
      borderRadius: radius.md,
    },
    // The whole selected tab, icon and label, sits on a soft block of the accent colour.
    tabActive: { backgroundColor: withAlpha(c.accent, 0.16) },
    tabIcon: { fontSize: 20, color: c.muted },
    tabText: { ...typeScale.caption, color: c.muted },
    tabSelected: { color: c.accent, fontWeight: '700' },
  });
