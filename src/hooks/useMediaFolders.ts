'use client';

import { useState, useCallback } from 'react';
import type { MediaFolder, MediaFolderTree, CreateFolderInput, UpdateFolderInput } from '@/types/media';

interface UseMediaFoldersReturn {
  folders: MediaFolderTree[];
  isLoading: boolean;
  error: string | null;
  fetchFolders: (projectId: string) => Promise<void>;
  createFolder: (projectId: string, input: CreateFolderInput) => Promise<MediaFolder | null>;
  updateFolder: (projectId: string, folderId: string, input: UpdateFolderInput) => Promise<MediaFolder | null>;
  deleteFolder: (projectId: string, folderId: string) => Promise<boolean>;
}

export function useMediaFolders(): UseMediaFoldersReturn {
  const [folders, setFolders] = useState<MediaFolderTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/media/projects/${projectId}/folders`);
      const result = await response.json();
      if (result.success) {
        setFolders(result.data);
      } else {
        setError(result.error || 'Failed to fetch folders');
      }
    } catch (err) {
      setError('Failed to fetch folders');
      console.error('Failed to fetch folders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (projectId: string, input: CreateFolderInput): Promise<MediaFolder | null> => {
    try {
      const response = await fetch(`/api/media/projects/${projectId}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh folders list
        await fetchFolders(projectId);
        return result.data;
      } else {
        setError(result.error || 'Failed to create folder');
        return null;
      }
    } catch (err) {
      setError('Failed to create folder');
      console.error('Failed to create folder:', err);
      return null;
    }
  }, [fetchFolders]);

  const updateFolder = useCallback(async (
    projectId: string,
    folderId: string,
    input: UpdateFolderInput
  ): Promise<MediaFolder | null> => {
    try {
      const response = await fetch(`/api/media/projects/${projectId}/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      if (result.success) {
        // Refresh folders list
        await fetchFolders(projectId);
        return result.data;
      } else {
        setError(result.error || 'Failed to update folder');
        return null;
      }
    } catch (err) {
      setError('Failed to update folder');
      console.error('Failed to update folder:', err);
      return null;
    }
  }, [fetchFolders]);

  const deleteFolder = useCallback(async (projectId: string, folderId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/media/projects/${projectId}/folders/${folderId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        // Refresh folders list
        await fetchFolders(projectId);
        return true;
      } else {
        setError(result.error || 'Failed to delete folder');
        return false;
      }
    } catch (err) {
      setError('Failed to delete folder');
      console.error('Failed to delete folder:', err);
      return false;
    }
  }, [fetchFolders]);

  return {
    folders,
    isLoading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
