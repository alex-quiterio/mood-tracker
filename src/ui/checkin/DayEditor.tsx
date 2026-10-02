import { useState } from 'react';

import { entryKey } from '@domain/checkins/entries';
import { SLOTS, Slot } from '@domain/checkins/types';
import { Habit } from '@domain/habits/habits';
import { EntriesStore } from '@ui/hooks/useEntries';

import { SlotCard, Tracking } from './SlotCard';

type Props = {
  date: string;
  store: EntriesStore;
  tracking: Tracking;
  habits: Habit[];
};

/** A past day's three check-ins to fill in or change, opening on its first empty slot. */
export function DayEditor({ date, store, tracking, habits }: Props) {
  const [openSlot, setOpenSlot] = useState<Slot>(
    () => SLOTS.find((s) => !store.entries.some((e) => e.date === date && e.slot === s)) ?? 'morning',
  );
  return SLOTS.map((slot) => {
    const entry = store.entries.find((e) => e.date === date && e.slot === slot);
    return (
      <SlotCard
        // Remount when the saved entry changes so the draft resets.
        key={`${entryKey(date, slot)}|${entry?.recordedAt ?? ''}`}
        date={date}
        slot={slot}
        entry={entry}
        open={openSlot === slot}
        onOpen={() => setOpenSlot(slot)}
        store={store}
        tracking={tracking}
        habits={habits}
        onSaved={() => {}}
      />
    );
  });
}
