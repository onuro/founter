'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ExtractedImage } from '@/types/crawl';

export interface ImageFetcherSaved {
  id: string;
  url: string;
  label: string;
  imageCount: number;
  options: unknown | null;
  createdAt: Date;
  updatedAt: Date;
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
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

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

  const save = useCallback(
    async (
      label: string,
      url: string,
      images: ExtractedImage[],
      options?: unknown
    ): Promise<ImageFetcherSaved> => {
      setIsSaving(true);
      try {
        const res = await fetch('/api/image-fetcher/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, url, images, options }),
        });
        const data = await res.json();
        if (data.success) {
          setSaved((prev) => [data.data, ...prev]);
          return data.data;
        }
        throw new Error(data.error || 'Failed to save images');
      } finally {
        setIsSaving(false);
      }
    },
    []
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
    error,
    save,
    getSavedWithImages,
    updateLabel,
    remove,
    refetch: fetchSaved,
  };
}
