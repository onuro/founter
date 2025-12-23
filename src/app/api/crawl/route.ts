import { NextResponse } from 'next/server';
import { CrawlResponse, ExtractedImage } from '@/types/crawl';

const CRAWL4AI_URL = 'https://krawl.reaktorstudios.com/crawl';

function extractImagesFromHtml(html: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const alt = match[2] || '';
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
      images.push({ src, alt });
    }
  }

  const imgRegex2 = /<img[^>]+alt=["']([^"']*)["'][^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgRegex2.exec(html)) !== null) {
    const alt = match[1] || '';
    const src = match[2];
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
      if (!images.some(img => img.src === src)) {
        images.push({ src, alt });
      }
    }
  }

  return images;
}

function deduplicateImages(images: ExtractedImage[]): ExtractedImage[] {
  const seen = new Set<string>();
  return images.filter(img => {
    if (seen.has(img.src)) return false;
    seen.add(img.src);
    return true;
  });
}

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const crawlResponse = await fetch(CRAWL4AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        crawler_config: {},
        browser_config: {},
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

    if (result.media?.images && result.media.images.length > 0) {
      images = result.media.images
        .filter(img => img.src && (img.src.startsWith('http://') || img.src.startsWith('https://')))
        .map(img => ({
          src: img.src,
          alt: img.alt || img.desc || '',
        }));
    }

    if (images.length === 0 && result.html) {
      images = extractImagesFromHtml(result.html);
    }

    if (images.length === 0 && result.cleaned_html) {
      images = extractImagesFromHtml(result.cleaned_html);
    }

    images = deduplicateImages(images);

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        images,
        totalImages: images.length,
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
