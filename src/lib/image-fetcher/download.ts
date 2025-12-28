import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ExtractedImage } from '@/types/crawl';

export interface DownloadedImage {
  originalUrl: string;
  localPath: string;
  filename: string;
  width: number | null;
  alt: string | null;
  link: string | null;
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
 * Download images to filesystem
 */
export async function downloadImages(
  images: ExtractedImage[],
  savedId: string
): Promise<DownloadedImage[]> {
  const baseDir = join(process.cwd(), 'public', 'imgfetcher-saved-images', savedId);

  // Create directory
  await mkdir(baseDir, { recursive: true });

  const results: DownloadedImage[] = [];
  let index = 1;

  for (const image of images) {
    try {
      // Fetch image
      const response = await fetch(image.src, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to download ${image.src}: ${response.status}`);
        continue;
      }

      const contentType = response.headers.get('content-type');
      const extension = getExtension(image.src, contentType);
      const filename = `image-${String(index).padStart(3, '0')}${extension}`;
      const filePath = join(baseDir, filename);
      const localPath = `/imgfetcher-saved-images/${savedId}/${filename}`;

      // Get image data as buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Write to file
      await writeFile(filePath, buffer);

      results.push({
        originalUrl: image.src,
        localPath,
        filename,
        width: image.width ?? null,
        alt: image.alt ?? null,
        link: image.link ?? null,
      });

      index++;
    } catch (error) {
      console.warn(`Error downloading ${image.src}:`, error);
      continue;
    }
  }

  return results;
}

/**
 * Delete saved images folder
 */
export async function deleteSavedImagesFolder(savedId: string): Promise<void> {
  const { rm } = await import('fs/promises');
  const baseDir = join(process.cwd(), 'public', 'imgfetcher-saved-images', savedId);

  try {
    await rm(baseDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to delete folder ${baseDir}:`, error);
  }
}
