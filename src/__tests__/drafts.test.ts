import { describe, expect, it } from '@jest/globals';

import { Draft, draftOf, isDraftChanged, parseDraft } from '@domain/checkins/drafts';
import { Entry } from '@domain/checkins/types';

const entry: Entry = {
  date: '2026-10-04',
  slot: 'morning',
  mood: 4,
  note: 'slept well',
  recordedAt: '2026-10-04T08:00:00.000Z',
  sleep: { hours: 8 },
};

describe('check-in drafts', () => {
  it('a blank form is not a draft, and typing makes one', () => {
    const blank = draftOf(undefined);
    expect(isDraftChanged(undefined, blank, true)).toBe(false);
    expect(isDraftChanged(undefined, { ...blank, note: 'hmm' }, true)).toBe(true);
    expect(isDraftChanged(undefined, { ...blank, mood: 2 }, true)).toBe(true);
  });

  it('matches the saved check-in, ignoring spaces around the note', () => {
    const same: Draft = { ...draftOf(entry), note: ' slept well ' };
    expect(isDraftChanged(entry, same, true)).toBe(false);
    expect(isDraftChanged(entry, { ...same, mood: 5 }, true)).toBe(true);
  });

  it('ignores sleep outside the morning', () => {
    const d: Draft = { ...draftOf(entry), sleep: { hours: 5 } };
    expect(isDraftChanged(entry, d, true)).toBe(true);
    expect(isDraftChanged(entry, d, false)).toBe(false);
  });

  it('parses what it stored and rejects the rest', () => {
    const d: Draft = {
      mood: 3,
      note: 'x',
      habits: { doses: { a: { count: 2 } }, did: [] },
      sleep: { hours: 6 },
    };
    expect(parseDraft(JSON.parse(JSON.stringify(d)))).toEqual(d);
    expect(parseDraft({ mood: 9, note: '' })).toBeNull();
    expect(parseDraft({ mood: null, note: 4 })).toBeNull();
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft({ mood: null, note: '' })).toEqual(draftOf(undefined));
  });
});
