'use client';

import { useState, useCallback } from 'react';
import { ExtractedImage, ScrollOptions } from '@/types/crawl';

interface ScrollUsedInfo {
  scrollCount: number;
  scrollDelay: number;
}

interface CrawlResult {
  url: string;
  images: ExtractedImage[];
  totalImages: number;
  scrollUsed: ScrollUsedInfo | null;
}

export function useCrawl() {
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawledUrl, setCrawledUrl] = useState<string | null>(null);
  const [scrollUsed, setScrollUsed] = useState<ScrollUsedInfo | null>(null);

  const crawlUrl = useCallback(async (url: string, scrollOptions?: ScrollOptions) => {
    setIsLoading(true);
    setError(null);
    setImages([]);
    setCrawledUrl(null);
    setScrollUsed(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scrollOptions }),
      });

      const data = await response.json();

      if (data.success) {
        const result: CrawlResult = data.data;
        setImages(result.images);
        setCrawledUrl(result.url);
        setScrollUsed(result.scrollUsed);
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
    setScrollUsed(null);
  }, []);

  return {
    images,
    isLoading,
    error,
    crawledUrl,
    scrollUsed,
    crawlUrl,
    clearResults,
  };
}
