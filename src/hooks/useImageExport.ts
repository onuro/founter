'use client';

import { useState, useCallback, RefObject, useRef, useEffect } from 'react';
import { toPng, toBlob } from 'html-to-image';

export interface ExportProgress {
  isExporting: boolean;
  progress: number; // 0-100
  stage: 'idle' | 'capturing' | 'converting' | 'complete';
}

export function useImageExport(elementRef: RefObject<HTMLDivElement | null>) {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    stage: 'idle',
  });
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    // Create worker using dynamic import for Next.js compatibility
    workerRef.current = new Worker(
      new URL('../workers/imageExportWorker.ts', import.meta.url)
    );

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadDataUrl = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, []);

  const exportAsPng = useCallback(async (filename = 'newsletter-image', pixelRatio = 1) => {
    if (!elementRef.current) return;

    setExportProgress({ isExporting: true, progress: 10, stage: 'capturing' });
    setError(null);

    try {
      setExportProgress({ isExporting: true, progress: 50, stage: 'converting' });

      const dataUrl = await toPng(elementRef.current, {
        pixelRatio,
        quality: 1,
      });

      setExportProgress({ isExporting: true, progress: 100, stage: 'complete' });
      downloadDataUrl(dataUrl, `${filename}.png`);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export image. Please try again.');
    } finally {
      // Small delay to show completion
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, stage: 'idle' });
      }, 300);
    }
  }, [elementRef, downloadDataUrl]);

  const exportAsWebp = useCallback(async (quality = 0.9, filename = 'newsletter-image', pixelRatio = 1) => {
    if (!elementRef.current) return;

    setExportProgress({ isExporting: true, progress: 5, stage: 'capturing' });
    setError(null);

    try {
      // Capture DOM to blob (this is async and relatively fast)
      const blob = await toBlob(elementRef.current, {
        pixelRatio,
      });

      if (!blob) {
        throw new Error('Failed to create blob');
      }

      setExportProgress({ isExporting: true, progress: 30, stage: 'converting' });

      // Check if Web Worker is available
      if (workerRef.current && typeof OffscreenCanvas !== 'undefined') {
        // Use Web Worker for WebP conversion (non-blocking)
        const webpBlob = await new Promise<Blob>((resolve, reject) => {
          const worker = workerRef.current!;

          const handleMessage = (e: MessageEvent) => {
            const result = e.data;

            if (result.type === 'progress') {
              // Map worker progress (10-100) to our range (30-95)
              const mappedProgress = 30 + (result.progress * 0.65);
              setExportProgress({
                isExporting: true,
                progress: mappedProgress,
                stage: 'converting',
              });
            } else if (result.type === 'success') {
              worker.removeEventListener('message', handleMessage);
              resolve(result.data);
            } else if (result.type === 'error') {
              worker.removeEventListener('message', handleMessage);
              reject(new Error(result.error));
            }
          };

          worker.addEventListener('message', handleMessage);
          worker.postMessage({ type: 'convertToWebP', blob, quality });
        });

        setExportProgress({ isExporting: true, progress: 100, stage: 'complete' });
        downloadBlob(webpBlob, `${filename}.webp`);
      } else {
        // Fallback: use main thread (blocking but works everywhere)
        console.warn('OffscreenCanvas not available, falling back to main thread');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });

        setExportProgress({ isExporting: true, progress: 80, stage: 'converting' });

        const webpUrl = canvas.toDataURL('image/webp', quality);

        setExportProgress({ isExporting: true, progress: 100, stage: 'complete' });
        downloadDataUrl(webpUrl, `${filename}.webp`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export image. Please try again.');
    } finally {
      // Small delay to show completion
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, stage: 'idle' });
      }, 300);
    }
  }, [elementRef, downloadBlob, downloadDataUrl]);

  return {
    exportAsPng,
    exportAsWebp,
    isExporting: exportProgress.isExporting,
    exportProgress,
    error,
  };
}
