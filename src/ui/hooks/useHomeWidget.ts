import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';

import { HomeWidgetState, homeWidget } from '@modules/home-widget';
import { Entry, SLOTS } from '@domain/checkins/types';
import { WidgetTarget, moodsOn, parseWidgetLink, widgetLink } from '@domain/checkins/widget';
import { Messages } from '@ui/i18n/messages';
import { Palette } from '@ui/theme/theme';
import { Voice } from '@ui/voices/voices';

/** What the widget shows for a day: each slot's mood emoji in the current voice, words and colours. */
export function homeWidgetState(
  entries: Entry[],
  date: string,
  m: Messages,
  voice: Pick<Voice, 'moodEmoji' | 'moodLabels' | 'slotLabels'>,
  palette: Pick<Palette, 'surface' | 'text' | 'muted' | 'accent'>,
): HomeWidgetState {
  const moods = moodsOn(entries, date);
  return {
    date,
    title: m.widget.title,
    pause: m.widget.pause,
    pauseLink: widgetLink({ kind: 'pause' }),
    empty: '○',
    colors: { surface: palette.surface, text: palette.text, muted: palette.muted, accent: palette.accent },
    slots: SLOTS.map((slot) => {
      const mood = moods[slot];
      const label = voice.slotLabels[slot];
      return {
        label,
        emoji: mood ? voice.moodEmoji[mood] : '',
        a11y: mood ? m.widget.slotDone(label, voice.moodLabels[mood]) : m.widget.slotEmpty(label),
        link: widgetLink({ kind: 'checkin', slot }),
      };
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
