import { NextResponse } from 'next/server';
import { CrawlResponse, ExtractedImage, ScrollOptions } from '@/types/crawl';

const CRAWL4AI_URL = 'https://krawl.reaktorstudios.com/crawl';

// Minimum width to filter out small icons/thumbnails
const MIN_IMAGE_WIDTH = 700;

// Strip query parameters from URL to get full resolution image
function stripQueryParams(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch {
    // If URL parsing fails, try simple string split
    return url.split('?')[0];
  }
}

// Clean Cloudflare CDN URL by removing width/height params but keeping other optimizations
// Input:  /cdn-cgi/image/width=390,height=520,fit=cover,format=jpg,quality=85/path/image.jpg
// Output: /cdn-cgi/image/fit=cover,format=jpg,quality=85/path/image.jpg
function cleanCdnUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Check for Cloudflare CDN pattern
    const cfMatch = pathname.match(/^(\/cdn-cgi\/image\/)([^/]+)(\/.*)?$/);
    if (cfMatch) {
      const prefix = cfMatch[1];         // /cdn-cgi/image/
      const params = cfMatch[2];         // width=390,height=520,fit=cover,...
      const imagePath = cfMatch[3] || ''; // /wp-content/uploads/.../image.jpg

      // Remove width and height params, keep the rest
      const cleanedParams = params
        .split(',')
        .filter(p => !p.startsWith('width=') && !p.startsWith('height='))
        .join(',');

      // Reconstruct URL with cleaned params
      if (cleanedParams) {
        return urlObj.origin + prefix + cleanedParams + imagePath;
      } else {
        // If no params left, just return the image path
        return urlObj.origin + imagePath;
      }
    }

    return url;
  } catch {
    return url;
  }
}

// Get clean image URL by cleaning CDN params and stripping query params
function getCleanImageUrl(url: string): string {
  // First clean CDN URL (remove width/height but keep other params)
  const cleanedUrl = cleanCdnUrl(url);
  // Then strip any query parameters
  return stripQueryParams(cleanedUrl);
}

interface SrcsetEntry {
  url: string;
  width: number;
}

// Normalize URL to find duplicate images served at different sizes
// This strips size-related patterns to get a "base" identifier for the same image
function getBaseImageUrl(url: string): string {
  return url
    // Dribbble patterns: teaser-, normal-, original-
    .replace(/\/(teaser|normal|original|small|medium|large|mini|tiny|preview)-/gi, '/BASE-')
    // Common size suffixes: _800x600, -800x600
    .replace(/[_-]\d+x\d+/g, '')
    // Width patterns: _800w, -800w
    .replace(/[_-]\d+w\b/g, '')
    // DPR patterns: @2x, _2x, -2x, @3x
    .replace(/[@_-][123]x(?=\.|$)/gi, '')
    // Query params: ?w=800, &h=600, ?size=large, ?resize=800x600
    .replace(/[?&](w|h|width|height|size|resize|quality|q)=[^&]*/gi, '')
    // Path segments with sizes: /800x600/, /w_800/
    .replace(/\/\d+x\d+\//g, '/SIZE/')
    .replace(/\/w_\d+\//g, '/SIZE/')
    // Cloudinary/imgix transforms
    .replace(/\/c_[^/]+/g, '')
    .replace(/\/f_[^/]+/g, '')
    .toLowerCase();
}

// Determine which URL is likely the larger/original image
function getLargerImageUrl(url1: string, url2: string): string {
  const lower1 = url1.toLowerCase();
  const lower2 = url2.toLowerCase();

  // Prefer "original"
  if (lower1.includes('/original-') || lower1.includes('/original/')) return url1;
  if (lower2.includes('/original-') || lower2.includes('/original/')) return url2;

  // Prefer "large"
  if (lower1.includes('/large-') || lower1.includes('/large/')) return url1;
  if (lower2.includes('/large-') || lower2.includes('/large/')) return url2;

  // Avoid "teaser", "mini", "tiny", "small", "preview", "thumb"
  const smallPatterns = ['/teaser-', '/mini-', '/tiny-', '/small-', '/preview-', '/thumb'];
  const isSmall1 = smallPatterns.some(p => lower1.includes(p));
  const isSmall2 = smallPatterns.some(p => lower2.includes(p));
  if (isSmall1 && !isSmall2) return url2;
  if (isSmall2 && !isSmall1) return url1;

  // Extract and compare widths from URL
  const width1 = extractWidthFromUrl(url1);
  const width2 = extractWidthFromUrl(url2);
  if (width1 && width2) return width1 > width2 ? url1 : url2;
  if (width1 && !width2) return url1;
  if (width2 && !width1) return url2;

  // Check DPR (@2x, @3x, etc.)
  const dpr1 = parseInt(url1.match(/[@_-](\d)x(?=\.|$)/i)?.[1] || '1', 10);
  const dpr2 = parseInt(url2.match(/[@_-](\d)x(?=\.|$)/i)?.[1] || '1', 10);
  if (dpr1 !== dpr2) return dpr1 > dpr2 ? url1 : url2;

  // Default to first
  return url1;
}

// Parse srcset attribute and return the largest image URL
// Handles URLs with commas (like Cloudflare CDN params)
function parseSrcset(srcset: string): SrcsetEntry | null {
  if (!srcset) return null;

  const entries: SrcsetEntry[] = [];

  // Split on descriptor patterns (1x, 2x, 100w, etc.) followed by comma or end
  // This handles URLs that contain commas (like Cloudflare CDN params)
  const regex = /(\S+)\s+(\d+(?:\.\d+)?)(x|w)(?:,\s*|$)/g;
  let match;

  while ((match = regex.exec(srcset)) !== null) {
    const url = match[1];
    const value = parseFloat(match[2]);
    const unit = match[3];

    if (unit === 'w') {
      entries.push({ url, width: value });
    } else {
      // x descriptor - treat as multiplier (assume base 100 for comparison)
      entries.push({ url, width: Math.round(value * 100) });
    }
  }

  if (entries.length === 0) return null;

  // Return the entry with the largest width
  return entries.reduce((max, entry) => entry.width > max.width ? entry : max);
}

// Extract width from URL patterns like "_200x150" or "-200w"
function extractWidthFromUrl(url: string): number | null {
  // Cloudflare CDN pattern: /cdn-cgi/image/width=XXX
  const cfWidthMatch = url.match(/\/cdn-cgi\/image\/[^/]*width=(\d+)/);
  if (cfWidthMatch) {
    return parseInt(cfWidthMatch[1], 10);
  }
  // Pattern: resize=WIDTHxHEIGHT (Dribbble/imgix style)
  const resizeMatch = url.match(/resize=(\d+)x\d+/);
  if (resizeMatch) {
    return parseInt(resizeMatch[1], 10);
  }
  // Pattern: /WIDTHx0/ or /WIDTHxHEIGHT/ in path (land-book.com style)
  const pathSizeMatch = url.match(/\/(\d+)x\d+\//);
  if (pathSizeMatch) {
    return parseInt(pathSizeMatch[1], 10);
  }
  // Pattern: _WIDTHxHEIGHT or -WIDTHxHEIGHT
  const sizeMatch = url.match(/[_-](\d+)x\d+/);
  if (sizeMatch) {
    return parseInt(sizeMatch[1], 10);
  }
  // Pattern: -WIDTHw or _WIDTHw
  const widthMatch = url.match(/[_-](\d+)w/);
  if (widthMatch) {
    return parseInt(widthMatch[1], 10);
  }
  // Pattern: ?w=WIDTH or &w=WIDTH
  const queryMatch = url.match(/[?&]w=(\d+)/);
  if (queryMatch) {
    return parseInt(queryMatch[1], 10);
  }
  return null;
}

// Check if a Cloudflare CDN URL is valid (has actual image path after params)
function isValidCdnUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Check for Cloudflare CDN pattern
    if (pathname.startsWith('/cdn-cgi/image/')) {
      // Valid CDN URL should have actual path after params: /cdn-cgi/image/params/actual/path.jpg
      // Invalid (truncated): /cdn-cgi/image/width=780 (no image path)
      const afterCdn = pathname.replace(/^\/cdn-cgi\/image\/[^/]+/, '');
      // Must have a path after the CDN params
      return afterCdn.length > 0 && afterCdn.startsWith('/');
    }

    return true; // Non-CDN URLs pass through
  } catch {
    return false;
  }
}

// Check if URL is likely a small icon/utility image
function isSmallUtilityImage(url: string): boolean {
  const lowercaseSrc = url.toLowerCase();

  // Common small image path patterns
  if (
    lowercaseSrc.includes('/icon') ||
    lowercaseSrc.includes('/favicon') ||
    lowercaseSrc.includes('/logo') ||
    lowercaseSrc.includes('/avatar') ||
    lowercaseSrc.includes('/badge') ||
    lowercaseSrc.includes('/emoji') ||
    lowercaseSrc.includes('1x1') ||
    lowercaseSrc.includes('pixel') ||
    lowercaseSrc.includes('/spinner') ||
    lowercaseSrc.includes('/loader') ||
    lowercaseSrc.includes('/users/') ||      // User profile images
    lowercaseSrc.includes('/profile') ||     // Profile images
    lowercaseSrc.includes('/member') ||      // Member avatars
    lowercaseSrc.includes('/author') ||      // Author thumbnails
    lowercaseSrc.includes('/thumb') ||       // Thumbnails
    lowercaseSrc.includes('_thumb') ||       // Thumbnails
    lowercaseSrc.includes('-thumb') ||       // Thumbnails
    lowercaseSrc.includes('/mini') ||        // Mini images
    lowercaseSrc.includes('_mini') ||        // Mini images
    lowercaseSrc.includes('/mini-') ||       // Mini images (Dribbble style)
    lowercaseSrc.includes('/small') ||       // Small variants
    lowercaseSrc.includes('_small') ||       // Small variants
    lowercaseSrc.includes('-small') ||       // Small variants
    lowercaseSrc.includes('/small-') ||      // Small variants (Dribbble style)
    lowercaseSrc.includes('/teaser-') ||     // Dribbble teaser thumbnails
    lowercaseSrc.includes('/tiny-') ||       // Tiny images
    lowercaseSrc.includes('/preview-') ||    // Preview thumbnails
    lowercaseSrc.includes('socialproof') ||  // Social proof testimonial images
    lowercaseSrc.includes('testimonial') ||  // Testimonial images
    lowercaseSrc.includes('/team/') ||       // Team member photos
    lowercaseSrc.includes('/staff/')         // Staff photos
  ) {
    return true;
  }

  // Check for small dimension patterns in URL
  // Patterns: resize=400x300, /600x0/, _400x300, -400x300
  const width = extractWidthFromUrl(url);
  if (width && width < MIN_IMAGE_WIDTH) {
    return true;
  }

  return false;
}

function extractImagesFromHtml(html: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];

  // Match all img tags
  const imgTagRegex = /<img[^>]*>/gi;
  let tagMatch;

  while ((tagMatch = imgTagRegex.exec(html)) !== null) {
    const imgTag = tagMatch[0];

    // Extract src
    const srcMatch = imgTag.match(/\bsrc=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1] : null;

    // Extract srcset
    const srcsetMatch = imgTag.match(/\bsrcset=["']([^"']+)["']/i);
    const srcset = srcsetMatch ? srcsetMatch[1] : null;

    // Extract alt
    const altMatch = imgTag.match(/\balt=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1] : '';

    // Extract width attribute
    const widthAttrMatch = imgTag.match(/\bwidth=["']?(\d+)["']?/i);
    const widthAttr = widthAttrMatch ? parseInt(widthAttrMatch[1], 10) : null;

    let finalSrc = src;
    let imageWidth = widthAttr;

    // If srcset exists, try to get the largest image
    if (srcset) {
      const largest = parseSrcset(srcset);
      if (largest && largest.url) {
        let largestUrl = largest.url;
        // Handle protocol-relative URLs
        if (largestUrl.startsWith('//')) {
          largestUrl = 'https:' + largestUrl;
        }
        if (largestUrl.startsWith('http://') || largestUrl.startsWith('https://')) {
          finalSrc = largestUrl;
          // Don't use srcset descriptor value (e.g., 200 for 2x) as pixel width
          // Extract actual width from URL instead, or keep the HTML width attribute
          const urlWidth = extractWidthFromUrl(largestUrl);
          if (urlWidth) {
            imageWidth = urlWidth;
          }
          // If no width in URL and no HTML attribute, leave imageWidth as null
          // to skip the MIN_IMAGE_WIDTH filter
        }
      }
    }

    // Validate URL
    if (!finalSrc || (!finalSrc.startsWith('http://') && !finalSrc.startsWith('https://'))) {
      continue;
    }

    // Skip truncated/invalid CDN URLs
    if (!isValidCdnUrl(finalSrc)) {
      continue;
    }

    // Try to extract width from URL if we don't have it
    if (!imageWidth) {
      imageWidth = extractWidthFromUrl(finalSrc);
    }

    // Filter out small images if we know the width
    if (imageWidth && imageWidth < MIN_IMAGE_WIDTH) {
      continue;
    }

    // Skip common icon/utility image patterns
    if (isSmallUtilityImage(finalSrc)) {
      continue;
    }

    // Get clean URL (extract original from CDN + strip query params) and deduplicate
    const cleanSrc = getCleanImageUrl(finalSrc);
    if (!images.some(img => img.src === cleanSrc)) {
      images.push({
        src: cleanSrc,
        alt,
        width: imageWidth || undefined
      });
    }
  }

  return images;
}

function deduplicateImages(images: ExtractedImage[]): ExtractedImage[] {
  // Group images by their normalized base URL
  const baseUrlMap = new Map<string, ExtractedImage>();

  for (const img of images) {
    const baseUrl = getBaseImageUrl(img.src);
    const existing = baseUrlMap.get(baseUrl);

    if (!existing) {
      baseUrlMap.set(baseUrl, img);
    } else {
      // Keep the larger version
      const largerUrl = getLargerImageUrl(existing.src, img.src);
      if (largerUrl === img.src) {
        baseUrlMap.set(baseUrl, img);
      }
    }
  }

  return Array.from(baseUrlMap.values());
}

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

  try {
    const body = await request.json();
    const { url, scrollOptions } = body as { url: string; scrollOptions?: ScrollOptions };

    if (!url) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Build crawler config with optional scroll settings
    const crawlerConfig: Record<string, unknown> = {
      wait_until: 'networkidle',
      page_timeout: 60000,
      wait_for_images: true,
    };

    // Add scroll options if enabled - use js_code for scrolling
    if (scrollOptions?.enabled) {
      // Generate JavaScript that scrolls the page multiple times
      const scrollScript = `
        (async () => {
          for (let i = 0; i < ${scrollOptions.scrollCount}; i++) {
            window.scrollTo(0, document.body.scrollHeight);
            await new Promise(r => setTimeout(r, ${scrollOptions.scrollDelay}));
          }
        })();
      `;
      crawlerConfig.js_code = scrollScript;
      // Add extra wait time to allow images to load after scrolling
      crawlerConfig.delay_before_return_html = (scrollOptions.scrollCount * scrollOptions.scrollDelay) / 1000 + 1;
    }

    const crawlResponse = await fetch(CRAWL4AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        crawler_config: crawlerConfig,
        browser_config: {
          headless: true,
          java_script_enabled: true,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text().catch(() => 'No error details');
      console.error(`Crawl4AI error: ${crawlResponse.status}`, errorText);

      if (crawlResponse.status === 504) {
        return NextResponse.json(
          { success: false, error: 'The page took too long to crawl. This site may have bot protection.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Crawl failed (${crawlResponse.status})` },
        { status: 500 }
      );
    }

    const data: CrawlResponse = await crawlResponse.json();

    if (!data.success || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to crawl the URL - no results returned' },
        { status: 500 }
      );
    }

    const result = data.results[0];
    let images: ExtractedImage[] = [];

    // PRIORITY 1: Try HTML extraction first (better srcset handling)
    if (result.html) {
      images = extractImagesFromHtml(result.html);
      images = deduplicateImages(images);
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
    clearTimeout(timeoutId);
    console.error('Crawl error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timed out. The page may be too heavy or have bot protection.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to crawl the URL' },
      { status: 500 }
    );
  }
}
