'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExtractedImage } from '@/types/crawl';

export interface ImageFetcherSaved {
  id: string;
  url: string;
  label: string;
  imageCount: number;
  status?: 'downloading' | 'complete' | 'failed';
  downloadedCount?: number;
  failedCount?: number;
  options: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveProgress {
  id: string;
  status: 'downloading' | 'complete' | 'failed';
  imageCount: number;
  downloadedCount: number;
  failedCount: number;
}

export interface ImageFetcherSavedImage {
  id: string;
  originalUrl: string;
  localPath: string;
  filename: string;
  width: number | null;
  alt: string | null;
  link: string | null;
}

export interface ImageFetcherSavedWithImages extends ImageFetcherSaved {
  images: ImageFetcherSavedImage[];
}

interface UseImageFetcherSavedOptions {
  immediate?: boolean;
}

export function useImageFetcherSaved(options: UseImageFetcherSavedOptions = {}) {
  const { immediate = true } = options;
  const [saved, setSaved] = useState<ImageFetcherSaved[]>([]);
  const [isLoading, setIsLoading] = useState(immediate);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSaved = useCallback(async () => {
    if (hasFetched && saved.length > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/image-fetcher/saved');
      const data = await res.json();
      if (data.success) {
        setSaved(data.data);
        setHasFetched(true);
      } else {
        setError(data.error || 'Failed to fetch saved items');
      }
    } catch {
      setError('Failed to fetch saved items');
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, saved.length]);

  useEffect(() => {
    if (immediate) {
      fetchSaved();
    }
  }, [immediate, fetchSaved]);

  // Fetch status for a specific saved item
  const getStatus = useCallback(async (id: string): Promise<SaveProgress> => {
    const res = await fetch(`/api/image-fetcher/saved/${id}/status`);
    const data = await res.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Failed to fetch status');
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Start polling for progress
  const startPolling = useCallback(
    (id: string, imageCount: number) => {
      const poll = async () => {
        try {
          const status = await getStatus(id);
          setSaveProgress(status);

          // Update the saved item in the list
          setSaved((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: status.status,
                    downloadedCount: status.downloadedCount,
                    failedCount: status.failedCount,
                    imageCount: status.status === 'complete' ? status.downloadedCount : item.imageCount,
                  }
                : item
            )
          );

          if (status.status === 'downloading') {
            // Continue polling every 1 second
            pollingRef.current = setTimeout(poll, 1000);
          } else {
            // Done - clear progress after a short delay
            setIsSaving(false);
            setTimeout(() => setSaveProgress(null), 2000);
          }
        } catch (err) {
          console.error('Polling error:', err);
          setIsSaving(false);
          setSaveProgress(null);
        }
      };

      // Initial progress
      setSaveProgress({
        id,
        status: 'downloading',
        imageCount,
        downloadedCount: 0,
        failedCount: 0,
      });

      // Start polling after a short delay
      pollingRef.current = setTimeout(poll, 500);
    },
    [getStatus]
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const save = useCallback(
    async (
      label: string,
      url: string,
      images: ExtractedImage[],
      options?: unknown
    ): Promise<ImageFetcherSaved> => {
      setIsSaving(true);
      stopPolling(); // Clear any existing polling

      try {
        const res = await fetch('/api/image-fetcher/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, url, images, options }),
        });
        const data = await res.json();
        if (data.success) {
          // Add to saved list immediately (with downloading status)
          setSaved((prev) => [data.data, ...prev]);

          // Start polling for progress
          startPolling(data.data.id, images.length);

          return data.data;
        }
        throw new Error(data.error || 'Failed to save images');
      } catch (err) {
        setIsSaving(false);
        throw err;
      }
    },
    [startPolling, stopPolling]
  );

  const getSavedWithImages = useCallback(
    async (id: string): Promise<ImageFetcherSavedWithImages> => {
      const res = await fetch(`/api/image-fetcher/saved/${id}`);
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
      throw new Error(data.error || 'Failed to fetch saved item');
    },
    []
  );

  const updateLabel = useCallback(
    async (id: string, label: string): Promise<void> => {
      const res = await fetch(`/api/image-fetcher/saved/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, label: data.data.label } : item
          )
        );
      } else {
        throw new Error(data.error || 'Failed to update label');
      }
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/image-fetcher/saved/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      setSaved((prev) => prev.filter((item) => item.id !== id));
    } else {
      throw new Error(data.error || 'Failed to delete saved item');
    }
  }, []);

  return {
    saved,
    isLoading,
    isSaving,
    saveProgress,
    error,
    save,
    getSavedWithImages,
    updateLabel,
    remove,
    refetch: fetchSaved,
  };
}
