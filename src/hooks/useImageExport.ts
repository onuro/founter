'use client';

import { useState, useCallback, RefObject } from 'react';
import { toPng, toBlob } from 'html-to-image';

export function useImageExport(elementRef: RefObject<HTMLDivElement | null>) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = useCallback((dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, []);

  const exportAsPng = useCallback(async (filename = 'newsletter-image', pixelRatio = 1) => {
    if (!elementRef.current) return;

    setIsExporting(true);
    setError(null);

    try {
      const dataUrl = await toPng(elementRef.current, {
        pixelRatio,
        quality: 1,
      });
      downloadFile(dataUrl, `${filename}.png`);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [elementRef, downloadFile]);

  const exportAsWebp = useCallback(async (quality = 0.9, filename = 'newsletter-image', pixelRatio = 1) => {
    if (!elementRef.current) return;

    setIsExporting(true);
    setError(null);

    try {
      const blob = await toBlob(elementRef.current, {
        pixelRatio,
      });

      if (!blob) {
        throw new Error('Failed to create blob');
      }

      // Convert to WebP via canvas
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

      const webpUrl = canvas.toDataURL('image/webp', quality);
      downloadFile(webpUrl, `${filename}.webp`);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [elementRef, downloadFile]);

  return {
    exportAsPng,
    exportAsWebp,
    isExporting,
    error,
  };
}
