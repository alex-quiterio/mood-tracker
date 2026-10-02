import { describe, expect, it } from '@jest/globals';

import { homeWidget } from '@modules/home-widget';
import { Entry } from '@domain/checkins/types';
import { moodsOn, parseWidgetLink, widgetLink } from '@domain/checkins/widget';
import { homeWidgetState } from '@ui/hooks/useHomeWidget';
import { messages } from '@ui/i18n/messages';
import { voiceFor } from '@ui/voices/voices';

const entry = (date: string, slot: Entry['slot'], mood: Entry['mood']): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T09:00:00.000Z`,
});

describe('widget links', () => {
  it('round-trip every target', () => {
    for (const target of [
      { kind: 'pause' } as const,
      { kind: 'checkin', slot: 'morning' } as const,
      { kind: 'checkin', slot: 'evening' } as const,
    ]) {
      expect(parseWidgetLink(widgetLink(target))).toEqual(target);
    }
  });

  it('ignore other links', () => {
    expect(parseWidgetLink(null)).toBeNull();
    expect(parseWidgetLink('https://example.com')).toBeNull();
    expect(parseWidgetLink('moodtracker://widget/checkin/night')).toBeNull();
    expect(parseWidgetLink('moodtracker://widget/other')).toBeNull();
  });
});

describe('moodsOn', () => {
  it('gives each slot of the day its mood, or null', () => {
    const entries = [entry('2026-10-02', 'morning', 4), entry('2026-10-01', 'evening', 2)];
    expect(moodsOn(entries, '2026-10-02')).toEqual({ morning: 4, afternoon: null, evening: null });
  });
});

describe('homeWidgetState', () => {
  const palette = { surface: '#FFFFFF', text: '#111111', muted: '#777777', accent: '#AA0000' };

  it('shows the voice emoji for done slots and words in the language', () => {
    const voice = voiceFor('plain', 'pt-PT');
    const state = homeWidgetState(
      [entry('2026-10-02', 'afternoon', 5)],
      '2026-10-02',
      messages('pt-PT'),
      voice,
      palette,
    );
    expect(state.date).toBe('2026-10-02');
    expect(state.title).toBe('Hoje');
    expect(state.slots.map((s) => s.emoji)).toEqual(['', voice.moodEmoji[5], '']);
    expect(state.slots[0].label).toBe(voice.slotLabels.morning);
    expect(parseWidgetLink(state.slots[2].link)).toEqual({ kind: 'checkin', slot: 'evening' });
    expect(parseWidgetLink(state.pauseLink)).toEqual({ kind: 'pause' });
    expect(state.colors).toEqual(palette);
  });
});

describe('home widget without native code', () => {
  it('reports unsupported and ignores updates', () => {
    expect(homeWidget.isSupported()).toBe(false);
    expect(() =>
      homeWidget.update(
        homeWidgetState([], '2026-10-02', messages('en'), voiceFor('plain'), {
          surface: '#FFF',
          text: '#000',
          muted: '#777',
          accent: '#A00',
        }),
      ),
    ).not.toThrow();
  });
});
