import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ExtractedImage } from '@/types/crawl';

// Download settings
const BATCH_SIZE = 10;
const BATCH_DELAY = 200; // ms between batches
const MAX_RETRIES = 3;

export interface DownloadedImage {
  originalUrl: string;
  localPath: string;
  filename: string;
  width: number | null;
  alt: string | null;
  link: string | null;
}

export interface DownloadProgress {
  downloaded: number;
  failed: number;
  total: number;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get file extension from URL or content-type
 */
function getExtension(url: string, contentType?: string | null): string {
  // Try to get from content-type first
  if (contentType) {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/avif': '.avif',
    };
    const ext = mimeToExt[contentType.split(';')[0].trim()];
    if (ext) return ext;
  }

  // Try to get from URL
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.(jpe?g|png|gif|webp|svg|avif)$/i);
    if (match) return '.' + match[1].toLowerCase();
  } catch {
    // Invalid URL, continue
  }

  // Default to jpg
  return '.jpg';
}

/**
 * Download a single image with retry on 429
 */
async function downloadSingleImage(
  image: ExtractedImage,
  baseDir: string,
  index: number,
  attempt = 0
): Promise<DownloadedImage | null> {
  try {
    const response = await fetch(image.src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    // Retry on rate limit
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const backoffMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
      console.log(`Rate limited, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await sleep(backoffMs);
      return downloadSingleImage(image, baseDir, index, attempt + 1);
    }

    if (!response.ok) {
      console.warn(`Failed to download ${image.src}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    const extension = getExtension(image.src, contentType);
    const filename = `image-${String(index).padStart(3, '0')}${extension}`;
    const filePath = join(baseDir, filename);

    // Extract savedId from baseDir path
    const savedId = baseDir.split('/').pop() || '';
    const localPath = `/api/uploads/imgfetcher-saved-images/${savedId}/${filename}`;

    // Get image data as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to file
    await writeFile(filePath, buffer);

    return {
      originalUrl: image.src,
      localPath,
      filename,
      width: image.width ?? null,
      alt: image.alt ?? null,
      link: image.link ?? null,
    };
  } catch (error) {
    console.warn(`Error downloading ${image.src}:`, error);
    return null;
  }
}

/**
 * Download images in batches with progress callback
 */
export async function downloadImagesInBatches(
  images: ExtractedImage[],
  savedId: string,
  onProgress?: (progress: DownloadProgress) => Promise<void>
): Promise<DownloadedImage[]> {
  const baseDir = join(process.cwd(), 'uploads', 'imgfetcher-saved-images', savedId);

  // Create directory
  await mkdir(baseDir, { recursive: true });

  const results: DownloadedImage[] = [];
  let failedCount = 0;
  let imageIndex = 1;

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);

    // Download batch in parallel
    const batchPromises = batch.map((image, batchIndex) =>
      downloadSingleImage(image, baseDir, imageIndex + batchIndex)
    );

    const batchResults = await Promise.all(batchPromises);

    // Process results
    for (const result of batchResults) {
      if (result) {
        results.push(result);
      } else {
        failedCount++;
      }
      imageIndex++;
    }

    // Report progress
    if (onProgress) {
      await onProgress({
        downloaded: results.length,
        failed: failedCount,
        total: images.length,
      });
    }

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < images.length) {
      await sleep(BATCH_DELAY);
    }
  }

  return results;
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use downloadImagesInBatches instead
 */
export async function downloadImages(
  images: ExtractedImage[],
  savedId: string
): Promise<DownloadedImage[]> {
  return downloadImagesInBatches(images, savedId);
}

/**
 * Delete saved images folder
 */
export async function deleteSavedImagesFolder(savedId: string): Promise<void> {
  const { rm } = await import('fs/promises');
  const baseDir = join(process.cwd(), 'uploads', 'imgfetcher-saved-images', savedId);

  try {
    await rm(baseDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to delete folder ${baseDir}:`, error);
  }
}
