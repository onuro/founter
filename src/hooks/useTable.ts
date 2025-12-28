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
  paginate?: boolean;
  pageSize?: number;
}

export function useTable(tableId: string | null, options: UseTableOptions = {}) {
  const { immediate = true, paginate = false, pageSize = 100 } = options;
  const [table, setTable] = useState<CustomTable | null>(null);
  const [isLoading, setIsLoading] = useState(immediate && !!tableId);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchTable = useCallback(async () => {
    if (!tableId) return;
    setIsLoading(true);
    setError(null);
    try {
      if (paginate) {
        // Fetch table structure without rows, then fetch first page of rows
        const [tableRes, rowsRes] = await Promise.all([
          fetch(`/api/tables/${tableId}?includeRows=false`),
          fetch(`/api/tables/${tableId}/rows?page=1&limit=${pageSize}`),
        ]);
        const tableData = await tableRes.json();
        const rowsData = await rowsRes.json();

        if (tableData.success && rowsData.success) {
          setTable({
            ...tableData.data,
            rows: rowsData.data,
          });
          setTotalRows(rowsData.pagination.total);
          setHasMore(rowsData.pagination.page < rowsData.pagination.totalPages);
          setCurrentPage(1);
        } else {
          setError(tableData.error || rowsData.error || 'Failed to fetch table');
        }
      } else {
        // Original behavior - fetch everything
        const res = await fetch(`/api/tables/${tableId}`);
        const data = await res.json();
        if (data.success) {
          setTable(data.data);
          setTotalRows(data.data.rows?.length || 0);
        } else {
          setError(data.error || 'Failed to fetch table');
        }
      }
    } catch {
      setError('Failed to fetch table');
    } finally {
      setIsLoading(false);
    }
  }, [tableId, paginate, pageSize]);

  const loadMoreRows = useCallback(async () => {
    if (!tableId || !paginate || !hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await fetch(`/api/tables/${tableId}/rows?page=${nextPage}&limit=${pageSize}`);
      const data = await res.json();

      if (data.success) {
        setTable((prev) =>
          prev ? { ...prev, rows: [...prev.rows, ...data.data] } : prev
        );
        setCurrentPage(nextPage);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch {
      // Silently fail, user can try again
    } finally {
      setIsLoadingMore(false);
    }
  }, [tableId, paginate, hasMore, isLoadingMore, currentPage, pageSize]);

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
        setTotalRows((prev) => Math.max(0, prev - 1));
      } else {
        throw new Error(data.error || 'Failed to delete row');
      }
    },
    [tableId]
  );

  const deleteRows = useCallback(
    async (rowIds: string[]): Promise<number> => {
      if (!tableId) throw new Error('No table selected');
      if (rowIds.length === 0) return 0;

      const res = await fetch(`/api/tables/${tableId}/rows/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIds }),
      });
      const data = await res.json();

      if (data.success) {
        const deletedCount = data.data.deletedCount;
        const deletedSet = new Set(rowIds);
        setTable((prev) =>
          prev
            ? { ...prev, rows: prev.rows.filter((r) => !deletedSet.has(r.id)) }
            : prev
        );
        setTotalRows((prev) => Math.max(0, prev - deletedCount));
        return deletedCount;
      } else {
        throw new Error(data.error || 'Failed to delete rows');
      }
    },
    [tableId]
  );

  return {
    table,
    setTable,
    isLoading,
    isLoadingMore,
    error,
    refetch: fetchTable,
    // Pagination
    totalRows,
    hasMore,
    loadMoreRows,
    // Field mutations
    createField,
    updateField,
    deleteField,
    reorderFields,
    // Row mutations
    createRow,
    updateRow,
    deleteRow,
    deleteRows,
  };
}
