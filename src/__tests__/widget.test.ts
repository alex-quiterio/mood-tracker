import { describe, expect, it } from '@jest/globals';

import { homeWidget } from '@modules/home-widget';
import { Entry } from '@domain/checkins/types';
import { moodsOn, parseWidgetLink, widgetLink } from '@domain/checkins/widget';
import { homeWidgetState } from '@ui/hooks/useHomeWidget';
import { messages } from '@ui/i18n/messages';
import { paletteFor } from '@ui/theme/theme';
import { activeVoice } from '@ui/voices/voices';

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
      { kind: 'stats' } as const,
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
  const palette = paletteFor('light', 'laoTzu');
  const voice = activeVoice('laoTzu', {}, 'pt-PT');
  const state = homeWidgetState({
    entries: [
      entry('2026-10-02', 'afternoon', 5),
      entry('2026-09-30', 'morning', 2),
      entry('2026-09-30', 'evening', 4),
      entry('2026-09-25', 'evening', 1),
    ],
    today: '2026-10-02',
    name: 'Alex',
    m: messages('pt-PT'),
    locale: 'pt-PT',
    voice,
    palette,
  });

  it('greets by time of day, in the language, with the name', () => {
    expect(state.greetings).toHaveLength(3);
    expect(state.greetings.every((g) => g.includes('Alex'))).toBe(true);
  });

  it('colours done slots with the mood and the voice emoji', () => {
    expect(state.slots.map((s) => s.emoji)).toEqual(['', voice.moodEmoji[5], '']);
    expect(state.slots.map((s) => s.color)).toEqual(['', palette.moodColors[5], '']);
    expect(state.slots[0].label).toBe(voice.slotLabels.morning);
    expect(parseWidgetLink(state.slots[2].link)).toEqual({ kind: 'checkin', slot: 'evening' });
    expect(parseWidgetLink(state.pauseLink)).toEqual({ kind: 'pause' });
  });

  it('sends this week and next, Monday to Sunday', () => {
    // 2026-10-02 is a Friday, so the week starts on Monday 2026-09-28.
    expect(state.week).toHaveLength(14);
    expect(state.week[0].date).toBe('2026-09-28');
    expect(state.week[13].date).toBe('2026-10-11');
    expect(state.week.slice(0, 7).map((d) => d.initial)).toEqual(['S', 'T', 'Q', 'Q', 'S', 'S', 'D']);
    // Wednesday 2026-09-30 has moods 2 and 4, which average to 3.
    expect(state.week[2]).toEqual({ date: '2026-09-30', initial: 'Q', color: palette.moodColors[3] });
    expect(state.week[5].color).toBe('');
    expect(parseWidgetLink(state.weekLink)).toEqual({ kind: 'stats' });
  });

  it('starts the week on Monday, also on a Sunday', () => {
    const sunday = homeWidgetState({
      entries: [],
      today: '2026-10-04',
      name: '',
      m: messages('en'),
      locale: 'en',
      voice,
      palette,
    });
    expect(sunday.week[0].date).toBe('2026-09-28');
    expect(sunday.week[6].date).toBe('2026-10-04');
  });

  it("sends today's and tomorrow's quote, or none for a voice without quotes", () => {
    expect(state.quotes.map((q) => q.date)).toEqual(['2026-10-02', '2026-10-03']);
    expect(state.quotes[0].text).not.toBe(state.quotes[1].text);
    const plain = homeWidgetState({
      entries: [],
      today: '2026-10-02',
      name: '',
      m: messages('en'),
      locale: 'en',
      voice: activeVoice('plain', {}, 'en'),
      palette,
    });
    expect(plain.quotes).toEqual([]);
  });
});

describe('home widget without native code', () => {
  it('reports unsupported and ignores updates', () => {
    expect(homeWidget.isSupported()).toBe(false);
    expect(() =>
      homeWidget.update(
        homeWidgetState({
          entries: [],
          today: '2026-10-02',
          name: '',
          m: messages('en'),
          locale: 'en',
          voice: activeVoice('plain', {}, 'en'),
          palette: paletteFor('dark', 'plain'),
        }),
      ),
    ).not.toThrow();
  });
});
