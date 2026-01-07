'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MediaFile, UpdateFileInput } from '@/types/media';

interface UseMediaFilesOptions {
  projectId: string | null;
  folderId?: string | null;
  page?: number;
  limit?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useMediaFiles({ projectId, folderId, page = 1, limit = 50 }: UseMediaFilesOptions) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!projectId) {
      setFiles([]);
      setPagination(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (folderId) {
        params.set('folderId', folderId);
      }

      const res = await fetch(`/api/media/projects/${projectId}/files?${params}`);
      const data = await res.json();

      if (data.success) {
        setFiles(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError('Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, folderId, page, limit]);

  // Upload files
  const uploadFiles = useCallback(async (fileList: FileList, targetFolderId?: string | null) => {
    if (!projectId) {
      throw new Error('No project selected');
    }

    const formData = new FormData();
    Array.from(fileList).forEach((file) => {
      formData.append('files', file);
    });
    if (targetFolderId) {
      formData.append('folderId', targetFolderId);
    }

    const res = await fetch(`/api/media/projects/${projectId}/files`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload files');
    }

    // Refetch to get updated list
    await fetchFiles();

    return {
      files: data.data as MediaFile[],
      errors: data.errors as string[] | undefined,
    };
  }, [projectId, fetchFiles]);

  // Update file
  const updateFile = useCallback(async (fileId: string, input: UpdateFileInput) => {
    const res = await fetch(`/api/media/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update file');
    }

    // Update local state
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? data.data : f))
    );

    return data.data as MediaFile;
  }, []);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    const res = await fetch(`/api/media/files/${fileId}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete file');
    }

    // Update local state
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    pagination,
    isLoading,
    error,
    fetchFiles,
    refreshFiles: fetchFiles,
    uploadFiles,
    updateFile,
    deleteFile,
  };
}
