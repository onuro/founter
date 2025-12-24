// Web Worker for image export operations
// Handles WebP conversion using OffscreenCanvas to avoid blocking main thread

interface ExportMessage {
  type: 'convertToWebP';
  blob: Blob;
  quality: number;
}

interface ExportResult {
  type: 'success' | 'error' | 'progress';
  data?: Blob;
  error?: string;
  progress?: number;
}

self.onmessage = async (e: MessageEvent<ExportMessage>) => {
  const { type, blob, quality } = e.data;

  if (type === 'convertToWebP') {
    try {
      // Report progress: starting
      self.postMessage({ type: 'progress', progress: 10 } as ExportResult);

      // Create ImageBitmap from blob
      const imageBitmap = await createImageBitmap(blob);

      // Report progress: image loaded
      self.postMessage({ type: 'progress', progress: 40 } as ExportResult);

      // Create OffscreenCanvas with image dimensions
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw image to canvas
      ctx.drawImage(imageBitmap, 0, 0);

      // Report progress: drawn to canvas
      self.postMessage({ type: 'progress', progress: 70 } as ExportResult);

      // Convert to WebP blob
      const webpBlob = await canvas.convertToBlob({
        type: 'image/webp',
        quality,
      });

      // Report progress: complete
      self.postMessage({ type: 'progress', progress: 100 } as ExportResult);

      // Send back the WebP blob
      self.postMessage({ type: 'success', data: webpBlob } as ExportResult);

      // Clean up
      imageBitmap.close();
    } catch (err) {
      self.postMessage({
        type: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      } as ExportResult);
    }
  }
};

export {}; // Make this a module
