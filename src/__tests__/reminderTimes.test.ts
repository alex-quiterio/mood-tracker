import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_REMINDER_TIMES,
  REMINDER_RANGES,
  canShift,
  clampReminderTime,
  formatRange,
  formatTime,
  parseReminderTimes,
  shiftReminderTime,
} from '@domain/reminders/times';
import { reminderMessage } from '@ui/i18n/reminders';
import { SLOTS } from '@domain/checkins/types';

const t = (hour: number, minute = 0) => ({ hour, minute });

describe('reminder windows', () => {
  it('are the agreed ranges, and the defaults sit inside them', () => {
    expect(formatRange('morning')).toBe('06:00–09:00');
    expect(formatRange('afternoon')).toBe('12:00–15:00');
    expect(formatRange('evening')).toBe('17:00–22:00');
    for (const slot of SLOTS)
      expect(clampReminderTime(slot, DEFAULT_REMINDER_TIMES[slot])).toEqual(DEFAULT_REMINDER_TIMES[slot]);
  });

  it('clamps to the window, inclusive at both ends', () => {
    expect(clampReminderTime('morning', t(5, 30))).toEqual(t(6));
    expect(clampReminderTime('morning', t(9))).toEqual(t(9));
    expect(clampReminderTime('morning', t(9, 15))).toEqual(t(9));
    expect(clampReminderTime('evening', t(23))).toEqual(t(22));
    expect(clampReminderTime('afternoon', t(12))).toEqual(t(12));
  });

  it('snaps to 15-minute steps', () => {
    expect(clampReminderTime('evening', t(20, 7))).toEqual(t(20));
    expect(clampReminderTime('evening', t(20, 8))).toEqual(t(20, 15));
  });

  it('shifts by steps and stops at the edges', () => {
    expect(shiftReminderTime('morning', t(8, 45), 15)).toEqual(t(9));
    expect(shiftReminderTime('morning', t(9), 15)).toEqual(t(9));
    expect(shiftReminderTime('afternoon', t(12), -15)).toEqual(t(12));
    expect(shiftReminderTime('evening', t(17, 45), 15)).toEqual(t(18));
  });

  it('knows when a button can still move the time', () => {
    expect(canShift('morning', t(6), -1)).toBe(false);
    expect(canShift('morning', t(6), 1)).toBe(true);
    expect(canShift('evening', t(22), 1)).toBe(false);
    expect(canShift('evening', t(21, 45), 1)).toBe(true);
  });

  it('keeps every range on whole hours', () => {
    for (const slot of SLOTS) {
      expect(REMINDER_RANGES[slot].from.minute).toBe(0);
      expect(REMINDER_RANGES[slot].to.minute).toBe(0);
    }
  });
});

describe('stored reminder times', () => {
  it('fall back to defaults and clamp what was stored', () => {
    expect(parseReminderTimes(undefined)).toEqual(DEFAULT_REMINDER_TIMES);
    expect(parseReminderTimes({ morning: t(7, 30), evening: t(23, 0), afternoon: { hour: 'x' } })).toEqual({
      morning: t(7, 30),
      afternoon: DEFAULT_REMINDER_TIMES.afternoon,
      evening: t(22),
    });
  });
});

describe('reminder text', () => {
  it('formats times', () => {
    expect(formatTime(t(6, 5))).toBe('06:05');
  });

  it('uses the name when there is one', () => {
    expect(reminderMessage('morning', 'Alex')).toEqual({
      title: 'Morning check-in',
      body: 'How are you feeling, Alex?',
    });
    expect(reminderMessage('evening', '')).toEqual({
      title: 'Evening check-in',
      body: 'How are you feeling right now?',
    });
  });
});
