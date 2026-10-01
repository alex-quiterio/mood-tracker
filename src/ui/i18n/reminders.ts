import { SLOTS, Slot } from '@domain/checkins/types';
import { Locale } from '@domain/settings/language';

import { messages } from './messages';

export type ReminderText = { title: string; body: string };

export function reminderMessage(
  slot: Slot,
  name: string,
  locale: Locale = 'en',
): { title: string; body: string } {
  const m = messages(locale);
  return {
    title: m.reminders.notificationTitle(m.slots[slot]),
    body: name ? m.reminders.bodyNamed(name) : m.reminders.body,
  };
}

/** Every slot's reminder text, for the notification scheduler. */
export const reminderMessages = (name: string, locale: Locale = 'en'): Record<Slot, ReminderText> =>
  Object.fromEntries(SLOTS.map((slot) => [slot, reminderMessage(slot, name, locale)])) as Record<
    Slot,
    ReminderText
  >;
