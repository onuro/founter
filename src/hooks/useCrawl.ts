'use client';

import { useState, useCallback } from 'react';
import { ExtractedImage } from '@/types/crawl';

interface CrawlResult {
  url: string;
  images: ExtractedImage[];
  totalImages: number;
}

export function useCrawl() {
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawledUrl, setCrawledUrl] = useState<string | null>(null);

  const crawlUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setImages([]);
    setCrawledUrl(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        const result: CrawlResult = data.data;
        setImages(result.images);
        setCrawledUrl(result.url);
      } else {
        setError(data.error || 'Failed to crawl the URL');
      }
    } catch {
      setError('Failed to connect to the crawl service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setImages([]);
    setError(null);
    setCrawledUrl(null);
  }, []);

  return {
    images,
    isLoading,
    error,
    crawledUrl,
    crawlUrl,
    clearResults,
  };
}
