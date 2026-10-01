import { describe, expect, it } from '@jest/globals';

import { buildReflectionPrompt } from '@domain/voices/prompt';
import { DEFAULT_QUOTES } from '@domain/voices/quotes';
import { weeklyStats } from '@domain/checkins/stats';
import { Entry, MOODS, SLOTS } from '@domain/checkins/types';
import {
  VOICES,
  VOICE_IDS,
  activeVoice,
  formatQuotesText,
  parseQuotesText,
  quoteOfTheDay,
} from '@domain/voices/voices';

const entry: Entry = { date: '2026-10-01', slot: 'morning', mood: 2, recordedAt: '2026-10-01T08:00:00.000Z' };

describe('voices', () => {
  it.each(VOICE_IDS)('%s is complete', (id) => {
    const v = VOICES[id];
    for (const m of MOODS) expect(v.moodLabels[m] && v.moodEmoji[m]).toBeTruthy();
    for (const s of SLOTS) expect(v.slotLabels[s] && v.notePrompts[s]).toBeTruthy();
    expect(v.burst.high.length && v.burst.mid.length).toBeTruthy();
    expect(v.claude.ask.match(/\{signals\}/g)).toHaveLength(1);
  });

  const withQuotes = VOICE_IDS.filter((id) => id !== 'plain' && !VOICES[id].quotesNote);

  it.each(withQuotes)('%s has sourced default quotes', (id) => {
    expect(DEFAULT_QUOTES[id].length).toBeGreaterThanOrEqual(5);
    for (const q of DEFAULT_QUOTES[id]) {
      expect(q.text.length).toBeLessThanOrEqual(220);
      expect(q.source).toMatch(/\(tr\. .+, \d{4}\)$/);
    }
  });

  it('frames the Claude prompt in the voice but keeps the data plain', () => {
    const stats = weeklyStats([entry], '2026-10-01');
    const prompt = buildReflectionPrompt(stats, VOICES.marcus);
    expect(prompt.startsWith(VOICES.marcus.claude.intro)).toBe(true);
    expect(prompt).toContain('morning: 2/5');
    expect(prompt).toContain('what was in my control');
    expect(prompt).not.toContain('{signals}');
  });

  it('keeps the plain prompt as it was', () => {
    const prompt = buildReflectionPrompt(weeklyStats([entry], '2026-10-01'), VOICES.plain);
    expect(prompt.startsWith('Here are my mood check-ins')).toBe(true);
    expect(prompt).toContain(
      'What patterns do you notice (time of day, days of the week, anything in the notes)?',
    );
  });
});

describe('voices without built-in quotes', () => {
  it.each(VOICE_IDS.filter((id) => VOICES[id].quotesNote))('%s explains why and has none', (id) => {
    expect(DEFAULT_QUOTES[id]).toEqual([]);
    expect(VOICES[id].quotesNote).toMatch(/copyright/);
  });
});

describe('quotes', () => {
  const quotes = [{ text: 'First line of a quote.', source: 'Somewhere, 1' }, { text: 'No source here.' }];

  it('round-trips through the editor format', () => {
    expect(parseQuotesText(formatQuotesText(quotes))).toEqual(quotes);
  });

  it('parses hand-written text loosely', () => {
    expect(parseQuotesText('  A verse\nthat wraps \n-- Book II\n\n\n\nAnother\n')).toEqual([
      { text: 'A verse that wraps', source: 'Book II' },
      { text: 'Another' },
    ]);
    expect(parseQuotesText('   \n\n ')).toEqual([]);
    // A lone dash line is the quote itself, not a source.
    expect(parseQuotesText('— just a dash')).toEqual([{ text: '— just a dash' }]);
  });

  it('shows a different quote every day of the week, for every voice', () => {
    const week = [
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ];
    for (const id of VOICE_IDS) {
      const list = DEFAULT_QUOTES[id];
      if (list.length === 0) continue;
      const picked = week.map((d) => quoteOfTheDay(list, d));
      expect(new Set(picked).size).toBe(Math.min(7, list.length));
    }
  });

  it('cycles across month and year boundaries without skipping', () => {
    const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((text) => ({ text }));
    const days = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'];
    const idx = days.map((d) => list.indexOf(quoteOfTheDay(list, d)!));
    for (let i = 1; i < idx.length; i++) expect(idx[i]).toBe((idx[i - 1] + 1) % list.length);
  });

  it('picks the same quote all day and cycles with the offset', () => {
    const a = quoteOfTheDay(quotes, '2026-10-01');
    expect(quoteOfTheDay(quotes, '2026-10-01')).toBe(a);
    expect(quoteOfTheDay(quotes, '2026-10-01', 1)).not.toBe(a);
    expect(quoteOfTheDay([], '2026-10-01')).toBeNull();
  });

  it('uses custom quotes when set, defaults otherwise', () => {
    expect(activeVoice('rumi', { rumi: quotes }).quotes).toBe(quotes);
    expect(activeVoice('rumi', {}).quotes).toBe(DEFAULT_QUOTES.rumi);
    expect(activeVoice('rumi', { rumi: [] }).quotes).toBe(DEFAULT_QUOTES.rumi);
  });
});
