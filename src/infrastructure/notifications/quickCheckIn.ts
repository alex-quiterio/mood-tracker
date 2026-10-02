import type { NotificationResponse } from 'expo-notifications';

import { SLOTS, Slot } from '@domain/checkins/types';
import { QuickMood, REMINDER_KIND, parseQuickAction } from '@domain/reminders/quickCheckIn';
import { localDate } from '@domain/shared/dates';

export type QuickCheckIn = { mood: QuickMood; slot: Slot; date: string };

/**
 * The check-in behind a tap on one of a reminder's mood buttons, or null for any other
 * response (a plain tap, the practice bell, a reminder scheduled before the buttons existed).
 * The date is the day the reminder arrived, so a late tap still lands on its own day.
 */
export function quickCheckInFrom(response: NotificationResponse | null | undefined): QuickCheckIn | null {
  if (!response) return null;
  const mood = parseQuickAction(response.actionIdentifier);
  const data = response.notification.request.content.data;
  if (mood === null || data?.kind !== REMINDER_KIND || !SLOTS.includes(data.slot as Slot)) return null;
  // The notification's date may be in seconds or milliseconds depending on the platform.
  const sent = response.notification.date;
  const date = sent > 0 ? localDate(new Date(sent < 1e11 ? sent * 1000 : sent)) : localDate();
  return { mood, slot: data.slot as Slot, date };
}
