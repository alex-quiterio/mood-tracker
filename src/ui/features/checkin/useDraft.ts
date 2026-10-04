import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { Draft, isDraftChanged } from '@domain/checkins/drafts';
import { Entry, Slot } from '@domain/checkins/types';
import { clearDraft, loadDraft, saveDraft } from '@infrastructure/storage/draftsRepository';

const SAVE_DELAY_MS = 400;

type Options = {
  date: string;
  slot: Slot;
  entry: Entry | undefined;
  asksSleep: boolean;
  draft: Draft;
  /** Puts a draft found in storage back into the form. */
  restore: (draft: Draft) => void;
};

/**
 * Keeps a check-in being typed in storage, so closing the app or leaving the screen
 * doesn't lose it. Restores it on mount; the save button (or an edit back to what is
 * saved) clears it. `discard` is for after saving: the card unmounts with its old
 * words, which must not be written back.
 */
export function useDraft({ date, slot, entry, asksSleep, draft, restore }: Options) {
  const latest = useRef({ draft, entry, asksSleep, restore });
  useEffect(() => {
    latest.current = { draft, entry, asksSleep, restore };
  });
  // Nothing is written until the stored draft has been read, or it would be wiped.
  const loaded = useRef(false);
  const discarded = useRef(false);

  const flush = useCallback(() => {
    if (!loaded.current || discarded.current) return;
    const { draft: d, entry: e, asksSleep: a } = latest.current;
    return (isDraftChanged(e, d, a) ? saveDraft(date, slot, d) : clearDraft(date, slot)).catch(() => {});
  }, [date, slot]);

  useEffect(() => {
    let cancelled = false;
    loadDraft(date, slot).then((stored) => {
      if (cancelled) return;
      const { draft: d, entry: e, asksSleep: a } = latest.current;
      // Words typed while loading win over the stored draft.
      if (stored && !isDraftChanged(e, d, a) && isDraftChanged(e, stored, a)) latest.current.restore(stored);
      loaded.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [date, slot]);

  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [flush, draft.mood, draft.note, draft.habits, draft.sleep]);

  // Don't wait for the debounce when the app goes to the background or the card goes away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, [flush]);

  return {
    discard: () => {
      discarded.current = true;
      return clearDraft(date, slot).catch(() => {});
    },
  };
}
