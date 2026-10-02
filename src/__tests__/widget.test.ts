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

  it('sends the week ending today, then tomorrow, Monday-first initials', () => {
    expect(state.week.map((d) => d.date)).toEqual([
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
    // 2026-09-30 is a Wednesday (Quarta); its moods 2 and 4 average to 3.
    expect(state.week[4]).toEqual({ date: '2026-09-30', initial: 'Q', color: palette.moodColors[3] });
    expect(state.week[7].color).toBe('');
    expect(parseWidgetLink(state.weekLink)).toEqual({ kind: 'stats' });
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
