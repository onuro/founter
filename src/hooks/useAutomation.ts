'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Automation, AutomationRun, UpdateAutomationInput } from '@/types/automator';

interface UseAutomationOptions {
  immediate?: boolean;
}

export function useAutomation(id: string | null, options: UseAutomationOptions = {}) {
  const { immediate = true } = options;
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [isLoading, setIsLoading] = useState(immediate && !!id);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRuns, setTotalRuns] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAutomation = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/automations/${id}`);
      const data = await res.json();
      if (data.success) {
        setAutomation(data.data);
      } else {
        setError(data.error || 'Failed to fetch automation');
      }
    } catch {
      setError('Failed to fetch automation');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchRuns = useCallback(async (page = 1) => {
    if (!id) return;
    setIsLoadingRuns(true);
    try {
      const res = await fetch(`/api/automations/${id}/runs?page=${page}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setRuns(data.data);
        setTotalRuns(data.pagination.total);
        setCurrentPage(page);
      }
    } catch {
      // Silent fail for runs
    } finally {
      setIsLoadingRuns(false);
    }
  }, [id]);

  useEffect(() => {
    if (immediate && id) {
      fetchAutomation();
      fetchRuns();
    }
  }, [immediate, id, fetchAutomation, fetchRuns]);

  const updateAutomation = useCallback(
    async (input: UpdateAutomationInput): Promise<Automation> => {
      if (!id) throw new Error('No automation ID');
      const res = await fetch(`/api/automations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setAutomation(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Failed to update automation');
    },
    [id]
  );

  const triggerRun = useCallback(
    async (rowId: number, tableId: number, row?: Record<string, unknown>): Promise<AutomationRun> => {
      if (!id) throw new Error('No automation ID');
      const res = await fetch(`/api/automations/${id}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId, tableId, row }),
      });
      const data = await res.json();
      if (data.success) {
        // Add new run to the beginning
        setRuns((prev) => [data.data, ...prev]);
        setTotalRuns((prev) => prev + 1);
        return data.data;
      }
      throw new Error(data.error || 'Failed to trigger run');
    },
    [id]
  );

  const clearRuns = useCallback(async (): Promise<number> => {
    if (!id) throw new Error('No automation ID');
    const res = await fetch(`/api/automations/${id}/runs`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      setRuns([]);
      setTotalRuns(0);
      return data.deleted;
    }
    throw new Error(data.error || 'Failed to clear runs');
  }, [id]);

  return {
    automation,
    runs,
    isLoading,
    isLoadingRuns,
    error,
    totalRuns,
    currentPage,
    updateAutomation,
    triggerRun,
    clearRuns,
    refetch: fetchAutomation,
    refetchRuns: fetchRuns,
    loadMoreRuns: () => fetchRuns(currentPage + 1),
  };
}
