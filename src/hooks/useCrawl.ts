'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ExtractedImage, ScrollOptions, CrawlErrorType, CrawlPhase } from '@/types/crawl';

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLLS = 150; // 5 minutes total (150 * 2s = 300s)

interface ScrollUsedInfo {
  scrollCount: number;
  scrollDelay: number;
}

interface CrawlError {
  message: string;
  type?: CrawlErrorType;
  suggestions?: string[];
}

// Process immediate result from submit response
async function processImmediateResult(result: unknown): Promise<ExtractedImage[]> {
  // For immediate results, we need to process them client-side
  // This is a simplified version - the full processing happens server-side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = result as any;
  if (r?.media?.images) {
    return r.media.images
      .filter((img: { src?: string }) => img.src?.startsWith('http'))
      .map((img: { src: string; alt?: string; width?: number }) => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
      }));
  }
  return [];
}

export function useCrawl() {
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CrawlError | null>(null);
  const [crawledUrl, setCrawledUrl] = useState<string | null>(null);
  const [scrollUsed, setScrollUsed] = useState<ScrollUsedInfo | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState<CrawlPhase>('submitting');

  // Refs for timing and polling
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef(false);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (pollRef.current) {
        clearTimeout(pollRef.current);
      }
      abortRef.current = true;
    };
  }, []);

  const crawlUrl = useCallback(async (
    url: string,
    scrollOptions?: ScrollOptions,
    cookies?: string,
    loadMoreSelector?: string
  ) => {
    // Reset state
    setIsLoading(true);
    setError(null);
    setImages([]);
    setCrawledUrl(null);
    setScrollUsed(null);
    setElapsedSeconds(0);
    setPhase('submitting');
    abortRef.current = false;

    // Start elapsed time tracking
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    try {
      // Step 1: Submit crawl job
      const submitResponse = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scrollOptions, cookies, loadMoreSelector }),
      });

      const submitData = await submitResponse.json();

      if (!submitData.success) {
        setError({
          message: submitData.error || 'Failed to submit crawl job',
          type: submitData.errorType,
          suggestions: submitData.suggestions,
        });
        return;
      }

      // Handle immediate completion (fast crawls)
      if (submitData.status === 'completed' && submitData.immediateResult) {
        setPhase('extracting');
        const processedImages = await processImmediateResult(submitData.immediateResult);
        setImages(processedImages);
        setCrawledUrl(submitData.immediateResult.url || url);
        if (submitData.scrollEnabled && scrollOptions?.enabled) {
          setScrollUsed({
            scrollCount: scrollOptions.scrollCount,
            scrollDelay: scrollOptions.scrollDelay,
          });
        }
        setPhase('complete');
        return;
      }

      // Step 2: Poll for results
      const taskId = submitData.taskId;
      const scrollEnabled = submitData.scrollEnabled;

      // Set initial polling phase
      setPhase(scrollEnabled ? 'scrolling' : 'loading');

      let pollCount = 0;

      const poll = async () => {
        if (abortRef.current || pollCount >= MAX_POLLS) {
          if (pollCount >= MAX_POLLS) {
            setError({
              message: 'Request timed out after 5 minutes',
              type: 'timeout',
              suggestions: [
                'This site may have heavy content or bot protection',
                'Try disabling scroll options to reduce crawl time',
                'Try a simpler page on the same site first',
              ],
            });
          }
          return;
        }

        pollCount++;

        try {
          const statusResponse = await fetch(`/api/crawl/${taskId}`);
          const statusData = await statusResponse.json();

          if (!statusData.success && statusData.error) {
            setError({
              message: statusData.error,
              type: statusData.errorType,
              suggestions: statusData.suggestions,
            });
            return;
          }

          if (statusData.status === 'processing') {
            // Still processing - continue polling
            pollRef.current = setTimeout(poll, POLL_INTERVAL);
            return;
          }

          if (statusData.status === 'completed') {
            // Done! Set extracting phase briefly, then complete
            setPhase('extracting');

            // Small delay to show extracting phase
            await new Promise(r => setTimeout(r, 300));

            if (statusData.data) {
              setImages(statusData.data.images || []);
              setCrawledUrl(statusData.data.url || url);
            }

            if (scrollEnabled && scrollOptions?.enabled) {
              setScrollUsed({
                scrollCount: scrollOptions.scrollCount,
                scrollDelay: scrollOptions.scrollDelay,
              });
            }

            setPhase('complete');
            return;
          }
        } catch (pollError) {
          console.error('Poll error:', pollError);
          // Continue polling on transient errors
          pollRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      };

      // Start polling
      pollRef.current = setTimeout(poll, POLL_INTERVAL);
    } catch {
      setError({
        message: 'Failed to connect to the crawl service',
        type: 'network',
      });
    } finally {
      // Stop elapsed time tracking when we're done
      // Note: This runs immediately after the try/catch, but polling continues async
    }
  }, []);

  // Stop loading state when complete or error
  useEffect(() => {
    if (phase === 'complete' || error) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (pollRef.current) {
        clearTimeout(pollRef.current);
        pollRef.current = null;
      }
      setIsLoading(false);
    }
  }, [phase, error]);

  const clearResults = useCallback(() => {
    setImages([]);
    setError(null);
    setCrawledUrl(null);
    setScrollUsed(null);
    setElapsedSeconds(0);
    setPhase('submitting');
    abortRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  return {
    images,
    isLoading,
    error,
    crawledUrl,
    scrollUsed,
    elapsedSeconds,
    phase,
    crawlUrl,
    clearResults,
  };
}
