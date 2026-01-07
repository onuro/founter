'use client';

import { useState, useCallback, useEffect } from 'react';
import type { MediaTagWithCount, CreateTagInput, UpdateTagInput } from '@/types/media';

interface UseMediaTagsReturn {
  tags: MediaTagWithCount[];
  isLoading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (input: CreateTagInput) => Promise<MediaTagWithCount | null>;
  updateTag: (tagId: string, input: UpdateTagInput) => Promise<MediaTagWithCount | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  addTagsToFiles: (fileIds: string[], tagIds: string[]) => Promise<boolean>;
  removeTagsFromFiles: (fileIds: string[], tagIds: string[]) => Promise<boolean>;
}

export function useMediaTags(): UseMediaTagsReturn {
  const [tags, setTags] = useState<MediaTagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/media/tags');
      const result = await response.json();
      if (result.success) {
        setTags(result.data);
      } else {
        setError(result.error || 'Failed to fetch tags');
      }
    } catch (err) {
      setError('Failed to fetch tags');
      console.error('Failed to fetch tags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (input: CreateTagInput): Promise<MediaTagWithCount | null> => {
    try {
      const response = await fetch('/api/media/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (result.success) {
        const newTag: MediaTagWithCount = {
          ...result.data,
          fileCount: 0,
        };
        setTags(prev => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));
        return newTag;
      } else {
        setError(result.error || 'Failed to create tag');
        return null;
      }
    } catch (err) {
      setError('Failed to create tag');
      console.error('Failed to create tag:', err);
      return null;
    }
  }, []);

  const updateTag = useCallback(async (tagId: string, input: UpdateTagInput): Promise<MediaTagWithCount | null> => {
    try {
      const response = await fetch(`/api/media/tags/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (result.success) {
        setTags(prev => prev.map(t =>
          t.id === tagId
            ? { ...t, ...result.data }
            : t
        ).sort((a, b) => a.name.localeCompare(b.name)));
        return result.data;
      } else {
        setError(result.error || 'Failed to update tag');
        return null;
      }
    } catch (err) {
      setError('Failed to update tag');
      console.error('Failed to update tag:', err);
      return null;
    }
  }, []);

  const deleteTag = useCallback(async (tagId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/media/tags/${tagId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setTags(prev => prev.filter(t => t.id !== tagId));
        return true;
      } else {
        setError(result.error || 'Failed to delete tag');
        return false;
      }
    } catch (err) {
      setError('Failed to delete tag');
      console.error('Failed to delete tag:', err);
      return false;
    }
  }, []);

  const addTagsToFiles = useCallback(async (fileIds: string[], tagIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/media/files/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-tags', fileIds, tagIds }),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh tags to update counts
        await fetchTags();
        return true;
      } else {
        setError(result.error || 'Failed to add tags');
        return false;
      }
    } catch (err) {
      setError('Failed to add tags');
      console.error('Failed to add tags:', err);
      return false;
    }
  }, [fetchTags]);

  const removeTagsFromFiles = useCallback(async (fileIds: string[], tagIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/media/files/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-tags', fileIds, tagIds }),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh tags to update counts
        await fetchTags();
        return true;
      } else {
        setError(result.error || 'Failed to remove tags');
        return false;
      }
    } catch (err) {
      setError('Failed to remove tags');
      console.error('Failed to remove tags:', err);
      return false;
    }
  }, [fetchTags]);

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    addTagsToFiles,
    removeTagsFromFiles,
  };
}
