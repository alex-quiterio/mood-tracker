import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';

import { HomeWidgetState, homeWidget } from '@modules/home-widget';
import { summarizeDay } from '@domain/checkins/calendar';
import { Entry, SLOTS } from '@domain/checkins/types';
import { WidgetTarget, moodsOn, parseWidgetLink, widgetLink } from '@domain/checkins/widget';
import { Locale } from '@domain/settings/language';
import { addDays, weekStart } from '@domain/shared/dates';
import { quoteOfTheDay } from '@domain/voices/voices';
import { weekdayInitials } from '@ui/foundation/i18n/format';
import { greetingFor, greetingText } from '@ui/foundation/i18n/greetings';
import { Messages } from '@ui/foundation/i18n/messages';
import { Palette } from '@ui/foundation/theme/theme';
import { ActiveVoice } from '@ui/foundation/voices/voices';

type WidgetInput = {
  entries: Entry[];
  today: string;
  name: string;
  m: Messages;
  locale: Locale;
  voice: Pick<ActiveVoice, 'moodEmoji' | 'moodLabels' | 'slotLabels' | 'quotes'>;
  palette: Pick<Palette, 'surface' | 'background' | 'text' | 'muted' | 'accent' | 'onMood' | 'moodColors'>;
};

/** What the widget shows: today's check-ins in the current voice, the week, the quote, words and colours. */
export function homeWidgetState({
  entries,
  today,
  name,
  m,
  locale,
  voice,
  palette,
}: WidgetInput): HomeWidgetState {
  const moods = moodsOn(entries, today);
  const tomorrow = addDays(today, 1);
  // The widget shows the current week; next week's days let it roll over on Sunday night.
  const monday = weekStart(today);
  const initials = weekdayInitials(locale);
  return {
    date: today,
    greetings: SLOTS.map((slot) => `${greetingFor(slot, locale).emoji} ${greetingText(slot, name, locale)}`),
    pause: m.widget.pause,
    pauseLink: widgetLink({ kind: 'pause' }),
    empty: '○',
    colors: {
      surface: palette.surface,
      text: palette.text,
      muted: palette.muted,
      accent: palette.accent,
      empty: palette.background,
      onMood: palette.onMood,
    },
    slots: SLOTS.map((slot) => {
      const mood = moods[slot];
      const label = voice.slotLabels[slot];
      return {
        label,
        emoji: mood ? voice.moodEmoji[mood] : '',
        color: mood ? palette.moodColors[mood] : '',
        a11yDone: mood ? m.widget.slotDone(label, voice.moodLabels[mood]) : '',
        a11yEmpty: m.widget.slotEmpty(label),
        link: widgetLink({ kind: 'checkin', slot }),
      };
    }),
    week: Array.from({ length: 14 }, (_, i) => addDays(monday, i)).map((date, i) => {
      const { mood } = summarizeDay(entries, date);
      return { date, initial: initials[i % 7], color: mood ? palette.moodColors[mood] : '' };
    }),
    weekLink: widgetLink({ kind: 'stats' }),
    quotes: [today, tomorrow].flatMap((date) => {
      const quote = quoteOfTheDay(voice.quotes, date);
      return quote ? [{ date, text: quote.text, source: quote.source ?? '' }] : [];
    }),
  };
}

/** Keeps the home-screen widget in step with today's check-ins, the voice, language and theme. */
export function useHomeWidget(state: HomeWidgetState | null) {
  const json = state ? JSON.stringify(state) : null;
  useEffect(() => {
    if (state) homeWidget.update(state);
    // `json` captures every change to the state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json]);
}

/** Calls `onOpen` when a tap on the widget opened the app, or brought it to the front. */
export function useWidgetLinks(onOpen: (target: WidgetTarget) => void) {
  const handler = useRef(onOpen);
  useEffect(() => {
    handler.current = onOpen;
  });

  useEffect(() => {
    const open = (url: string | null) => {
      const target = parseWidgetLink(url);
      if (target) handler.current(target);
    };
    Linking.getInitialURL()
      .then(open)
      .catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => sub.remove();
  }, []);
}
