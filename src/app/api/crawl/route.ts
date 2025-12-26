import { NextResponse } from 'next/server';
import { CrawlResponse, ExtractedImage, ScrollOptions } from '@/types/crawl';
import { parseCookieString } from '@/lib/cookies';
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
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLLS = 150; // 5 minutes total (150 * 2s = 300s)

// Helper to sleep for polling
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, scrollOptions, cookies, loadMoreSelector } = body as {
      url: string;
      scrollOptions?: ScrollOptions;
      cookies?: string;
      loadMoreSelector?: string;
    };

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Build crawler config with optional scroll settings
    const crawlerConfig: Record<string, unknown> = {
      wait_until: 'networkidle',
      page_timeout: 300000,
      wait_for_images: true,
    };

    // Parse cookies if provided
    const parsedCookies = cookies ? parseCookieString(cookies) : [];

    // Add scroll options if enabled - use js_code for scrolling
    if (scrollOptions?.enabled) {
      // Generate JavaScript that scrolls the page and optionally clicks "Load more" buttons
      const loadMoreCode = loadMoreSelector
        ? `
            const loadMoreBtn = document.querySelector('${loadMoreSelector.replace(/'/g, "\\'")}');
            if (loadMoreBtn) {
              loadMoreBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
              await new Promise(r => setTimeout(r, 300));
              loadMoreBtn.click();
              await new Promise(r => setTimeout(r, ${scrollOptions.scrollDelay}));
            }
          `
        : '';

      const scrollScript = `
        (async () => {
          for (let i = 0; i < ${scrollOptions.scrollCount}; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, ${scrollOptions.scrollDelay}));
            ${loadMoreCode}
          }
        })();
      `;
      crawlerConfig.js_code = scrollScript;
      // Add extra wait time to allow images to load after scrolling
      const extraTime = loadMoreSelector ? 2 : 1; // Extra time if clicking load more
      crawlerConfig.delay_before_return_html = (scrollOptions.scrollCount * scrollOptions.scrollDelay) / 1000 + extraTime;
    }

    // Build browser config with optional cookies
    const browserConfig: Record<string, unknown> = {
      headless: true,
      java_script_enabled: true,
    };

    // Add cookies to browser config if provided
    if (parsedCookies.length > 0) {
      browserConfig.cookies = parsedCookies;
    }

    // Step 1: Submit crawl job (returns immediately with task_id)
    const jobResponse = await fetch(`${CRAWL4AI_BASE}/crawl/job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        crawler_config: crawlerConfig,
        browser_config: browserConfig,
      }),
    });

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text().catch(() => 'No error details');
      console.error(`Crawl4AI job submit error: ${jobResponse.status}`, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to start crawl job (${jobResponse.status})`,
          errorType: 'network',
        },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobData: any = await jobResponse.json();

    // Check if results are returned immediately (fast crawls) or if we need to poll
    let data: CrawlResponse;

    if (jobData.results && Array.isArray(jobData.results)) {
      // Results returned immediately - no polling needed
      console.log('Crawl completed immediately, no polling needed');
      data = { results: jobData.results, success: true };
    } else if (jobData.result) {
      // Single result returned immediately
      console.log('Single result returned immediately');
      data = { results: [jobData.result], success: true };
    } else if (jobData.task_id) {
      // Need to poll for results
      const taskId = jobData.task_id;
      console.log(`Polling for task: ${taskId}`);

      // Step 2: Poll for completion
      let pollCount = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let taskResult: any = null;

      while (pollCount < MAX_POLLS) {
        await sleep(POLL_INTERVAL);
        pollCount++;

        try {
          const statusResponse = await fetch(`${CRAWL4AI_BASE}/crawl/job/${taskId}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });

          if (!statusResponse.ok) {
            console.error(`Task status error: ${statusResponse.status}`);
            continue; // Keep polling on transient errors
          }

          taskResult = await statusResponse.json();
          console.log('Task status response:', JSON.stringify(taskResult).slice(0, 500));

          if (taskResult?.status === 'completed') {
            console.log('Task completed! Result keys:', taskResult.result ? Object.keys(taskResult.result) : 'no result field');
            break;
          }

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

          // Continue polling for 'pending' or 'processing' status
        } catch (pollError) {
          console.error('Poll error:', pollError);
          // Continue polling on transient errors
        }
      }

      // Check if we timed out
      if (!taskResult || taskResult.status !== 'completed') {
        return NextResponse.json(
          {
            success: false,
            error: 'Request timed out after 5 minutes',
            errorType: 'timeout',
            suggestions: [
              'This site may have heavy content or bot protection',
              'Try disabling scroll options to reduce crawl time',
              'Try a simpler page on the same site first',
            ],
          },
          { status: 500 }
        );
      }

      // The task response structure is: taskResult.result = { success, results: [...] }
      if (taskResult.result?.results && Array.isArray(taskResult.result.results)) {
        // Standard structure: result.results contains the crawl results
        data = { results: taskResult.result.results, success: true };
      } else if (taskResult.result?.success && taskResult.result) {
        // If result is the crawl result itself (single result)
        data = { results: [taskResult.result], success: true };
      } else if (taskResult.results && Array.isArray(taskResult.results)) {
        // Results directly on taskResult
        data = { results: taskResult.results, success: true };
      } else {
        console.error('No result found in task response. Keys:', Object.keys(taskResult), 'result keys:', taskResult.result ? Object.keys(taskResult.result) : 'none');
        data = { results: [], success: false };
      }
      console.log('Processed data - results count:', data.results.length);
    } else {
      // Unexpected response format
      console.error('Unexpected response format:', JSON.stringify(jobData).slice(0, 500));
      return NextResponse.json(
        { success: false, error: 'Unexpected response from crawler', errorType: 'crawl_error' },
        { status: 500 }
      );
    }

    if (!data.success || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to crawl the URL - no results returned', errorType: 'crawl_error' },
        { status: 500 }
      );
    }

    const result = data.results[0];
    console.log('Crawl result keys:', Object.keys(result));
    console.log('Has html:', !!result.html, 'length:', result.html?.length || 0);
    console.log('Has cleaned_html:', !!result.cleaned_html, 'length:', result.cleaned_html?.length || 0);
    console.log('Has media.images:', !!result.media?.images, 'count:', result.media?.images?.length || 0);

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

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        images,
        totalImages: images.length,
        scrollUsed: scrollOptions?.enabled ? {
          scrollCount: scrollOptions.scrollCount,
          scrollDelay: scrollOptions.scrollDelay,
        } : null,
      },
    });
  } catch (error) {
    console.error('Crawl error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to crawl the URL',
        errorType: 'unknown',
      },
      { status: 500 }
    );
  }
}
