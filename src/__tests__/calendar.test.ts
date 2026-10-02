import { describe, expect, it } from '@jest/globals';

import {
  canShowMonth,
  checkInDays,
  earliestDay,
  isEditable,
  isLocked,
  isVisible,
  monthGrid,
  monthOf,
  shiftMonth,
  summarizeDay,
} from '@domain/checkins/calendar';
import { Entry } from '@domain/checkins/types';

const today = '2026-10-01';
const entry = (date: string, mood: Entry['mood'], slot: Entry['slot'] = 'morning'): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T08:00:00.000Z`,
});

describe('calendar range', () => {
  it('reaches back six months', () => {
    expect(earliestDay(today)).toBe('2026-04-01');
    expect(earliestDay('2026-08-31')).toBe('2026-02-28'); // clamps to month end
    expect(isVisible('2026-04-01', today)).toBe(true);
    expect(isVisible('2026-03-31', today)).toBe(false);
    expect(isVisible('2026-10-02', today)).toBe(false);
  });

  it('only lets the last 7 days be edited', () => {
    expect(isEditable(today, today)).toBe(true);
    expect(isEditable('2026-09-25', today)).toBe(true);
    expect(isEditable('2026-09-24', today)).toBe(false);
    expect(isEditable('2026-10-02', today)).toBe(false);
  });

  it('navigates months within the range', () => {
    const now = monthOf(today);
    expect(now).toEqual({ year: 2026, month: 9 });
    expect(canShowMonth(shiftMonth(now, 1), today)).toBe(false);
    expect(canShowMonth(shiftMonth(now, -6), today)).toBe(true);
    expect(canShowMonth(shiftMonth(now, -7), today)).toBe(false);
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe('month grid', () => {
  it('lays out Monday-first weeks with blanks', () => {
    const grid = monthGrid({ year: 2026, month: 9 }); // October 2026 starts on a Thursday
    expect(grid[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid[grid.length - 1].at(-1)).toBeNull();
  });

  it('handles a month starting on Monday and leap Februaries', () => {
    expect(monthGrid({ year: 2026, month: 5 })[0][0]).toBe('2026-06-01');
    expect(monthGrid({ year: 2028, month: 1 }).flat().filter(Boolean)).toHaveLength(29);
  });
});

describe('day summary', () => {
  it('averages a day and rounds it to a mood for colour', () => {
    const entries = [
      entry(today, 2),
      entry(today, 3, 'afternoon'),
      entry(today, 3, 'evening'),
      entry('2026-09-30', 5),
    ];
    expect(summarizeDay(entries, today)).toEqual({ count: 3, average: 8 / 3, mood: 3 });
    expect(summarizeDay(entries, '2026-09-29')).toEqual({ count: 0, average: null, mood: null });
  });
});

describe('check-in days', () => {
  it('shows yesterday, today and a locked tomorrow', () => {
    expect(checkInDays('2026-10-01')).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
    expect(isLocked('2026-10-02', '2026-10-01')).toBe(true);
    expect(isLocked('2026-10-01', '2026-10-01')).toBe(false);
  });

  it('adds a day opened from the calendar while it can still be edited', () => {
    expect(checkInDays('2026-10-01', '2026-09-27')).toEqual([
      '2026-09-27',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
    expect(checkInDays('2026-10-01', '2026-09-30')).toHaveLength(3);
    expect(checkInDays('2026-10-01', '2026-09-01')).toHaveLength(3);
  });
});
