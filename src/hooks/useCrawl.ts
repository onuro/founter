'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ExtractedImage, ScrollOptions, CrawlErrorType } from '@/types/crawl';

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

interface CrawlError {
  message: string;
  type?: CrawlErrorType;
  suggestions?: string[];
}

export function useCrawl() {
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CrawlError | null>(null);
  const [crawledUrl, setCrawledUrl] = useState<string | null>(null);
  const [scrollUsed, setScrollUsed] = useState<ScrollUsedInfo | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for timing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const crawlUrl = useCallback(async (
    url: string,
    scrollOptions?: ScrollOptions,
    cookies?: string,
    loadMoreSelector?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setImages([]);
    setCrawledUrl(null);
    setScrollUsed(null);
    setElapsedSeconds(0);

    // Start elapsed time tracking
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scrollOptions, cookies, loadMoreSelector }),
      });

      const data = await response.json();

      if (data.success) {
        const result: CrawlResult = data.data;
        setImages(result.images);
        setCrawledUrl(result.url);
        setScrollUsed(result.scrollUsed);
      } else {
        setError({
          message: data.error || 'Failed to crawl the URL',
          type: data.errorType,
          suggestions: data.suggestions,
        });
      }
    } catch {
      setError({
        message: 'Failed to connect to the crawl service',
        type: 'network',
      });
    } finally {
      // Stop elapsed time tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setImages([]);
    setError(null);
    setCrawledUrl(null);
    setScrollUsed(null);
    setElapsedSeconds(0);
  }, []);

  return {
    images,
    isLoading,
    error,
    crawledUrl,
    scrollUsed,
    elapsedSeconds,
    crawlUrl,
    clearResults,
  };
}
