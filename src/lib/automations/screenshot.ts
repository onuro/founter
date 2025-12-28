/**
 * Screenshot capture utility using Holyshot API
 * Captures screenshots in PNG and WebP formats
 */

const HOLYSHOT_BASE = 'https://shapi.app.runonflux.io';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  deviceScaleFactor?: number;
  delay?: number;
  blockTracking?: boolean;
  quality?: number; // Only for WebP
}

export interface ScreenshotResult {
  buffer: Buffer;
  format: 'png' | 'webp';
}

const DEFAULT_OPTIONS: ScreenshotOptions = {
  width: 1440,
  height: 900,
  deviceScaleFactor: 2,
  delay: 1200,
  blockTracking: true,
};

/**
 * Capture a screenshot of a URL using Holyshot API
 */
export async function captureScreenshot(
  url: string,
  format: 'png' | 'webp',
  holyshotToken?: string | null,
  options: ScreenshotOptions = {}
): Promise<ScreenshotResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Adjust delay for WebP (longer delay as per n8n workflow)
  if (format === 'webp' && !options.delay) {
    opts.delay = 2000;
  }

  // Build query parameters
  const params = new URLSearchParams({
    url: url,
    width: opts.width!.toString(),
    height: opts.height!.toString(),
    deviceScaleFactor: opts.deviceScaleFactor!.toString(),
    format: format,
    delay: opts.delay!.toString(),
    blockTracking: opts.blockTracking!.toString(),
  });

  // Add quality for WebP
  if (format === 'webp') {
    params.set('quality', (opts.quality || 75).toString());
  }

  const screenshotUrl = `${HOLYSHOT_BASE}/screenshot?${params.toString()}`;

  // Build headers (optional Bearer auth)
  const headers: Record<string, string> = {};
  if (holyshotToken) {
    headers['Authorization'] = `Bearer ${holyshotToken}`;
  }

  const response = await fetch(screenshotUrl, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Screenshot capture failed: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    format,
  };
}

/**
 * Capture both PNG and WebP screenshots in parallel
 */
export async function captureScreenshots(
  url: string,
  holyshotToken?: string | null
): Promise<{ png: ScreenshotResult; webp: ScreenshotResult }> {
  const [png, webp] = await Promise.all([
    captureScreenshot(url, 'png', holyshotToken),
    captureScreenshot(url, 'webp', holyshotToken),
  ]);

  return { png, webp };
}
