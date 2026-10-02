import { describe, expect, it } from '@jest/globals';

import { monthReview } from '@domain/checkins/monthly';
import { Entry } from '@domain/checkins/types';
import { PRESET_HABITS } from '@domain/habits/habits';
import { spent, totalSpent } from '@domain/habits/insights';
import { parseQuickAction, quickEntry } from '@domain/reminders/quickCheckIn';
import { parseSettings } from '@domain/settings/settings';
import { buildMonthlyPrompt } from '@ui/reflection/monthPrompt';

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
