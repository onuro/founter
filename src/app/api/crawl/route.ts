import { NextResponse } from 'next/server';
import { ScrollOptions } from '@/types/crawl';
import { parseCookieString } from '@/lib/cookies';

const CRAWL4AI_BASE = 'https://krawl.reaktorstudios.com';

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

    // Submit crawl job (returns immediately with task_id)
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

    // Check if results are returned immediately (fast crawls) - some simple pages return instantly
    if (jobData.results && Array.isArray(jobData.results)) {
      // Results returned immediately - return with special flag
      console.log('Crawl completed immediately, no polling needed');
      return NextResponse.json({
        success: true,
        taskId: null, // No taskId means immediate completion
        status: 'completed',
        immediateResult: jobData.results[0],
        scrollEnabled: scrollOptions?.enabled ?? false,
      });
    } else if (jobData.result) {
      // Single result returned immediately
      console.log('Single result returned immediately');
      return NextResponse.json({
        success: true,
        taskId: null,
        status: 'completed',
        immediateResult: jobData.result,
        scrollEnabled: scrollOptions?.enabled ?? false,
      });
    } else if (jobData.task_id) {
      // Need to poll for results - return taskId for client-side polling
      console.log(`Submitted crawl job: ${jobData.task_id}`);
      return NextResponse.json({
        success: true,
        taskId: jobData.task_id,
        status: 'processing',
        scrollEnabled: scrollOptions?.enabled ?? false,
      });
    } else {
      // Unexpected response format
      console.error('Unexpected response format:', JSON.stringify(jobData).slice(0, 500));
      return NextResponse.json(
        { success: false, error: 'Unexpected response from crawler', errorType: 'crawl_error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Crawl submit error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit crawl job',
        errorType: 'unknown',
      },
      { status: 500 }
    );
  }
}
