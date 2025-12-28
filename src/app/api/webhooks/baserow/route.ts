import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeResourceEnricher } from '@/lib/automations/resource-enricher';
import type { ResourceEnricherConfig, AutomationStepResult } from '@/types/automator';
import type { BaserowWebhookPayload } from '@/lib/baserow/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get automation ID from query params
    const { searchParams } = new URL(request.url);
    const automationId = searchParams.get('automationId');

    if (!automationId) {
      return NextResponse.json(
        { success: false, error: 'automationId query parameter required' },
        { status: 400 }
      );
    }

    // Parse webhook payload
    const payload: BaserowWebhookPayload = await request.json();

    // Only process rows.created events for now
    if (payload.event_type !== 'rows.created') {
      return NextResponse.json({
        success: true,
        message: `Event type ${payload.event_type} ignored`,
      });
    }

    // Find the automation
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    if (!automation.enabled) {
      return NextResponse.json({
        success: true,
        message: 'Automation is disabled',
      });
    }

    // Get items from payload (Baserow sends rows in items array)
    const items = payload.items || [];
    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No items in payload',
      });
    }

    // Create run records for all items first
    const runIds: string[] = [];
    for (const item of items) {
      const rowId = (item as { id?: number }).id;
      const run = await prisma.automationRun.create({
        data: {
          automationId: automation.id,
          status: 'pending',
          trigger: {
            type: 'webhook',
            event_type: payload.event_type,
            table_id: payload.table_id,
            row_id: rowId,
            row: item as object,
          } as object,
          steps: [],
        },
      });
      runIds.push(run.id);
    }

    // Return immediately - process async
    // Use setImmediate/setTimeout to process after response
    const processAsync = async () => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const runId = runIds[i];
        const rowId = (item as { id?: number }).id;
        const runStartTime = Date.now();

        // Mark as running
        await prisma.automationRun.update({
          where: { id: runId },
          data: { status: 'running' },
        });

        let steps: AutomationStepResult[] = [];
        let error: string | null = null;

        try {
          switch (automation.type) {
            case 'resource_enricher':
              steps = await executeResourceEnricher(
                automation.config as unknown as ResourceEnricherConfig,
                {
                  table_id: payload.table_id,
                  event_id: payload.event_id,
                  event_type: payload.event_type,
                  row_id: rowId || 0,
                  row: item,
                },
                runId // Pass runId for progressive step saving
              );
              break;
            default:
              throw new Error(`Unknown automation type: ${automation.type}`);
          }
        } catch (err) {
          error = err instanceof Error ? err.message : 'Execution failed';
          console.error('Automation execution error:', err);
        }

        // Determine final status
        const hasFailedStep = steps.some((s) => s.status === 'failed');
        const finalStatus = error || hasFailedStep ? 'failed' : 'completed';
        const duration = Date.now() - runStartTime;

        // Update run record
        await prisma.automationRun.update({
          where: { id: runId },
          data: {
            status: finalStatus,
            steps: steps as unknown as object,
            error: error || (hasFailedStep ? steps.find((s) => s.status === 'failed')?.error : null),
            duration,
            completedAt: new Date(),
          },
        });
      }
    };

    // Fire and forget - don't await
    processAsync().catch((err) => {
      console.error('Async processing error:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook received, processing in background',
      runIds,
    });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Baserow webhook endpoint is ready',
  });
}
