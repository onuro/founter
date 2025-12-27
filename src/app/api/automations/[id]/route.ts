import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AutomationType, AutomationConfig, Automation } from '@/types/automator';

function transformAutomation(dbAutomation: {
  id: string;
  name: string;
  description: string | null;
  type: string;
  enabled: boolean;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Automation {
  return {
    id: dbAutomation.id,
    name: dbAutomation.name,
    description: dbAutomation.description,
    type: dbAutomation.type as AutomationType,
    enabled: dbAutomation.enabled,
    config: dbAutomation.config as AutomationConfig,
    createdAt: dbAutomation.createdAt,
    updatedAt: dbAutomation.updatedAt,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const automation = await prisma.automation.findUnique({
      where: { id },
    });

    if (!automation) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformAutomation(automation),
    });
  } catch (error) {
    console.error('Failed to fetch automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, enabled, config } = body as {
      name?: string;
      description?: string;
      enabled?: boolean;
      config?: AutomationConfig;
    };

    // Check if automation exists
    const existing = await prisma.automation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    const automation = await prisma.automation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(enabled !== undefined && { enabled }),
        ...(config !== undefined && { config: config as object }),
      },
    });

    return NextResponse.json({
      success: true,
      data: transformAutomation(automation),
    });
  } catch (error) {
    console.error('Failed to update automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update automation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if automation exists
    const existing = await prisma.automation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Automation not found' },
        { status: 404 }
      );
    }

    await prisma.automation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete automation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete automation' },
      { status: 500 }
    );
  }
}
