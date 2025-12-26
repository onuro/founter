'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  CustomTable,
  Field,
  Row,
  CreateFieldInput,
  UpdateFieldInput,
  CreateRowInput,
  UpdateRowInput,
} from '@/types/tables';

interface UseTableOptions {
  immediate?: boolean;
}

export function useTable(tableId: string | null, options: UseTableOptions = {}) {
  const { immediate = true } = options;
  const [table, setTable] = useState<CustomTable | null>(null);
  const [isLoading, setIsLoading] = useState(immediate && !!tableId);
  const [error, setError] = useState<string | null>(null);

  const fetchTable = useCallback(async () => {
    if (!tableId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tables/${tableId}`);
      const data = await res.json();
      if (data.success) {
        setTable(data.data);
      } else {
        setError(data.error || 'Failed to fetch table');
      }
    } catch {
      setError('Failed to fetch table');
    } finally {
      setIsLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    if (immediate && tableId) {
      fetchTable();
    }
  }, [immediate, tableId, fetchTable]);

  // Field mutations
  const createField = useCallback(
    async (input: CreateFieldInput): Promise<Field> => {
      if (!tableId) throw new Error('No table selected');
      const res = await fetch(`/api/tables/${tableId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setTable((prev) =>
          prev ? { ...prev, fields: [...prev.fields, data.data] } : prev
        );
        return data.data;
      }
      throw new Error(data.error || 'Failed to create field');
    },
    [tableId]
  );

  const updateField = useCallback(
    async (fieldId: string, input: UpdateFieldInput): Promise<Field> => {
      if (!tableId) throw new Error('No table selected');
      const res = await fetch(`/api/tables/${tableId}/fields/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setTable((prev) =>
          prev
            ? {
                ...prev,
                fields: prev.fields.map((f) =>
                  f.id === fieldId ? data.data : f
                ),
              }
            : prev
        );
        return data.data;
      }
      throw new Error(data.error || 'Failed to update field');
    },
    [tableId]
  );

  const deleteField = useCallback(
    async (fieldId: string): Promise<void> => {
      if (!tableId) throw new Error('No table selected');
      const res = await fetch(`/api/tables/${tableId}/fields/${fieldId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTable((prev) =>
          prev
            ? {
                ...prev,
                fields: prev.fields.filter((f) => f.id !== fieldId),
                // Also remove field values from rows
                rows: prev.rows.map((r) => {
                  const { [fieldId]: _, ...values } = r.values;
                  return { ...r, values };
                }),
              }
            : prev
        );
      } else {
        throw new Error(data.error || 'Failed to delete field');
      }
    },
    [tableId]
  );

  const reorderFields = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      if (!tableId || !table) throw new Error('No table selected');

      // Optimistic update
      const reorderedFields = orderedIds
        .map((id) => table.fields.find((f) => f.id === id))
        .filter((f): f is Field => f !== undefined);
      setTable((prev) =>
        prev ? { ...prev, fields: reorderedFields } : prev
      );

      try {
        const res = await fetch(`/api/tables/${tableId}/fields/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });
        const data = await res.json();
        if (!data.success) {
          await fetchTable();
          throw new Error(data.error || 'Failed to reorder fields');
        }
      } catch (err) {
        await fetchTable();
        throw err;
      }
    },
    [tableId, table, fetchTable]
  );

  // Row mutations
  const createRow = useCallback(
    async (input: CreateRowInput): Promise<Row> => {
      if (!tableId) throw new Error('No table selected');
      const res = await fetch(`/api/tables/${tableId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setTable((prev) =>
          prev ? { ...prev, rows: [...prev.rows, data.data] } : prev
        );
        return data.data;
      }
      throw new Error(data.error || 'Failed to create row');
    },
    [tableId]
  );

  const updateRow = useCallback(
    async (rowId: string, input: UpdateRowInput): Promise<Row> => {
      if (!tableId) throw new Error('No table selected');
      const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setTable((prev) =>
          prev
            ? {
                ...prev,
                rows: prev.rows.map((r) =>
                  r.id === rowId ? data.data : r
                ),
              }
            : prev
        );
        return data.data;
      }
      throw new Error(data.error || 'Failed to update row');
    },
    [tableId]
  );

  const deleteRow = useCallback(
    async (rowId: string): Promise<void> => {
      if (!tableId) throw new Error('No table selected');
      const res = await fetch(`/api/tables/${tableId}/rows/${rowId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setTable((prev) =>
          prev
            ? { ...prev, rows: prev.rows.filter((r) => r.id !== rowId) }
            : prev
        );
      } else {
        throw new Error(data.error || 'Failed to delete row');
      }
    },
    [tableId]
  );

  return {
    table,
    setTable,
    isLoading,
    error,
    refetch: fetchTable,
    // Field mutations
    createField,
    updateField,
    deleteField,
    reorderFields,
    // Row mutations
    createRow,
    updateRow,
    deleteRow,
  };
}
