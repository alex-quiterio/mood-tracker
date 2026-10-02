import { describe, expect, it } from '@jest/globals';

import { currentStreak, streakHistory } from '@domain/checkins/stats';
import { Entry } from '@domain/checkins/types';
import { Urge } from '@domain/habits/urges';
import { XP, levelFor, titleIndex, totalXp, xpCounts, xpForLevel } from '@domain/progress/xp';
import { lastNDays } from '@domain/shared/dates';
import { voiceFor } from '@ui/foundation/voices/voices';
import { VOICE_IDS } from '@domain/voices/voices';

const entry = (date: string, slot: Entry['slot'] = 'morning', extra: Partial<Entry> = {}): Entry => ({
  date,
  slot,
  mood: 3,
  recordedAt: `${date}T08:00:00.000Z`,
  ...extra,
});
const days = (dates: string[]) => dates.map((d) => entry(d));

describe('forgiving streaks', () => {
  it('lets one missed day a week rest', () => {
    // 28 · (29 rest) · 30 · 1
    expect(currentStreak(days(['2026-09-28', '2026-09-30', '2026-10-01']), '2026-10-01')).toBe(3);
  });

  it('starts over after two missed days in a row', () => {
    expect(currentStreak(days(['2026-09-27', '2026-09-30', '2026-10-01']), '2026-10-01')).toBe(2);
  });

  it('starts over after a second miss within a week', () => {
    // 24 · (25 rest) · 26 · (27 second miss) · 28 · 29
    expect(currentStreak(days(['2026-09-24', '2026-09-26', '2026-09-28', '2026-09-29']), '2026-09-29')).toBe(
      2,
    );
  });

  it('allows another rest day a week after the last', () => {
    const dates = lastNDays(16, '2026-10-01').filter((d) => d !== '2026-09-17' && d !== '2026-09-24');
    expect(currentStreak(days(dates), '2026-10-01')).toBe(14);
  });

  it('keeps yesterday open as a rest day until today is over', () => {
    expect(currentStreak(days(['2026-09-28', '2026-09-29']), '2026-10-01')).toBe(2);
    expect(currentStreak(days(['2026-09-28', '2026-09-29']), '2026-10-02')).toBe(0);
  });

  it('counts each full week of a run', () => {
    expect(streakHistory(days(lastNDays(15, '2026-10-01')), '2026-10-01')).toEqual({ current: 15, weeks: 2 });
    expect(streakHistory([], '2026-10-01')).toEqual({ current: 0, weeks: 0 });
  });
});

describe('XP', () => {
  const urges: Urge[] = [
    { date: '2026-10-01', habitId: 'alcohol', outcome: 'passed', recordedAt: '2026-10-01T18:00:00.000Z' },
    { date: '2026-10-01', habitId: 'alcohol', outcome: 'gaveIn', recordedAt: '2026-10-01T20:00:00.000Z' },
  ];
  const entries = [
    entry('2026-10-01', 'morning', { note: 'slept well' }),
    entry('2026-10-01', 'afternoon', { mood: 1 }),
    entry('2026-10-01', 'evening', { habits: { doses: { alcohol: { count: 0 } }, did: [] } }),
    entry('2026-09-30', 'morning'),
  ];

  it('counts every source, whatever the mood', () => {
    const counts = xpCounts(entries, urges, '2026-10-01');
    expect(counts).toEqual({ checkIn: 4, note: 1, fullDay: 1, win: 1, urgePassed: 1, streakWeek: 0 });
    expect(totalXp(counts)).toBe(4 * XP.checkIn + XP.note + XP.fullDay + XP.win + XP.urgePassed);
  });

  it('gives a low mood the same XP as a good one', () => {
    const low = totalXp(xpCounts([entry('2026-10-01', 'morning', { mood: 1 })], [], '2026-10-01'));
    const high = totalXp(xpCounts([entry('2026-10-01', 'morning', { mood: 5 })], [], '2026-10-01'));
    expect(low).toBe(high);
  });
});

describe('levels', () => {
  it('asks a little more for each level', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });

  it('places XP in a level, with progress towards the next', () => {
    expect(levelFor(0)).toEqual({ level: 1, xp: 0, intoLevel: 0, levelSize: 100 });
    expect(levelFor(350)).toEqual({ level: 3, xp: 350, intoLevel: 50, levelSize: 300 });
  });

  it('gives each title two levels and keeps the last one', () => {
    expect([1, 2, 3, 15, 40].map((l) => titleIndex(l, 8))).toEqual([0, 0, 1, 7, 7]);
  });

  it('has eight titles for every voice in both languages', () => {
    for (const id of VOICE_IDS) {
      expect(voiceFor(id, 'en').levels).toHaveLength(8);
      expect(voiceFor(id, 'pt-PT').levels).toHaveLength(8);
    }
  });
});
