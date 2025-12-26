'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SitePreset, CreatePresetInput, UpdatePresetInput, PresetType } from '@/types/preset';

export function usePresets(type: PresetType) {
  const [presets, setPresets] = useState<SitePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/presets?type=${type}`);
      const data = await res.json();
      if (data.success) {
        setPresets(data.data);
      } else {
        setError(data.error || 'Failed to fetch presets');
      }
    } catch {
      setError('Failed to fetch presets');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const createPreset = useCallback(
    async (input: Omit<CreatePresetInput, 'type'>): Promise<SitePreset> => {
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, type }),
      });
      const data = await res.json();
      if (data.success) {
        // New presets go to the end (sorted by order asc)
        setPresets((prev) => [...prev, data.data]);
        return data.data;
      }
      throw new Error(data.error || 'Failed to create preset');
    },
    [type]
  );

  const updatePreset = useCallback(
    async (input: UpdatePresetInput): Promise<SitePreset> => {
      const res = await fetch(`/api/presets/${input.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        setPresets((prev) =>
          prev.map((p) => (p.id === input.id ? data.data : p))
        );
        return data.data;
      }
      throw new Error(data.error || 'Failed to update preset');
    },
    []
  );

  const deletePreset = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } else {
      throw new Error(data.error || 'Failed to delete preset');
    }
  }, []);

  const reorderPresets = useCallback(
    async (orderedIds: string[]): Promise<void> => {
      // Optimistically update local state
      const reorderedPresets = orderedIds
        .map((id) => presets.find((p) => p.id === id))
        .filter((p): p is SitePreset => p !== undefined);
      setPresets(reorderedPresets);

      try {
        const res = await fetch('/api/presets/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });
        const data = await res.json();
        if (!data.success) {
          // Revert on failure
          await fetchPresets();
          throw new Error(data.error || 'Failed to reorder presets');
        }
      } catch (err) {
        // Revert on error
        await fetchPresets();
        throw err;
      }
    },
    [presets, fetchPresets]
  );

  return {
    presets,
    setPresets,
    isLoading,
    error,
    createPreset,
    updatePreset,
    deletePreset,
    reorderPresets,
    refetch: fetchPresets,
  };
}
