import { describe, expect, it } from '@jest/globals';

import { offersBreathing } from '@domain/checkins/moments';
import { burstEmojis, VOICES } from '@ui/voices/voices';
import { greetingFor, streakLabel } from '@ui/i18n/greetings';
import { currentStreak, weeklyStats } from '@domain/checkins/stats';
import { Entry } from '@domain/checkins/types';

const entry = (date: string, slot: Entry['slot'] = 'morning', unlocks?: number): Entry => ({
  date,
  slot,
  mood: 3,
  recordedAt: `${date}T08:00:00.000Z`,
  ...(unlocks === undefined ? {} : { unlocks, unlocksFrom: `${date}T06:00:00.000Z` }),
});

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const entries = [
      entry('2026-09-29'),
      entry('2026-09-30'),
      entry('2026-10-01'),
      entry('2026-10-01', 'evening'),
    ];
    expect(currentStreak(entries, '2026-10-01')).toBe(3);
  });

  it('keeps yesterday’s streak alive until today is over', () => {
    expect(currentStreak([entry('2026-09-29'), entry('2026-09-30')], '2026-10-01')).toBe(2);
  });

  it('breaks on a missed day', () => {
    expect(currentStreak([entry('2026-09-28'), entry('2026-10-01')], '2026-10-01')).toBe(1);
    expect(currentStreak([entry('2026-09-28')], '2026-10-01')).toBe(0);
  });

  it('only labels streaks of two days or more', () => {
    expect(streakLabel(1)).toBeNull();
    expect(streakLabel(4)).toBe('🔥 4-day streak');
  });
});

describe('moments', () => {
  it('celebrates good moods and comforts low ones', () => {
    expect(burstEmojis(VOICES.plain, 5)).toEqual(['😄', '✨', '🎉', '💛']);
    expect(burstEmojis(VOICES.plain, 3)).toEqual(['✨', '🌱']);
    expect(burstEmojis(VOICES.laoTzu, 5)[0]).toBe('🪷');
    expect(burstEmojis(VOICES.laoTzu, 2)).toEqual([]);
    expect(offersBreathing(2)).toBe(true);
    expect(offersBreathing(3)).toBe(false);
  });

  it('greets by time slot', () => {
    expect(greetingFor('evening').text).toBe('Good evening');
  });
});

describe('unlock averages per slot', () => {
  it('averages only check-ins that have a count', () => {
    const stats = weeklyStats(
      [
        entry('2026-09-30', 'morning', 10),
        entry('2026-10-01', 'morning', 20),
        entry('2026-10-01', 'evening'),
      ],
      '2026-10-01',
    );
    expect(stats.slotUnlockAverages).toEqual({ morning: 15, afternoon: null, evening: null });
  });
});
