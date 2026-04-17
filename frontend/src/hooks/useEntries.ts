import { useState, useEffect, useCallback } from 'react';
import type { CycleEntry } from '../types';
import { getToken } from './useAuth';
import { toDateStr } from '../utils/dateUtils';

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
  markRange: (startDate: string, endDate: string) => Promise<void>;
  unmarkDay: (date: string) => Promise<void>;
  updateNote: (
    date: string,
    notes: string,
    isPeriod: boolean
  ) => Promise<CycleEntry>;
};

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export function useEntries(userId?: number): UseEntriesReturn {
  const [entries, setEntries] = useState<EntryMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/entries?start=${start}&end=${end}`, {
        headers: authHeaders(),
      });
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
    if (!userId) return;
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 6);

    const end = new Date(now);
    end.setMonth(end.getMonth() + 6);

    fetchEntries(toDateStr(start), toDateStr(end));
  }, [fetchEntries, userId]);

  const markDay = useCallback(
    async (
      date: string,
      isPeriod: boolean,
      notes?: string
    ): Promise<CycleEntry> => {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ date, isPeriod, notes: notes ?? null }),
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
      headers: authHeaders(),
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
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ date, isPeriod, notes: notes || null }),
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
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ notes: notes || null, isPeriod }),
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

  const markRange = useCallback(
    async (startDate: string, endDate: string): Promise<void> => {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
      const dates: string[] = Array.from({ length: diffDays + 1 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return toDateStr(d);
      });
      await Promise.all(
        dates.map((date) =>
          fetch('/api/entries', {
            method: 'POST',
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ date, isPeriod: true, notes: null }),
          })
        )
      );
      // Refresh entries after bulk save
      const now = new Date();
      const rangeStart = new Date(now);
      rangeStart.setMonth(rangeStart.getMonth() - 6);
      const rangeEnd = new Date(now);
      rangeEnd.setMonth(rangeEnd.getMonth() + 6);
      await fetchEntries(toDateStr(rangeStart), toDateStr(rangeEnd));
    },
    [fetchEntries]
  );

  return {
    entries,
    isLoading,
    error,
    markDay,
    markRange,
    unmarkDay,
    updateNote,
  };
}

function normalizeEntry(entry: CycleEntry): CycleEntry {
  return {
    ...entry,
    date: entry.date.slice(0, 10),
  };
}
