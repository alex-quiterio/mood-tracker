import { SLOTS, Slot } from '@domain/checkins/types';

export type ClockTime = { hour: number; minute: number };
export type ReminderTimes = Record<Slot, ClockTime>;

/** Each reminder can move within its slot's window, inclusive. */
export const REMINDER_RANGES: Record<Slot, { from: ClockTime; to: ClockTime }> = {
  morning: { from: { hour: 6, minute: 0 }, to: { hour: 9, minute: 0 } },
  afternoon: { from: { hour: 12, minute: 0 }, to: { hour: 15, minute: 0 } },
  evening: { from: { hour: 17, minute: 0 }, to: { hour: 22, minute: 0 } },
};

export const DEFAULT_REMINDER_TIMES: ReminderTimes = {
  morning: { hour: 9, minute: 0 },
  afternoon: { hour: 14, minute: 0 },
  evening: { hour: 20, minute: 0 },
};

/** The − / + buttons move a reminder by this much. */
export const REMINDER_STEP_MINUTES = 15;

const toMinutes = (t: ClockTime) => t.hour * 60 + t.minute;
const fromMinutes = (m: number): ClockTime => ({ hour: Math.floor(m / 60), minute: m % 60 });

export const formatTime = ({ hour, minute }: ClockTime) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

export const formatRange = (slot: Slot) =>
  `${formatTime(REMINDER_RANGES[slot].from)}–${formatTime(REMINDER_RANGES[slot].to)}`;

/** Snaps a time to the 15-minute grid and into the slot's window. */
export function clampReminderTime(slot: Slot, time: ClockTime): ClockTime {
  const { from, to } = REMINDER_RANGES[slot];
  const snapped = Math.round(toMinutes(time) / REMINDER_STEP_MINUTES) * REMINDER_STEP_MINUTES;
  return fromMinutes(Math.min(toMinutes(to), Math.max(toMinutes(from), snapped)));
}

export function shiftReminderTime(slot: Slot, time: ClockTime, deltaMinutes: number): ClockTime {
  return clampReminderTime(slot, fromMinutes(toMinutes(time) + deltaMinutes));
}

/** Whether the − or + button can still move the time. */
export function canShift(slot: Slot, time: ClockTime, direction: -1 | 1): boolean {
  const limit = direction < 0 ? REMINDER_RANGES[slot].from : REMINDER_RANGES[slot].to;
  return direction < 0 ? toMinutes(time) > toMinutes(limit) : toMinutes(time) < toMinutes(limit);
}

/** Stored times, with anything missing or invalid replaced by the default and the rest clamped. */
export function parseReminderTimes(value: unknown): ReminderTimes {
  const stored = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const result = { ...DEFAULT_REMINDER_TIMES };
  for (const slot of SLOTS) {
    const t = stored[slot] as Partial<ClockTime> | undefined;
    if (Number.isInteger(t?.hour) && Number.isInteger(t?.minute)) {
      result[slot] = clampReminderTime(slot, { hour: t!.hour!, minute: t!.minute! });
    }
  }
  return result;
}
