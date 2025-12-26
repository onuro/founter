import { NextResponse } from 'next/server';
import { CrawlResult, ExtractedImage } from '@/types/crawl';
import {
  extractImagesFromHtml,
  extractImageLinks,
  deduplicateImages,
} from '@/lib/crawl/image-extraction';
import {
  getCleanImageUrl,
  extractWidthFromUrl,
  isValidCdnUrl,
} from '@/lib/crawl/url-utils';
import {
  MIN_IMAGE_WIDTH,
  isSmallUtilityImage,
} from '@/lib/crawl/image-filter';

const CRAWL4AI_BASE = 'https://krawl.reaktorstudios.com';

// Process raw crawl result into extracted images
function processImages(result: CrawlResult): ExtractedImage[] {
  let images: ExtractedImage[] = [];

  // PRIORITY 1: Try HTML extraction first (better srcset handling)
  if (result.html) {
    images = extractImagesFromHtml(result.html);
    console.log('Images from HTML extraction:', images.length);
    images = deduplicateImages(images);
    console.log('After deduplication:', images.length);
  }

  // PRIORITY 2: Try cleaned_html if no images from raw html
  if (images.length === 0 && result.cleaned_html) {
    images = extractImagesFromHtml(result.cleaned_html);
    images = deduplicateImages(images);
  }

  // PRIORITY 3: Fallback to media.images if HTML extraction found nothing
  if (images.length === 0 && result.media?.images && result.media.images.length > 0) {
    // Use group_id for deduplication - keep only the largest image per group
    const groupMap = new Map<number | string, { img: typeof result.media.images[0]; width: number }>();

    for (const img of result.media.images) {
      // Skip invalid URLs
      if (!img.src || (!img.src.startsWith('http://') && !img.src.startsWith('https://'))) {
        continue;
      }

      // Skip truncated/invalid CDN URLs
      if (!isValidCdnUrl(img.src)) {
        continue;
      }

      // Skip utility images (avatars, icons, etc.)
      if (isSmallUtilityImage(img.src)) {
        continue;
      }

      // Get width from native field OR extract from URL
      const width = img.width ?? extractWidthFromUrl(img.src) ?? 0;

      // Skip images below minimum width
      if (width > 0 && width < MIN_IMAGE_WIDTH) {
        continue;
      }

      // Use group_id for deduplication, or src as fallback
      const groupKey = img.group_id ?? img.src;
      const existing = groupMap.get(groupKey);

      // Keep the largest version within each group
      if (!existing || width > existing.width) {
        groupMap.set(groupKey, { img, width });
      }
    }

    // Convert to ExtractedImage format and get clean URLs (extract from CDN + strip query params)
    images = Array.from(groupMap.values()).map(({ img, width }) => ({
      src: getCleanImageUrl(img.src),
      alt: img.alt || img.desc || '',
      width: width || undefined,
    }));
  }

  // Extract links from <a> tags that wrap images (two-pass approach - doesn't affect image extraction)
  let imageLinks = new Map<string, string>();
  if (result.html) {
    imageLinks = extractImageLinks(result.html, result.url);
    console.log('Found image links:', imageLinks.size);
  }

  // Merge links into images
  if (imageLinks.size > 0) {
    for (const img of images) {
      const link = imageLinks.get(img.src);
      if (link) {
        img.link = link;
      }
    }
    console.log('Images with links:', images.filter(img => img.link).length);
  }

  console.log('Final image count:', images.length);
  return images;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Poll Crawl4AI for task status
    const statusResponse = await fetch(`${CRAWL4AI_BASE}/crawl/job/${taskId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!statusResponse.ok) {
      console.error(`Task status error: ${statusResponse.status}`);
      return NextResponse.json(
        { success: false, error: `Failed to get task status (${statusResponse.status})`, errorType: 'network' },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskResult: any = await statusResponse.json();
    console.log('Task status response:', JSON.stringify(taskResult).slice(0, 500));

    // Still processing
    if (taskResult?.status === 'processing' || taskResult?.status === 'pending') {
      return NextResponse.json({
        success: true,
        status: 'processing',
      });
    }

    // Failed
    if (taskResult?.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: taskResult.error || 'Crawl job failed',
          errorType: 'crawl_error',
        },
        { status: 500 }
      );
    }

    // Completed - process and return results
    if (taskResult?.status === 'completed') {
      console.log('Task completed! Result keys:', taskResult.result ? Object.keys(taskResult.result) : 'no result field');

      // Extract the crawl result from various response structures
      let crawlResult: CrawlResult | null = null;

      if (taskResult.result?.results && Array.isArray(taskResult.result.results)) {
        crawlResult = taskResult.result.results[0];
      } else if (taskResult.result?.success && taskResult.result) {
        crawlResult = taskResult.result;
      } else if (taskResult.results && Array.isArray(taskResult.results)) {
        crawlResult = taskResult.results[0];
      }

      if (!crawlResult) {
        console.error('No result found in task response. Keys:', Object.keys(taskResult));
        return NextResponse.json(
          { success: false, error: 'Failed to extract crawl results', errorType: 'crawl_error' },
          { status: 500 }
        );
      }

      console.log('Crawl result keys:', Object.keys(crawlResult));
      console.log('Has html:', !!crawlResult.html, 'length:', crawlResult.html?.length || 0);
      console.log('Has cleaned_html:', !!crawlResult.cleaned_html, 'length:', crawlResult.cleaned_html?.length || 0);
      console.log('Has media.images:', !!crawlResult.media?.images, 'count:', crawlResult.media?.images?.length || 0);

      // Process images
      const images = processImages(crawlResult);

      return NextResponse.json({
        success: true,
        status: 'completed',
        data: {
          url: crawlResult.url,
          images,
          totalImages: images.length,
        },
      });
    }

    // Unknown status
    return NextResponse.json(
      { success: false, error: `Unknown task status: ${taskResult?.status}`, errorType: 'crawl_error' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Crawl status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get crawl status',
        errorType: 'unknown',
      },
      { status: 500 }
    );
  }
}
