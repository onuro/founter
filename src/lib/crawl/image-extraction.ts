// Image extraction utilities for crawl processing

import { ExtractedImage } from '@/types/crawl';
import {
  getCleanImageUrl,
  extractWidthFromUrl,
  parseSrcset,
  isValidCdnUrl,
  getBaseImageUrl,
  getLargerImageUrl,
} from './url-utils';
import { MIN_IMAGE_WIDTH, isSmallUtilityImage } from './image-filter';

export function extractImagesFromHtml(html: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  // Use Set for O(1) deduplication instead of O(n) .some() check
  const seenUrls = new Set<string>();

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

    // Get clean URL (extract original from CDN + strip query params) and deduplicate with O(1) Set lookup
    const cleanSrc = getCleanImageUrl(finalSrc);
    if (!seenUrls.has(cleanSrc)) {
      seenUrls.add(cleanSrc);
      images.push({
        src: cleanSrc,
        alt,
        width: imageWidth || undefined
      });
    }
  }

  return images;
}

// Extract links from <a> tags that wrap images or are siblings within shot containers
// Returns a Map of image src -> parent/sibling <a> href
export function extractImageLinks(html: string, baseUrl?: string): Map<string, string> {
  const linkMap = new Map<string, string>();

  // Helper to make href absolute
  const makeAbsolute = (href: string, referenceUrl?: string): string | null => {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    if (href.startsWith('//')) {
      return 'https:' + href;
    }
    if (href.startsWith('/') && referenceUrl) {
      try {
        const urlObj = new URL(referenceUrl);
        return urlObj.origin + href;
      } catch {
        return null;
      }
    }
    return null;
  };

  // PATTERN 1: Traditional <a href="...">...<img src="...">...</a> wrapping
  const aTagRegex = /<a\s+([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = aTagRegex.exec(html)) !== null) {
    const aAttrs = match[1];
    const aContent = match[2];

    // Extract href from attributes
    const hrefMatch = aAttrs.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1];

    // Find img src within the <a> content
    const imgMatch = aContent.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*\/?>/i);
    if (!imgMatch) continue;

    let imgSrc = imgMatch[1];
    if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;

    if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
      const cleanSrc = getCleanImageUrl(imgSrc);
      // Prefer baseUrl (page URL) over imgSrc for resolving relative links
      const absoluteHref = makeAbsolute(href, baseUrl) || makeAbsolute(href, imgSrc);

      if (absoluteHref && !linkMap.has(cleanSrc)) {
        linkMap.set(cleanSrc, absoluteHref);
      }
    }
  }

  // PATTERN 2: Dribbble-style sibling links
  // Structure: <div class="shot-thumbnail-base">
  //              <figure><img src="..."></figure>
  //              <a class="shot-thumbnail-link" href="/shots/123">
  //            </div>
  // Match shot containers and extract both the image and the shot link
  const shotContainerRegex = /<div[^>]*class="[^"]*shot-thumbnail-base[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;

  while ((match = shotContainerRegex.exec(html)) !== null) {
    const containerContent = match[1];

    // Find the shot link (with class containing "shot-thumbnail-link" or "shot-link")
    const linkMatch = containerContent.match(/<a[^>]*class="[^"]*(?:shot-thumbnail-link|shot-link|dribbble-link)[^"]*"[^>]*href=["']([^"']+)["'][^>]*>/i)
      || containerContent.match(/<a[^>]*href=["']([^"']+)["'][^>]*class="[^"]*(?:shot-thumbnail-link|shot-link|dribbble-link)[^"]*"[^>]*>/i);

    if (!linkMatch) continue;

    const href = linkMatch[1];

    // Find any image in the container (usually in a figure)
    const imgMatches = containerContent.matchAll(/<img\s+[^>]*(?:src|srcset)=["']([^"']+)["'][^>]*>/gi);

    for (const imgMatch of imgMatches) {
      let imgSrc = imgMatch[1];

      // For srcset, take the first URL
      if (imgSrc.includes(' ')) {
        imgSrc = imgSrc.split(/\s+/)[0];
      }

      if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;

      if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
        const cleanSrc = getCleanImageUrl(imgSrc);

        // Only add if not already mapped
        if (!linkMap.has(cleanSrc)) {
          // Prefer baseUrl (page URL) over imgSrc for resolving relative links
          // This ensures /shots/123 becomes dribbble.com/shots/123, not cdn.dribbble.com/shots/123
          const absoluteHref = makeAbsolute(href, baseUrl) || makeAbsolute(href, imgSrc);
          if (absoluteHref) {
            linkMap.set(cleanSrc, absoluteHref);
          }
        }
      }
    }
  }

  // PATTERN 3: More general sibling pattern - find <figure><img></figure> followed by <a> with shot/link class
  // This catches variations of the pattern
  const figureWithLinkRegex = /<figure[^>]*>[\s\S]*?<img\s+[^>]*(?:src=["']([^"']+)["']|srcset=["']([^"']+)["'])[^>]*>[\s\S]*?<\/figure>[\s\S]{0,500}?<a[^>]*(?:class="[^"]*(?:shot|link|thumbnail)[^"]*"[^>]*)?href=["']([^"']+)["'][^>]*>/gi;

  while ((match = figureWithLinkRegex.exec(html)) !== null) {
    let imgSrc = match[1] || match[2];
    const href = match[3];

    if (!imgSrc || !href) continue;

    // For srcset, take the first URL
    if (imgSrc.includes(' ')) {
      imgSrc = imgSrc.split(/\s+/)[0];
    }

    if (imgSrc.startsWith('//')) imgSrc = 'https:' + imgSrc;

    if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://')) {
      const cleanSrc = getCleanImageUrl(imgSrc);

      if (!linkMap.has(cleanSrc)) {
        // Prefer baseUrl (page URL) over imgSrc for resolving relative links
        const absoluteHref = makeAbsolute(href, baseUrl) || makeAbsolute(href, imgSrc);
        if (absoluteHref) {
          linkMap.set(cleanSrc, absoluteHref);
        }
      }
    }
  }

  return linkMap;
}

export function deduplicateImages(images: ExtractedImage[]): ExtractedImage[] {
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
