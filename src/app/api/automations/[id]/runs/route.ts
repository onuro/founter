import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { executeResourceEnricher } from '@/lib/automations/resource-enricher';
import type { ResourceEnricherConfig, AutomationRun, AutomationRunStatus, AutomationStepResult } from '@/types/automator';

function transformRun(dbRun: {
  id: string;
  automationId: string;
  status: string;
  trigger: unknown;
  steps: unknown;
  error: string | null;
  duration: number | null;
  startedAt: Date;
  completedAt: Date | null;
}): AutomationRun {
  return {
    id: dbRun.id,
    automationId: dbRun.automationId,
    status: dbRun.status as AutomationRunStatus,
    trigger: dbRun.trigger as AutomationRun['trigger'],
    steps: dbRun.steps as AutomationStepResult[],
    error: dbRun.error,
    duration: dbRun.duration,
    startedAt: dbRun.startedAt,
    completedAt: dbRun.completedAt,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Check if automation exists
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    const [runs, total] = await Promise.all([
      prisma.automationRun.findMany({
        where: { automationId: id },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.automationRun.count({
        where: { automationId: id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: runs.map(transformRun),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch runs' },
      { status: 500 }
    );
  }
}

// Clear all runs for this automation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if automation exists
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    // Delete all runs for this automation
    const result = await prisma.automationRun.deleteMany({
      where: { automationId: id },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error('Failed to clear runs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear runs' },
      { status: 500 }
    );
  }
}

// Manual trigger
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { rowId, tableId, row } = body as {
      rowId?: number;
      tableId?: number;
      row?: Record<string, unknown>;
    };

    // Find the automation
    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    if (!automation.enabled) {
      return NextResponse.json(
        { success: false, error: 'Automation is disabled' },
        { status: 400 }
      );
    }

    // For manual trigger, we need row data
    if (!rowId || !tableId) {
      return NextResponse.json(
        { success: false, error: 'rowId and tableId are required for manual trigger' },
        { status: 400 }
      );
    }

    // Create run record
    const run = await prisma.automationRun.create({
      data: {
        automationId: id,
        status: 'running',
        trigger: {
          type: 'manual',
          triggeredBy: 'user',
        },
        steps: [],
      },
    });

    // Execute based on automation type
    let steps: AutomationStepResult[] = [];
    let error: string | null = null;

    try {
      switch (automation.type) {
        case 'resource_enricher':
          steps = await executeResourceEnricher(
            automation.config as unknown as ResourceEnricherConfig,
            {
              table_id: tableId,
              event_id: `manual-${run.id}`,
              event_type: 'rows.created',
              row_id: rowId,
              row: row || {},
            }
          );
          break;
        default:
          throw new Error(`Unknown automation type: ${automation.type}`);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Execution failed';
    }

    // Determine final status
    const hasFailedStep = steps.some((s) => s.status === 'failed');
    const finalStatus = error || hasFailedStep ? 'failed' : 'completed';
    const duration = Date.now() - startTime;

    // Update run record
    const updatedRun = await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        steps: steps as unknown as object,
        error: error || (hasFailedStep ? steps.find((s) => s.status === 'failed')?.error : null),
        duration,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: transformRun(updatedRun),
    });
  } catch (err) {
    console.error('Manual trigger error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
