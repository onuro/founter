'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TableSummary, CreateTableInput, UpdateTableInput } from '@/types/tables';

interface UseTablesOptions {
  immediate?: boolean;
}

export function useTables(options: UseTablesOptions = {}) {
  const { immediate = true } = options;
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
        setHasFetched(true);
      } else {
        setError(data.error || 'Failed to fetch tables');
      }
    } catch {
      setError('Failed to fetch tables');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate && !hasFetched) {
      fetchTables();
    }
  }, [immediate, hasFetched, fetchTables]);

  const createTable = useCallback(
    async (input: CreateTableInput): Promise<TableSummary> => {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        const newTable: TableSummary = {
          id: data.data.id,
          name: data.data.name,
          icon: data.data.icon,
          order: data.data.order,
          fieldCount: data.data.fields?.length || 1,
          rowCount: data.data.rows?.length || 0,
        };
        setTables((prev) => [...prev, newTable]);
        return newTable;
      }
      throw new Error(data.error || 'Failed to create table');
    },
    []
  );

  const updateTable = useCallback(
    async (id: string, input: UpdateTableInput): Promise<TableSummary> => {
      const res = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        const updatedTable: TableSummary = {
          id: data.data.id,
          name: data.data.name,
          icon: data.data.icon,
          order: data.data.order,
          fieldCount: data.data.fields?.length || 0,
          rowCount: data.data.rows?.length || 0,
        };
        setTables((prev) =>
          prev.map((t) => (t.id === id ? updatedTable : t))
        );
        return updatedTable;
      }
      throw new Error(data.error || 'Failed to update table');
    },
    []
  );

  const deleteTable = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setTables((prev) => prev.filter((t) => t.id !== id));
    } else {
      throw new Error(data.error || 'Failed to delete table');
    }
  }, []);

  const reorderTables = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      // Optimistically update local state
      const reorderedTables = orderedIds
        .map((id) => tables.find((t) => t.id === id))
        .filter((t): t is TableSummary => t !== undefined);
      setTables(reorderedTables);

      try {
        const res = await fetch('/api/tables/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });
        const data = await res.json();
        if (!data.success) {
          await fetchTables();
          throw new Error(data.error || 'Failed to reorder tables');
        }
      } catch (err) {
        await fetchTables();
        throw err;
      }
    },
    [tables, fetchTables]
  );

  return {
    tables,
    setTables,
    isLoading,
    error,
    hasFetched,
    createTable,
    updateTable,
    deleteTable,
    reorderTables,
    refetch: fetchTables,
  };
}
