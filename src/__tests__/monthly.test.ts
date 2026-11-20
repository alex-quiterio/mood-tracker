import { describe, expect, it } from '@jest/globals';

import { MAX_RANGE_DAYS, clampRange, monthReview, periodReview } from '@domain/checkins/monthly';
import { daysFrom } from '@domain/shared/dates';
import { Entry } from '@domain/checkins/types';
import { PRESET_HABITS } from '@domain/habits/habits';
import { spent, totalSpent } from '@domain/habits/insights';
import { parseQuickAction, quickEntry } from '@domain/reminders/quickCheckIn';
import { parseSettings } from '@domain/settings/settings';
import { buildMonthlyPrompt } from '@ui/features/reflection/monthPrompt';

const today = '2026-10-01'; // a Thursday
const entry = (date: string, slot: Entry['slot'], mood: Entry['mood'], habits?: Entry['habits']): Entry => ({
  date,
  slot,
  mood,
  recordedAt: `${date}T10:00:00.000Z`,
  ...(habits ? { habits } : {}),
});
const drinks = PRESET_HABITS.find((h) => h.id === 'drinks')!; // €3 each

describe('monthReview', () => {
  const entries = [
    entry('2026-09-28', 'morning', 2), // Monday
    entry('2026-09-21', 'morning', 2),
    entry('2026-09-26', 'evening', 5), // Saturday
    entry('2026-09-19', 'evening', 5),
    entry('2026-08-01', 'morning', 1), // outside the 30 days
  ];

  it('finds the best and hardest weekday and the lowest slot', () => {
    const r = monthReview(entries, PRESET_HABITS, today);
    expect(r.logged).toBe(4);
    expect(r.bestWeekday?.weekday).toBe(6);
    expect(r.hardestWeekday?.weekday).toBe(1);
    expect(r.lowestSlot?.slot).toBe('morning');
  });

  it('names nothing without enough check-ins', () => {
    const r = monthReview([entry('2026-09-28', 'morning', 2)], PRESET_HABITS, today);
    expect(r.bestWeekday).toBeNull();
    expect(r.hardestWeekday).toBeNull();
    expect(r.lowestSlot).toBeNull();
  });

  it('compares mood on days with and without a habit', () => {
    const dry = { doses: { drinks: { count: 0 } }, did: [] };
    const wet = { doses: { drinks: { count: 3 } }, did: [] };
    const r = monthReview(
      [entry('2026-09-28', 'evening', 5, dry), entry('2026-09-29', 'evening', 2, wet)],
      PRESET_HABITS,
      today,
    );
    expect(r.habitMoods).toEqual([{ habit: drinks, none: 5, some: 2 }]);
  });

  it('leaves habits out of the prompt unless asked', () => {
    const dry = { doses: { drinks: { count: 0 } }, did: [] };
    const wet = { doses: { drinks: { count: 3 } }, did: [] };
    const list = [entry('2026-09-28', 'evening', 5, dry), entry('2026-09-29', 'evening', 2, wet)];
    const review = monthReview(list, PRESET_HABITS, today);
    expect(buildMonthlyPrompt(review, list, undefined, null)).not.toContain('drinks');
    expect(buildMonthlyPrompt(review, list, undefined, PRESET_HABITS)).toContain('no drinks');
  });

  it("shows each check-in's habits and the month's totals", () => {
    const list = [
      entry('2026-09-28', 'evening', 5, { doses: { drinks: { count: 0 } }, did: ['walk'] }),
      entry('2026-09-29', 'afternoon', 3, { doses: { drinks: { count: 2, approx: true } }, did: [] }),
      entry('2026-09-29', 'evening', 2, { doses: { drinks: { count: 3 } }, did: ['walk'] }),
      entry('2026-08-01', 'evening', 2, { doses: { drinks: { count: 9 } }, did: [] }), // outside the 30 days
    ];
    const prompt = buildMonthlyPrompt(
      monthReview(list, PRESET_HABITS, today),
      list,
      undefined,
      PRESET_HABITS,
    );
    expect(prompt).toContain('afternoon 3/5 [habits: about 2 drinks]');
    expect(prompt).toContain('Drinks: 5 drinks in all over 3 check-ins (1.7 per check-in)');
    expect(prompt).toContain('Walk: done in 2 of 3 check-ins');
    expect(prompt).not.toContain('Cigarettes:');
    expect(buildMonthlyPrompt(monthReview(list, PRESET_HABITS, today), list, undefined, null)).not.toContain(
      'Habit totals',
    );
  });
});

describe('periodReview', () => {
  const entries = [
    entry('2026-07-31', 'morning', 1),
    entry('2026-08-01', 'morning', 4),
    entry('2026-08-03', 'evening', 3),
    entry('2026-08-04', 'morning', 5),
  ];

  it('covers exactly the days picked, both ends included', () => {
    const review = periodReview(entries, [], '2026-08-01', '2026-08-03');
    expect(review.days).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
    expect(review.logged).toBe(2);
    expect(review.possible).toBe(9);
    expect(review.overallAverage).toBe(3.5);
  });

  it('matches monthReview over the last 30 days', () => {
    expect(periodReview(entries, [], '2026-09-02', today)).toEqual(monthReview(entries, [], today));
  });

  it('gets its own intro and question in the prompt', () => {
    const review = periodReview(entries, [], '2026-08-01', '2026-08-03');
    const prompt = buildMonthlyPrompt(review, entries, undefined, null, 'en', [], 'range');
    expect(prompt).toContain('2026-08-01 to 2026-08-03, 3 days');
    expect(prompt).toContain('reflect on this stretch of time');
    expect(prompt).not.toContain('past month');
    expect(prompt).not.toContain('2026-07-31');
  });
});

describe('clampRange', () => {
  it('ends by today and never runs backwards', () => {
    expect(clampRange('2026-09-20', '2026-10-05', today)).toEqual({ from: '2026-09-20', to: today });
    expect(clampRange('2026-09-25', '2026-09-20', today, 'to')).toEqual({
      from: '2026-09-20',
      to: '2026-09-20',
    });
    expect(clampRange('2026-09-25', '2026-09-20', today, 'from')).toEqual({
      from: '2026-09-25',
      to: '2026-09-25',
    });
  });

  it('spans at most a year, keeping the end that was moved', () => {
    const long = clampRange('2024-01-01', today, today, 'to');
    expect(daysFrom(long.from, long.to)).toHaveLength(MAX_RANGE_DAYS);
    expect(long.to).toBe(today);
    const fromKept = clampRange('2024-01-01', today, today, 'from');
    expect(fromKept.from).toBe('2024-01-01');
    expect(daysFrom(fromKept.from, fromKept.to)).toHaveLength(MAX_RANGE_DAYS);
  });
});

describe('spending', () => {
  const log = (count: number) => ({ doses: { drinks: { count } }, did: [] });
  const entries = [
    entry('2026-09-29', 'afternoon', 3, log(2)),
    entry('2026-09-29', 'evening', 3, log(1)),
    entry('2026-09-01', 'evening', 3, log(4)),
  ];

  it('is doses × price, within the range', () => {
    expect(spent(entries, drinks)).toBe(21);
    expect(spent(entries, drinks, '2026-09-25', today)).toBe(9);
    expect(totalSpent(entries, PRESET_HABITS, '2026-09-25', today)).toBe(9);
  });

  it('is zero without a price, and off by default', () => {
    expect(spent(entries, { ...drinks, pricePerDose: undefined })).toBe(0);
    expect(parseSettings({}).showSpending).toBe(false);
  });

  it('keeps money on unless it was turned off', () => {
    expect(parseSettings({}).showMoney).toBe(true);
    expect(parseSettings({ showMoney: false }).showMoney).toBe(false);
  });
});

describe('quick check-in', () => {
  it('reads the mood buttons only', () => {
    expect(parseQuickAction('mood1')).toBe(1);
    expect(parseQuickAction('mood5')).toBe(5);
    expect(parseQuickAction('mood2')).toBeNull();
    expect(parseQuickAction('expo.modules.notifications.actions.DEFAULT')).toBeNull();
  });

  it('keeps what an existing check-in already has', () => {
    const existing = { ...entry('2026-10-01', 'morning', 2), note: 'slept badly' };
    const next = quickEntry(existing, '2026-10-01', 'morning', 5, new Date('2026-10-01T09:00:00Z'));
    expect(next).toMatchObject({
      mood: 5,
      note: 'slept badly',
      recordedAt: existing.recordedAt,
      updatedAt: '2026-10-01T09:00:00.000Z',
    });
  });

  it('records a new check-in without marking it updated', () => {
    const next = quickEntry(undefined, '2026-10-01', 'morning', 3, new Date('2026-10-01T09:00:00Z'));
    expect(next.recordedAt).toBe('2026-10-01T09:00:00.000Z');
    expect(next.updatedAt).toBeUndefined();
  });
});
