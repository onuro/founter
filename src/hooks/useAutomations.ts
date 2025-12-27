'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AutomationSummary, CreateAutomationInput, UpdateAutomationInput } from '@/types/automator';

interface UseAutomationsOptions {
  immediate?: boolean;
}

export function useAutomations(options: UseAutomationsOptions = {}) {
  const { immediate = true } = options;
  const [automations, setAutomations] = useState<AutomationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAutomations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success) {
        setAutomations(data.data);
        setHasFetched(true);
      } else {
        setError(data.error || 'Failed to fetch automations');
      }
    } catch {
      setError('Failed to fetch automations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate && !hasFetched) {
      fetchAutomations();
    }
  }, [immediate, hasFetched, fetchAutomations]);

  const createAutomation = useCallback(
    async (input: CreateAutomationInput): Promise<AutomationSummary> => {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setAutomations((prev) => [data.data, ...prev]);
        return data.data;
      }
      throw new Error(data.error || 'Failed to create automation');
    },
    []
  );

  const updateAutomation = useCallback(
    async (id: string, input: UpdateAutomationInput): Promise<AutomationSummary> => {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data.data } : a))
        );
        return data.data;
      }
      throw new Error(data.error || 'Failed to update automation');
    },
    []
  );

  const deleteAutomation = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } else {
      throw new Error(data.error || 'Failed to delete automation');
    }
  }, []);

  const toggleAutomation = useCallback(
    async (id: string, enabled: boolean): Promise<void> => {
      // Optimistic update
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled } : a))
      );

      try {
        const res = await fetch(`/api/automations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        });
        const data = await res.json();
        if (!data.success) {
          // Revert on failure
          setAutomations((prev) =>
            prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a))
          );
          throw new Error(data.error || 'Failed to toggle automation');
        }
      } catch (err) {
        // Revert on error
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? { ...a, enabled: !enabled } : a))
        );
        throw err;
      }
    },
    []
  );

  return {
    automations,
    setAutomations,
    isLoading,
    error,
    hasFetched,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    refetch: fetchAutomations,
  };
}
