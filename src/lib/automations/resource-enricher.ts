import { prisma } from '@/lib/prisma';
import { BaserowClient } from '@/lib/baserow/client';
import { createAIClient } from '@/lib/ai/client';
import { captureScreenshot, type ScreenshotResult } from './screenshot';
import type { ResourceEnricherConfig, AutomationStepResult } from '@/types/automator';
import type { BaserowWebhookPayload } from '@/lib/baserow/types';
import type { AIProvider } from '@/lib/ai/types';

const CRAWL4AI_BASE = 'https://krawl.reaktorstudios.com';

interface CrawlMarkdown {
  raw_markdown?: string;
  markdown_with_citations?: string;
  fit_markdown?: string;
}

interface CrawlResult {
  markdown?: CrawlMarkdown | string;
  html?: string;
  cleaned_html?: string;
}

/**
 * Crawl a URL and extract content
 */
async function crawlUrl(url: string): Promise<CrawlResult> {
  // Submit crawl job
  const response = await fetch(`${CRAWL4AI_BASE}/crawl/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls: [url],
      crawler_config: {
        // Use domcontentloaded instead of networkidle - much faster
        wait_until: 'domcontentloaded',
        page_timeout: 30000, // 30 seconds page timeout
        wait_for_images: false,
      },
      browser_config: {
        headless: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to submit crawl job: ${response.status} - ${errorText}`);
  }

  const jobData = await response.json();

  // If immediate result returned
  if (jobData.results?.[0]) {
    return jobData.results[0];
  }

  // Poll for result
  if (jobData.task_id) {
    const taskId = jobData.task_id;
    const maxAttempts = 45; // 45 attempts × 2 seconds = 90 seconds max
    const pollInterval = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`${CRAWL4AI_BASE}/crawl/job/${taskId}`);
      if (!statusResponse.ok) continue;

      const statusData = await statusResponse.json();
      // Results can be in statusData.results or statusData.result.results
      const results = statusData.results || statusData.result?.results;
      if (statusData.status === 'completed' && results?.[0]) {
        return results[0];
      }
      if (statusData.status === 'failed') {
        const errorMsg = statusData.error || results?.[0]?.error || 'Unknown error';
        throw new Error(`Crawl job failed: ${errorMsg}`);
      }
    }

    throw new Error('Crawl job timed out after 90 seconds');
  }

  throw new Error('No task ID or results returned from crawler');
}

/**
 * Get API key for the specified provider from settings
 */
async function getAPIKey(provider: AIProvider): Promise<string> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    throw new Error('Settings not found');
  }

  switch (provider) {
    case 'openai':
      if (!settings.openaiKey) throw new Error('OpenAI API key not configured');
      return settings.openaiKey;
    case 'anthropic':
      if (!settings.anthropicKey) throw new Error('Anthropic API key not configured');
      return settings.anthropicKey;
    case 'glm':
      if (!settings.glmKey) throw new Error('GLM API key not configured');
      return settings.glmKey;
    case 'deepseek':
      if (!settings.deepseekKey) throw new Error('DeepSeek API key not configured');
      return settings.deepseekKey;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get Baserow credentials from settings
 */
async function getBaserowCredentials(): Promise<{
  host: string;
  username: string;
  password: string;
}> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  });

  if (!settings?.baserowHost || !settings?.baserowUsername || !settings?.baserowPassword) {
    throw new Error('Baserow credentials not configured');
  }

  return {
    host: settings.baserowHost,
    username: settings.baserowUsername,
    password: settings.baserowPassword,
  };
}

/**
 * Get Holyshot token from settings (optional)
 */
async function getHolyshotToken(): Promise<string | null> {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  });

  return settings?.holyshotToken || null;
}

/**
 * Save step progress to the database
 */
async function saveStepProgress(runId: string, steps: AutomationStepResult[]): Promise<void> {
  await prisma.automationRun.update({
    where: { id: runId },
    data: {
      steps: steps as unknown as object,
    },
  });
}

/**
 * Execute Resource Enricher automation with progressive step saving
 */
export async function executeResourceEnricher(
  config: ResourceEnricherConfig,
  trigger: BaserowWebhookPayload,
  runId?: string
): Promise<AutomationStepResult[]> {
  const steps: AutomationStepResult[] = [];
  let startTime: number;

  // Helper to add step and save progress
  const addStep = async (step: AutomationStepResult) => {
    steps.push(step);
    if (runId) {
      await saveStepProgress(runId, steps);
    }
  };

  // Step 1: Extract URL from row
  startTime = Date.now();
  const url = trigger.row?.[config.baserow.urlField];
  if (!url || typeof url !== 'string') {
    await addStep({
      name: 'extract_url',
      status: 'failed',
      duration: Date.now() - startTime,
      error: `URL field "${config.baserow.urlField}" is empty or not found in row`,
    });
    return steps;
  }
  await addStep({
    name: 'extract_url',
    status: 'success',
    duration: Date.now() - startTime,
    data: { url },
  });

  // Step 2: Crawl URL
  startTime = Date.now();
  let crawlResult: CrawlResult;
  try {
    crawlResult = await crawlUrl(url);
    await addStep({
      name: 'crawl_url',
      status: 'success',
      duration: Date.now() - startTime,
      data: {
        hasMarkdown: !!crawlResult.markdown,
        contentLength: typeof crawlResult.markdown === 'string'
          ? crawlResult.markdown.length
          : crawlResult.cleaned_html?.length || 0,
      },
    });
  } catch (error) {
    await addStep({
      name: 'crawl_url',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Failed to crawl URL',
    });
    return steps;
  }

  // Step 3: AI Summarize (optional)
  let summary: { short: string; long: string } | null = null;

  if (config.ai.enabled) {
    startTime = Date.now();
    // Extract markdown - it can be an object with raw_markdown or a string
    let markdownContent = '';
    if (crawlResult.markdown) {
      if (typeof crawlResult.markdown === 'string') {
        markdownContent = crawlResult.markdown;
      } else if (crawlResult.markdown.raw_markdown) {
        markdownContent = crawlResult.markdown.raw_markdown;
      }
    }
    const content = markdownContent || crawlResult.cleaned_html || crawlResult.html || '';
    if (!content) {
      await addStep({
        name: 'ai_summarize',
        status: 'failed',
        duration: Date.now() - startTime,
        error: 'No content extracted from page',
      });
      return steps;
    }

    try {
      const apiKey = await getAPIKey(config.ai.provider);
      const aiClient = createAIClient(config.ai.provider, apiKey, config.ai.model);
      summary = await aiClient.summarize(content, {
        shortMaxLength: config.ai.shortMaxLength,
        longMaxLength: config.ai.longMaxLength,
      });
      await addStep({
        name: 'ai_summarize',
        status: 'success',
        duration: Date.now() - startTime,
        data: {
          shortLength: summary.short.length,
          longLength: summary.long.length,
        },
      });
    } catch (error) {
      await addStep({
        name: 'ai_summarize',
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Failed to summarize content',
      });
      return steps;
    }
  } else {
    await addStep({
      name: 'ai_summarize',
      status: 'skipped',
      duration: 0,
      data: { reason: 'AI summarization disabled' },
    });
  }

  // Step 4: Capture Screenshots (only if enableImageFields is true)
  let pngScreenshot: ScreenshotResult | null = null;
  let webpScreenshot: ScreenshotResult | null = null;

  if (config.baserow.enableImageFields && (config.baserow.pngField || config.baserow.webpField)) {
    const holyshotToken = await getHolyshotToken();

    // Capture PNG screenshot
    if (config.baserow.pngField) {
      startTime = Date.now();
      try {
        pngScreenshot = await captureScreenshot(url, 'png', holyshotToken);
        await addStep({
          name: 'capture_png',
          status: 'success',
          duration: Date.now() - startTime,
          data: { size: pngScreenshot.buffer.length },
        });
      } catch (error) {
        await addStep({
          name: 'capture_png',
          status: 'failed',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Failed to capture PNG screenshot',
        });
        // Don't return - continue with other steps
      }
    }

    // Capture WebP screenshot
    if (config.baserow.webpField) {
      startTime = Date.now();
      try {
        webpScreenshot = await captureScreenshot(url, 'webp', holyshotToken);
        await addStep({
          name: 'capture_webp',
          status: 'success',
          duration: Date.now() - startTime,
          data: { size: webpScreenshot.buffer.length },
        });
      } catch (error) {
        await addStep({
          name: 'capture_webp',
          status: 'failed',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Failed to capture WebP screenshot',
        });
        // Don't return - continue with other steps
      }
    }
  }

  // Step 5: Upload files and update Baserow row
  startTime = Date.now();
  try {
    const credentials = await getBaserowCredentials();
    const baserow = new BaserowClient(credentials.host);
    await baserow.login(credentials.username, credentials.password);

    const rowId = trigger.row_id || (trigger.row as { id?: number })?.id;
    if (!rowId) {
      throw new Error('No row_id found in trigger');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Add summary fields only if AI summarization was enabled and successful
    if (summary) {
      updateData[config.baserow.shortDescField] = summary.short;
      updateData[config.baserow.longDescField] = summary.long;
    }

    // Upload and add PNG file if captured
    if (pngScreenshot && config.baserow.pngField) {
      try {
        const pngFilename = `screenshot-${rowId}.png`;
        const pngFile = await baserow.uploadFile(pngScreenshot.buffer, pngFilename, 'image/png');
        updateData[config.baserow.pngField] = [{ name: pngFile.name }];
        await addStep({
          name: 'upload_png',
          status: 'success',
          duration: 0, // Will be part of update_baserow duration
          data: { filename: pngFile.name },
        });
      } catch (error) {
        await addStep({
          name: 'upload_png',
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Failed to upload PNG',
        });
        // Don't fail the entire operation
      }
    }

    // Upload and add WebP file if captured
    if (webpScreenshot && config.baserow.webpField) {
      try {
        const webpFilename = `screenshot-${rowId}.webp`;
        const webpFile = await baserow.uploadFile(webpScreenshot.buffer, webpFilename, 'image/webp');
        updateData[config.baserow.webpField] = [{ name: webpFile.name }];
        await addStep({
          name: 'upload_webp',
          status: 'success',
          duration: 0, // Will be part of update_baserow duration
          data: { filename: webpFile.name },
        });
      } catch (error) {
        await addStep({
          name: 'upload_webp',
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Failed to upload WebP',
        });
        // Don't fail the entire operation
      }
    }

    // Update the row with all data
    await baserow.updateRow(config.baserow.tableId, rowId, updateData);

    await addStep({
      name: 'update_baserow',
      status: 'success',
      duration: Date.now() - startTime,
      data: { rowId, fieldsUpdated: Object.keys(updateData) },
    });
  } catch (error) {
    await addStep({
      name: 'update_baserow',
      status: 'failed',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Failed to update Baserow row',
    });
    return steps;
  }

  return steps;
}
