import { describe, expect, it } from '@jest/globals';

import { PRESET_HABITS } from '@domain/habits/habits';

import { ExportError, parseExport, serializeExport } from '@domain/checkins/exportFormat';
import { addDays, isValidDate, lastNDays, localDate, slotForTime } from '@domain/shared/dates';
import { mergeEntries, parseEntry, upsertEntry } from '@domain/checkins/entries';
import { buildReflectionPrompt } from '@ui/reflection/prompt';
import { weeklyStats } from '@domain/checkins/stats';
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
    expect(parseExport(serializeExport(entries, PRESET_HABITS))).toEqual({ entries, habits: PRESET_HABITS });
  });

  it('still imports version 1 files, which have no habits', () => {
    const entries = [entry('2026-10-01', 'morning', 3)];
    const v1 = JSON.stringify({
      format: 'mood-tracker-export',
      version: 1,
      exportedAt: '2026-10-01T00:00:00Z',
      entries,
    });
    expect(parseExport(v1)).toEqual({ entries, habits: [] });
  });

  it('rejects files that are not exports', () => {
    expect(() => parseExport('not json')).toThrow(new ExportError('notJson'));
    expect(() => parseExport('{"entries": []}')).toThrow(new ExportError('notExport'));
    expect(() =>
      parseExport(JSON.stringify({ format: 'mood-tracker-export', version: 1, entries: [{ date: 'x' }] })),
    ).toThrow(new ExportError('invalid'));
  });
});
