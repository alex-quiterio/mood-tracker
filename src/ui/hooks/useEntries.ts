import { useCallback, useEffect, useRef, useState } from 'react';

import { mergeEntries, removeEntry, upsertEntry } from '@domain/checkins/entries';
import { Urge, addUrge as withUrge, mergeUrges } from '@domain/habits/urges';
import { loadUrges, saveUrges } from '@infrastructure/storage/urgesRepository';
import { loadEntries, migrateEntries, saveEntries } from '@infrastructure/storage/entriesRepository';
import { Entry, Slot } from '@domain/checkins/types';

/** App-wide entry state, persisted to AsyncStorage on every change. */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [urges, setUrges] = useState<Urge[]>([]);
  const latest = useRef<Entry[]>([]);
  const latestUrges = useRef<Urge[]>([]);

  useEffect(() => {
    loadEntries()
      .then(migrateEntries)
      .then((stored) => {
        latest.current = stored;
        setEntries(stored);
      })
      .then(() => loadUrges())
      .then((stored) => {
        latestUrges.current = stored;
        setUrges(stored);
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

  const commitUrges = useCallback(async (next: Urge[]) => {
    latestUrges.current = next;
    setUrges(next);
    await saveUrges(next);
  }, []);
  const addUrge = useCallback(
    (urge: Urge) => commitUrges(withUrge(latestUrges.current, urge)),
    [commitUrges],
  );
  const importUrges = useCallback(
    (incoming: Urge[]) => commitUrges(mergeUrges(latestUrges.current, incoming)),
    [commitUrges],
  );

  return { entries, urges, loaded, save, remove, importEntries, addUrge, importUrges };
}

export type EntriesStore = ReturnType<typeof useEntries>;
