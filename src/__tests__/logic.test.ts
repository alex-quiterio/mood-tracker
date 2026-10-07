import { describe, expect, it } from '@jest/globals';

import { PRESET_HABITS } from '@domain/habits/habits';

import { ExportError, parseExport, serializeExport } from '@domain/checkins/exportFormat';
import {
  addDays,
  isValidDate,
  lastNDays,
  localDate,
  slotForTime,
  weekOf,
  weekSoFar,
  weekStart,
} from '@domain/shared/dates';
import { NOTE_MAX_LENGTH, mergeEntries, parseEntry, saveTimes, upsertEntry } from '@domain/checkins/entries';
import { buildReflectionPrompt } from '@ui/features/reflection/prompt';
import { firstWeekStart, thisWeekStats, weekShownUntil, weeklyStats } from '@domain/checkins/stats';
import { parseUrges } from '@domain/habits/urges';
import { Entry } from '@domain/checkins/types';

const entry = (
  date: string,
  slot: Entry['slot'],
  mood: Entry['mood'],
  recordedAt = `${date}T10:00:00.000Z`,
  note?: string,
): Entry => ({
  date,
  slot,
  mood,
  recordedAt,
  ...(note ? { note } : {}),
});

describe('dates', () => {
  it('uses the local date, not UTC', () => {
    expect(localDate(new Date(2026, 8, 30, 23, 45))).toBe('2026-09-30');
    expect(localDate(new Date(2026, 9, 1, 0, 5))).toBe('2026-10-01');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('lists the last 7 days oldest first, ending today', () => {
    expect(lastNDays(7, '2026-10-01')).toEqual([
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ]);
  });

  it('maps time of day to slots', () => {
    expect(slotForTime(new Date(2026, 0, 1, 0, 0))).toBe('morning');
    expect(slotForTime(new Date(2026, 0, 1, 11, 59))).toBe('morning');
    expect(slotForTime(new Date(2026, 0, 1, 12, 0))).toBe('afternoon');
    expect(slotForTime(new Date(2026, 0, 1, 17, 59))).toBe('afternoon');
    expect(slotForTime(new Date(2026, 0, 1, 18, 0))).toBe('evening');
  });

  it('validates dates', () => {
    expect(isValidDate('2026-10-01')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-1-01')).toBe(false);
  });
});

describe('entries', () => {
  it('replaces an entry for the same date and slot', () => {
    let entries = upsertEntry([], entry('2026-10-01', 'morning', 2));
    entries = upsertEntry(entries, entry('2026-10-01', 'evening', 4));
    entries = upsertEntry(entries, entry('2026-10-01', 'morning', 5));
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => [e.slot, e.mood])).toEqual([
      ['morning', 5],
      ['evening', 4],
    ]);
  });

  it('merges imports keeping the newer entry per slot', () => {
    const existing = [entry('2026-10-01', 'morning', 2, '2026-10-01T09:00:00.000Z')];
    const incoming = [
      entry('2026-10-01', 'morning', 4, '2026-10-01T08:00:00.000Z'),
      entry('2026-09-30', 'evening', 3),
    ];
    const merged = mergeEntries(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(merged.find((e) => e.date === '2026-10-01')?.mood).toBe(2);
  });

  it('merges by the latest edit, not the first record', () => {
    const existing = [entry('2026-10-01', 'morning', 2, '2026-10-01T09:00:00.000Z')];
    const incoming = [
      {
        ...entry('2026-10-01', 'morning', 4, '2026-10-01T08:00:00.000Z'),
        updatedAt: '2026-10-01T10:00:00.000Z',
      },
    ];
    expect(mergeEntries(existing, incoming)[0].mood).toBe(4);
  });

  it('keeps the first record time when a check-in is saved again', () => {
    const now = new Date('2026-10-01T14:30:00Z');
    expect(saveTimes(undefined, now)).toEqual({ recordedAt: '2026-10-01T14:30:00.000Z' });
    const first = entry('2026-10-01', 'morning', 3, '2026-10-01T09:00:00.000Z');
    expect(saveTimes(first, now)).toEqual({
      recordedAt: '2026-10-01T09:00:00.000Z',
      updatedAt: '2026-10-01T14:30:00.000Z',
    });
  });

  it('reads the edit time and rejects a bad one', () => {
    const base = { date: '2026-10-01', slot: 'morning', mood: 3, recordedAt: '2026-10-01T09:00:00Z' };
    expect(parseEntry({ ...base, updatedAt: '2026-10-01T14:00:00Z' })?.updatedAt).toBe(
      '2026-10-01T14:00:00Z',
    );
    expect(parseEntry(base)).not.toHaveProperty('updatedAt');
    expect(parseEntry({ ...base, updatedAt: 'yesterday' })).toBeNull();
  });

  it('rejects invalid entries', () => {
    expect(
      parseEntry({ date: '2026-10-01', slot: 'night', mood: 3, recordedAt: '2026-10-01T10:00:00Z' }),
    ).toBeNull();
    expect(
      parseEntry({ date: '2026-10-01', slot: 'morning', mood: 6, recordedAt: '2026-10-01T10:00:00Z' }),
    ).toBeNull();
    expect(
      parseEntry({
        date: '2026-10-01',
        slot: 'morning',
        mood: 3,
        recordedAt: '2026-10-01T10:00:00Z',
        note: '  ',
      }),
    ).toEqual({
      date: '2026-10-01',
      slot: 'morning',
      mood: 3,
      recordedAt: '2026-10-01T10:00:00Z',
    });
  });
});

describe('weekly stats and prompt', () => {
  const entries = [
    entry('2026-09-24', 'morning', 1), // outside the window
    entry('2026-09-25', 'morning', 2),
    entry('2026-09-25', 'evening', 4, undefined, 'dinner with friends'),
    entry('2026-10-01', 'morning', 3),
  ];

  it('computes averages and completion over the last 7 days', () => {
    const stats = weeklyStats(entries, '2026-10-01');
    expect(stats.days).toHaveLength(7);
    expect(stats.logged).toBe(3);
    expect(stats.possible).toBe(21);
    expect(stats.slotAverages).toEqual({ morning: 2.5, afternoon: null, evening: 4 });
    expect(stats.overallAverage).toBe(3);
  });

  it('builds a plain-text reflection prompt', () => {
    const prompt = buildReflectionPrompt(weeklyStats(entries, '2026-10-01'));
    expect(prompt).toContain('2026-09-25 to 2026-10-01');
    expect(prompt).toContain('evening: 4/5 — "dinner with friends"');
    expect(prompt).toContain('afternoon: not logged');
    expect(prompt).toContain('Logged 3 of 21');
    expect(prompt).toContain('morning 2.5, afternoon –, evening 4.0; overall 3.0');
    expect(prompt).not.toContain('2026-09-24');
  });
});

describe('export format', () => {
  it('round-trips entries and habit definitions', () => {
    const entries = [entry('2026-10-01', 'morning', 3, undefined, 'ok')];
    expect(parseExport(serializeExport(entries, PRESET_HABITS))).toEqual({
      entries,
      habits: PRESET_HABITS,
      urges: [],
    });
  });

  it('still imports version 1 files, which have no habits', () => {
    const entries = [entry('2026-10-01', 'morning', 3)];
    const v1 = JSON.stringify({
      format: 'mood-tracker-export',
      version: 1,
      exportedAt: '2026-10-01T00:00:00Z',
      entries,
    });
    expect(parseExport(v1)).toEqual({ entries, habits: [], urges: [] });
  });

  it('rejects files that are not exports', () => {
    expect(() => parseExport('not json')).toThrow(new ExportError('notJson'));
    expect(() => parseExport('{"entries": []}')).toThrow(new ExportError('notExport'));
    expect(() =>
      parseExport(JSON.stringify({ format: 'mood-tracker-export', version: 1, entries: [{ date: 'x' }] })),
    ).toThrow(new ExportError('invalid'));
  });
});

describe('note length', () => {
  const base = { date: '2026-10-02', slot: 'evening', mood: 4, recordedAt: '2026-10-02T20:00:00.000Z' };

  it('keeps notes of a few paragraphs', () => {
    const note = 'a'.repeat(1500);
    expect(parseEntry({ ...base, note })?.note).toBe(note);
  });

  it('trims what goes past the limit', () => {
    expect(NOTE_MAX_LENGTH).toBe(2000);
    expect(parseEntry({ ...base, note: 'b'.repeat(2500) })?.note).toHaveLength(NOTE_MAX_LENGTH);
  });
});

describe('the current week', () => {
  // 1 October 2026 is a Thursday.
  it('runs Monday to Sunday', () => {
    expect(weekStart('2026-10-01')).toBe('2026-09-28');
    expect(weekStart('2026-09-28')).toBe('2026-09-28');
    expect(weekStart('2026-10-04')).toBe('2026-09-28');
    expect(weekOf('2026-10-01')).toEqual(lastNDays(7, '2026-10-04'));
    expect(weekSoFar('2026-10-01')).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']);
  });

  it('shows the whole week but only counts the days so far', () => {
    const entries = [entry('2026-09-27', 'morning', 1), entry('2026-09-28', 'morning', 4)];
    const stats = thisWeekStats(entries, '2026-10-01');
    expect(stats.days.map((d) => [d.date, d.future])).toEqual(
      weekOf('2026-10-01').map((date) => [date, date > '2026-10-01']),
    );
    expect(stats.logged).toBe(1);
    expect(stats.possible).toBe(12);
    expect(stats.overallAverage).toBe(4);
  });

  it('keeps days still to come out of the Claude prompt', () => {
    const prompt = buildReflectionPrompt(thisWeekStats([entry('2026-09-28', 'morning', 4)], '2026-10-01'));
    expect(prompt).toContain('2026-10-01');
    expect(prompt).not.toContain('2026-10-02');
  });
});

describe('earlier weeks', () => {
  it('go back as far as the week of the first check-in', () => {
    const entries = [entry('2026-09-17', 'morning', 3), entry('2026-10-01', 'morning', 4)];
    expect(firstWeekStart(entries, '2026-10-07')).toBe('2026-09-14');
    expect(firstWeekStart([], '2026-10-07')).toBe('2026-10-05');
  });

  it('are seen whole, while this week stops at today', () => {
    expect(weekShownUntil('2026-09-28', '2026-10-07')).toBe('2026-10-04');
    expect(weekShownUntil('2026-10-05', '2026-10-07')).toBe('2026-10-07');
    const stats = thisWeekStats(
      [entry('2026-09-30', 'morning', 4)],
      weekShownUntil('2026-09-28', '2026-10-07'),
    );
    expect(stats.possible).toBe(21);
    expect(stats.days.every((d) => !d.future)).toBe(true);
  });
});

describe('urges in the Claude prompt', () => {
  const entries = [entry('2026-10-05', 'morning', 3)];
  const urges = parseUrges([
    {
      date: '2026-10-05',
      habitId: 'drinks',
      outcome: 'passed',
      recordedAt: '2026-10-05T19:00:00',
      feelings: ['boredom', 'restlessness'],
    },
    {
      date: '2026-10-06',
      habitId: 'drinks',
      outcome: 'gaveIn',
      recordedAt: '2026-10-06T19:00:00',
      feelings: ['boredom'],
    },
    {
      date: '2026-09-30',
      habitId: 'drinks',
      outcome: 'passed',
      recordedAt: '2026-09-30T19:00:00',
      feelings: ['fear'],
    },
  ]);
  const stats = thisWeekStats(entries, '2026-10-07');

  it('lists the week’s urges with what was felt before', () => {
    const prompt = buildReflectionPrompt(stats, undefined, PRESET_HABITS, 'en', urges);
    expect(prompt).toContain('let it pass; felt before: restlessness, boredom');
    expect(prompt).toContain('had one; felt before: boredom');
    expect(prompt).toContain('What I felt before the urges: boredom ×2, restlessness.');
    expect(prompt).not.toContain('fear');
  });

  it('stays out unless habits are in the prompt', () => {
    expect(buildReflectionPrompt(stats, undefined, null, 'en', urges)).not.toContain('felt before');
  });
});
