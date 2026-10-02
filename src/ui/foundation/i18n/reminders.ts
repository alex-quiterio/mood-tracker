import { SLOTS, Slot } from '@domain/checkins/types';
import { QUICK_MOODS, QuickMood } from '@domain/reminders/quickCheckIn';
import { Locale } from '@domain/settings/language';

import { messages } from './messages';

export type ReminderText = { title: string; body: string; actions: Record<QuickMood, string> };

export function reminderMessage(slot: Slot, name: string, locale: Locale = 'en'): ReminderText {
  const m = messages(locale);
  return {
    title: m.reminders.notificationTitle(m.slots[slot]),
    body: name ? m.reminders.bodyNamed(name) : m.reminders.body,
    actions: Object.fromEntries(QUICK_MOODS.map((mood) => [mood, m.reminders.quickMoods[mood]])) as Record<
      QuickMood,
      string
    >,
  };
}

/** Every slot's reminder text, for the notification scheduler. */
export const reminderMessages = (name: string, locale: Locale = 'en'): Record<Slot, ReminderText> =>
  Object.fromEntries(SLOTS.map((slot) => [slot, reminderMessage(slot, name, locale)])) as Record<
    Slot,
    ReminderText
  >;
