import { useState, useEffect, useCallback } from 'react';
import type { CycleEntry } from '../types';

export type EntryMap = Record<string, CycleEntry>;

type UseEntriesReturn = {
  entries: EntryMap;
  isLoading: boolean;
  error: string | null;
  markDay: (
    date: string,
    isPeriod: boolean,
    notes?: string
  ) => Promise<CycleEntry>;
  unmarkDay: (date: string) => Promise<void>;
  updateNote: (
    date: string,
    notes: string,
    isPeriod: boolean
  ) => Promise<CycleEntry>;
};

export function useEntries(): UseEntriesReturn {
  const [entries, setEntries] = useState<EntryMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/entries?start=${start}&end=${end}`);
      if (!res.ok) throw new Error('Failed to fetch entries');

      const data: CycleEntry[] = await res.json();
      const map: EntryMap = {};

      for (const entry of data) {
        const normalizedEntry = normalizeEntry(entry);
        map[normalizedEntry.date] = normalizedEntry;
      }

      setEntries(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 6);

    const end = new Date(now);
    end.setMonth(end.getMonth() + 6);

    fetchEntries(toDateStr(start), toDateStr(end));
  }, [fetchEntries]);

  const markDay = useCallback(
    async (
      date: string,
      isPeriod: boolean,
      notes?: string
    ): Promise<CycleEntry> => {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          isPeriod,
          notes: notes ?? null,
        }),
      });

      if (!res.ok) throw new Error('Failed to mark day');

      const entry: CycleEntry = await res.json();
      const normalizedEntry = normalizeEntry(entry);

      setEntries((prev) => ({
        ...prev,
        [normalizedEntry.date]: normalizedEntry,
      }));

      return normalizedEntry;
    },
    []
  );

  const unmarkDay = useCallback(async (date: string): Promise<void> => {
    const res = await fetch(`/api/entries/${date}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Failed to remove entry');

    setEntries((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, []);

  const updateNote = useCallback(
    async (
      date: string,
      notes: string,
      isPeriod: boolean
    ): Promise<CycleEntry> => {
      const existing = entries[date];

      if (!existing) {
        const res = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            isPeriod,
            notes: notes || null,
          }),
        });

        if (!res.ok) throw new Error('Failed to create entry');

        const entry: CycleEntry = await res.json();
        const normalizedEntry = normalizeEntry(entry);

        setEntries((prev) => ({
          ...prev,
          [normalizedEntry.date]: normalizedEntry,
        }));

        return normalizedEntry;
      }

      const res = await fetch(`/api/entries/${date}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes || null,
          isPeriod,
        }),
      });

      if (!res.ok) throw new Error('Failed to update entry');

      const updated: CycleEntry = await res.json();
      const normalizedEntry = normalizeEntry(updated);

      setEntries((prev) => ({
        ...prev,
        [normalizedEntry.date]: normalizedEntry,
      }));

      return normalizedEntry;
    },
    [entries]
  );

  return { entries, isLoading, error, markDay, unmarkDay, updateNote };
}

function normalizeEntry(entry: CycleEntry): CycleEntry {
  return {
    ...entry,
    date: entry.date.slice(0, 10),
  };
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
