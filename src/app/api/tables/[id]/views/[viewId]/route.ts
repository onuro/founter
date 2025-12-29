import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TableView, ViewSettings } from '@/types/views';
import { DEFAULT_VIEW_SETTINGS, DEFAULT_CARD_SETTINGS } from '@/types/views';

// Transform database view to API response
function transformView(view: {
  id: string;
  tableId: string;
  name: string;
  type: string;
  isDefault: boolean;
  order: number;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
}): TableView {
  const rawSettings = view.settings as Partial<ViewSettings> | null;
  const settings: ViewSettings = {
    ...DEFAULT_VIEW_SETTINGS,
    ...(view.type === 'card' ? DEFAULT_CARD_SETTINGS : {}),
    ...rawSettings,
  };

  return {
    id: view.id,
    tableId: view.tableId,
    name: view.name,
    type: view.type as 'grid' | 'card',
    isDefault: view.isDefault,
    order: view.order,
    settings,
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
}

// GET /api/tables/[id]/views/[viewId] - Get a single view
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; viewId: string }> }
) {
  try {
    const { id: tableId, viewId } = await context.params;

    const view = await prisma.tableView.findUnique({
      where: { id: viewId },
    });

    if (!view || view.tableId !== tableId) {
      return NextResponse.json(
        { success: false, error: 'View not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformView(view),
    });
  } catch (error) {
    console.error('Error fetching view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch view' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id]/views/[viewId] - Update a view
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; viewId: string }> }
) {
  try {
    const { id: tableId, viewId } = await context.params;
    const body = await request.json();

    const { name, type, isDefault, settings } = body as {
      name?: string;
      type?: 'grid' | 'card';
      isDefault?: boolean;
      settings?: Partial<ViewSettings>;
    };

    // Find existing view
    const existingView = await prisma.tableView.findUnique({
      where: { id: viewId },
    });

    if (!existingView || existingView.tableId !== tableId) {
      return NextResponse.json(
        { success: false, error: 'View not found' },
        { status: 404 }
      );
    }

    // If setting this view as default, unset other defaults
    if (isDefault === true) {
      await prisma.tableView.updateMany({
        where: { tableId, isDefault: true, id: { not: viewId } },
        data: { isDefault: false },
      });
    }

    // Merge existing settings with new settings
    const existingSettings = (existingView.settings as Partial<ViewSettings>) || {};
    const mergedSettings = settings
      ? { ...existingSettings, ...settings }
      : existingSettings;

    const view = await prisma.tableView.update({
      where: { id: viewId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(isDefault !== undefined && { isDefault }),
        ...(settings !== undefined && { settings: mergedSettings as object }),
      },
    });

    return NextResponse.json({
      success: true,
      data: transformView(view),
    });
  } catch (error) {
    console.error('Error updating view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update view' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id]/views/[viewId] - Delete a view
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; viewId: string }> }
) {
  try {
    const { id: tableId, viewId } = await context.params;

    // Find existing view
    const existingView = await prisma.tableView.findUnique({
      where: { id: viewId },
    });

    if (!existingView || existingView.tableId !== tableId) {
      return NextResponse.json(
        { success: false, error: 'View not found' },
        { status: 404 }
      );
    }

    // Count remaining views
    const viewCount = await prisma.tableView.count({
      where: { tableId },
    });

    // Prevent deleting the last view
    if (viewCount <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last view' },
        { status: 400 }
      );
    }

    // Delete the view
    await prisma.tableView.delete({
      where: { id: viewId },
    });

    // If the deleted view was default, set another view as default
    if (existingView.isDefault) {
      const firstView = await prisma.tableView.findFirst({
        where: { tableId },
        orderBy: { order: 'asc' },
      });

      if (firstView) {
        await prisma.tableView.update({
          where: { id: firstView.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { id: viewId },
    });
  } catch (error) {
    console.error('Error deleting view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete view' },
      { status: 500 }
    );
  }
}
