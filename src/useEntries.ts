import { useCallback, useEffect, useRef, useState } from 'react';

import { mergeEntries, removeEntry, upsertEntry } from './entries';
import { loadEntries, migrateEntries, saveEntries } from './storage';
import { Entry, Slot } from './types';

/** App-wide entry state, persisted to AsyncStorage on every change. */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef<Entry[]>([]);

  useEffect(() => {
    loadEntries()
      .then(migrateEntries)
      .then((stored) => {
        latest.current = stored;
        setEntries(stored);
      })
      .finally(() => setLoaded(true));
  }, []);

  const commit = useCallback(async (next: Entry[]) => {
    latest.current = next;
    setEntries(next);
    await saveEntries(next);
  }, []);

  const save = useCallback((entry: Entry) => commit(upsertEntry(latest.current, entry)), [commit]);
  const remove = useCallback(
    (date: string, slot: Slot) => commit(removeEntry(latest.current, date, slot)),
    [commit],
  );
  const importEntries = useCallback(
    (incoming: Entry[]) => commit(mergeEntries(latest.current, incoming)),
    [commit],
  );

  return { entries, loaded, save, remove, importEntries };
}

export type EntriesStore = ReturnType<typeof useEntries>;
