import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AutomationType, AutomationConfig, AutomationSummary, AutomationRunStatus } from '@/types/automator';

function transformAutomation(dbAutomation: {
  id: string;
  name: string;
  description: string | null;
  type: string;
  enabled: boolean;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
  _count: { runs: number };
  runs: Array<{ status: string; startedAt: Date }>;
}): AutomationSummary {
  const lastRun = dbAutomation.runs[0];
  return {
    id: dbAutomation.id,
    name: dbAutomation.name,
    description: dbAutomation.description,
    type: dbAutomation.type as AutomationType,
    enabled: dbAutomation.enabled,
    runCount: dbAutomation._count.runs,
    lastRunAt: lastRun?.startedAt || null,
    lastRunStatus: (lastRun?.status as AutomationRunStatus) || null,
    createdAt: dbAutomation.createdAt,
    updatedAt: dbAutomation.updatedAt,
  };
}

export async function GET() {
  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { runs: true } },
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { status: true, startedAt: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: automations.map(transformAutomation),
    });
  } catch (error) {
    console.error('Failed to fetch automations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, type, config } = body as {
      name: string;
      description?: string;
      type: AutomationType;
      config: AutomationConfig;
    };

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Type is required' },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Config is required' },
        { status: 400 }
      );
    }

    const automation = await prisma.automation.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type,
        config: config as object,
        enabled: true,
      },
      include: {
        _count: { select: { runs: true } },
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { status: true, startedAt: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transformAutomation(automation),
    });
  } catch (error) {
    console.error('Failed to create automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create automation' },
      { status: 500 }
    );
  }
}
