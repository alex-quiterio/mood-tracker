import { describe, expect, it } from '@jest/globals';

import {
  INSTEAD_POINTS,
  ZERO_POINTS,
  balanceDays,
  checkInPoints,
  changeFromLastWeek,
  formatPoints,
  verdictFor,
  weekBalance,
} from '@domain/habits/balance';
import { Entry } from '@domain/checkins/types';
import { PRESET_HABITS, weightOf } from '@domain/habits/habits';
import { changeText, verdictLabel } from '@ui/foundation/i18n/balance';
import { weeklyStats } from '@domain/checkins/stats';
import { buildReflectionPrompt } from '@ui/features/reflection/prompt';
import { VOICES } from '@ui/foundation/voices/voices';

const today = '2026-10-01';
const entry = (date: string, habits: Entry['habits'], slot: Entry['slot'] = 'morning'): Entry => ({
  date,
  slot,
  mood: 3,
  recordedAt: `${date}T08:00:00.000Z`,
  habits,
});

describe('check-in points', () => {
  it('weigh doses as heavy and zeros, good habits and instead notes as light', () => {
    const log = {
      doses: { cigarettes: { count: 3 }, drinks: { count: 0 } },
      did: ['walk', 'friend'],
      instead: 'called my sister',
    };
    // heavy: 3 × 1 = 3 · light: zero drinks 1 + walk 2 + friend 3 + instead 2 = 8
    expect(checkInPoints(log, PRESET_HABITS)).toEqual({ light: 8, heavy: 3 });
    expect(ZERO_POINTS + 2 + 3 + INSTEAD_POINTS).toBe(8);
  });

  it('give a small bonus for extra options, capped', () => {
    const log = (n: number) => ({
      doses: {},
      did: ['making'],
      chosen: { making: ['cooking', 'drawing', 'dancing', 'music'].slice(0, n) },
    });
    expect(checkInPoints(log(1), PRESET_HABITS).light).toBe(2);
    expect(checkInPoints(log(2), PRESET_HABITS).light).toBe(3);
    expect(checkInPoints(log(4), PRESET_HABITS).light).toBe(4);
  });

  it('still count archived habits so history keeps its score', () => {
    const habits = PRESET_HABITS.map((h) => ({ ...h, archived: true }));
    expect(checkInPoints({ doses: { cigarettes: { count: 2 } }, did: [] }, habits)).toEqual({
      light: 0,
      heavy: 2,
    });
  });

  it('ignore unknown habits and missing logs', () => {
    expect(checkInPoints({ doses: { gone: { count: 5 } }, did: ['gone'] }, PRESET_HABITS)).toEqual({
      light: 0,
      heavy: 0,
    });
    expect(checkInPoints(undefined, PRESET_HABITS)).toEqual({ light: 0, heavy: 0 });
  });

  it('use default weights when none are set', () => {
    expect(weightOf({ id: 'x', name: 'X', emoji: '•', kind: 'reduce', unit: 'x' })).toBe(1);
    expect(weightOf({ id: 'y', name: 'Y', emoji: '•', kind: 'grow', unit: '' })).toBe(2);
  });
});

describe('week balance', () => {
  const entries = [
    entry('2026-09-30', { doses: { cigarettes: { count: 4 } }, did: [] }),
    entry('2026-09-30', { doses: { cigarettes: { count: 0 } }, did: ['walk'] }, 'evening'),
    entry(today, { doses: {}, did: ['friend'], instead: 'tea' }),
    entry('2026-09-22', { doses: { drinks: { count: 3 } }, did: [] }), // the week before
    entry('2026-09-26', { doses: { drinks: { count: 5 } }, did: [] }), // last Saturday: not yet this week
  ];

  it('adds up Monday to Sunday and compares with the same days of last week', () => {
    const week = weekBalance(entries, PRESET_HABITS, today);
    expect(week.days.map((d) => d.date)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(week.days[2]).toMatchObject({ light: 3, heavy: 4, net: -1, logged: true });
    expect(week.days[3]).toMatchObject({ light: 5, heavy: 0, net: 5 });
    expect(week.days[4]).toMatchObject({ logged: false });
    expect(week).toMatchObject({ light: 8, heavy: 4, net: 4, previousNet: -6 });
    expect(week.verdict).toEqual({ kind: 'leaningLight', emoji: '🌱' });
  });

  it('marks unlogged days and has no comparison without last week', () => {
    const days = balanceDays([], PRESET_HABITS, ['2026-10-01']);
    expect(days[0]).toEqual({ date: '2026-10-01', light: 0, heavy: 0, net: 0, logged: false });
    expect(weekBalance([], PRESET_HABITS, today)).toMatchObject({ previousNet: null, verdict: null });
  });
});

describe('words', () => {
  it('are kind at every tilt', () => {
    expect(verdictFor(9, 1)?.kind).toBe('flourishing');
    expect(verdictFor(5, 5)?.kind).toBe('inBalance');
    expect(verdictLabel(verdictFor(9, 1)!)).toBe('Flourishing');
    expect(verdictLabel(verdictFor(1, 9)!)).toMatch(/every light point counts/);
    expect(verdictLabel(verdictFor(1, 9)!, 'pt-PT')).toMatch(/cada ponto leve conta/);
    expect(verdictFor(0, 0)).toBeNull();
  });

  it('frame the comparison gently', () => {
    expect(changeText(changeFromLastWeek(4, -6))).toBe('+10 lighter than last week');
    expect(changeText(changeFromLastWeek(-2, 3))).toBe('-5 vs last week — tomorrow is a fresh start');
    expect(changeText(changeFromLastWeek(1, 1))).toBe('Same as last week');
    expect(changeText(changeFromLastWeek(1, null))).toBeNull();
    expect(formatPoints(3)).toBe('+3');
    expect(formatPoints(-2)).toBe('-2');
  });
});

describe('habits in the Claude prompt', () => {
  const withHabits = [
    entry(today, {
      doses: { cigarettes: { count: 2, approx: true } },
      did: ['walk'],
      instead: 'tea and a book',
    }),
  ];

  it('mention money kept when usual amounts are set', () => {
    const habits = PRESET_HABITS.map((h) => (h.id === 'cigarettes' ? { ...h, usualPerDay: 10 } : h));
    const prompt = buildReflectionPrompt(weeklyStats(withHabits, today), VOICES.plain, habits);
    expect(prompt).toContain('Money kept by having less than usual: €4.40.');
  });

  it('stay out unless you turn them on', () => {
    const prompt = buildReflectionPrompt(weeklyStats(withHabits, today));
    expect(prompt).not.toMatch(/cigarettes|habit|tea and a book/);
  });

  it('come with doses, good habits, instead notes and the balance when on', () => {
    const prompt = buildReflectionPrompt(weeklyStats(withHabits, today), VOICES.plain, PRESET_HABITS);
    expect(prompt).toContain('habits: about 2 cigarettes; did: walk; instead: "tea and a book"');
    expect(prompt).toContain('Balance: 4 light points');
    expect(prompt).toContain('2 heavy points');
    expect(prompt).toContain('- Cigarettes: none in 0 of 1 check-ins, 2 cigarettes in all');
    expect(prompt).toContain('- Walk: done in 1 of 1 check-ins');
    expect(prompt).toContain('What I did instead: "tea and a book".');
    expect(prompt).toContain('suggest one small swap');
    expect(prompt).toContain('my habits and what I did instead');
  });
});
