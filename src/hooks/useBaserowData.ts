'use client';

import { useState, useCallback } from 'react';

interface BaserowDatabase {
  id: number;
  name: string;
  group: string;
}

interface BaserowTable {
  id: number;
  name: string;
  order: number;
}

interface BaserowField {
  id: number;
  name: string;
  type: string;
  primary: boolean;
  order: number;
}

export function useBaserowData() {
  const [databases, setDatabases] = useState<BaserowDatabase[]>([]);
  const [tables, setTables] = useState<BaserowTable[]>([]);
  const [fields, setFields] = useState<BaserowField[]>([]);

  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchDatabases = useCallback(async () => {
    setIsLoadingDatabases(true);
    setError(null);
    try {
      const res = await fetch('/api/baserow/databases');
      const data = await res.json();
      if (data.success) {
        setDatabases(data.data);
        return data.data;
      } else {
        setError(data.error || 'Failed to fetch databases');
        return [];
      }
    } catch {
      setError('Failed to fetch databases');
      return [];
    } finally {
      setIsLoadingDatabases(false);
    }
  }, []);

  const fetchTables = useCallback(async (databaseId: number) => {
    setIsLoadingTables(true);
    setError(null);
    setTables([]);
    setFields([]);
    try {
      const res = await fetch(`/api/baserow/databases/${databaseId}/tables`);
      const data = await res.json();
      if (data.success) {
        setTables(data.data);
        return data.data;
      } else {
        setError(data.error || 'Failed to fetch tables');
        return [];
      }
    } catch {
      setError('Failed to fetch tables');
      return [];
    } finally {
      setIsLoadingTables(false);
    }
  }, []);

  const fetchFields = useCallback(async (tableId: number) => {
    setIsLoadingFields(true);
    setError(null);
    setFields([]);
    try {
      const res = await fetch(`/api/baserow/tables/${tableId}/fields`);
      const data = await res.json();
      if (data.success) {
        setFields(data.data);
        return data.data;
      } else {
        setError(data.error || 'Failed to fetch fields');
        return [];
      }
    } catch {
      setError('Failed to fetch fields');
      return [];
    } finally {
      setIsLoadingFields(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDatabases([]);
    setTables([]);
    setFields([]);
    setError(null);
  }, []);

  return {
    databases,
    tables,
    fields,
    isLoadingDatabases,
    isLoadingTables,
    isLoadingFields,
    isLoading: isLoadingDatabases || isLoadingTables || isLoadingFields,
    error,
    fetchDatabases,
    fetchTables,
    fetchFields,
    reset,
  };
}
