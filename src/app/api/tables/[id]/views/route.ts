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

// GET /api/tables/[id]/views - List all views for a table
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await context.params;

    // Verify table exists
    const table = await prisma.customTable.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    const views = await prisma.tableView.findMany({
      where: { tableId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: views.map(transformView),
    });
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

// POST /api/tables/[id]/views - Create a new view
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await context.params;
    const body = await request.json();

    const { name, type = 'grid', settings } = body as {
      name: string;
      type?: 'grid' | 'card';
      settings?: Partial<ViewSettings>;
    };

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'View name is required' },
        { status: 400 }
      );
    }

    // Verify table exists
    const table = await prisma.customTable.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get the highest order value
    const maxOrderView = await prisma.tableView.findFirst({
      where: { tableId },
      orderBy: { order: 'desc' },
    });
    const newOrder = (maxOrderView?.order ?? -1) + 1;

    // Check if this is the first view (make it default)
    const existingViews = await prisma.tableView.count({
      where: { tableId },
    });
    const isFirstView = existingViews === 0;

    // Merge default settings with provided settings
    const defaultSettings = type === 'card'
      ? { ...DEFAULT_VIEW_SETTINGS, ...DEFAULT_CARD_SETTINGS }
      : DEFAULT_VIEW_SETTINGS;

    const view = await prisma.tableView.create({
      data: {
        tableId,
        name,
        type,
        order: newOrder,
        isDefault: isFirstView,
        settings: { ...defaultSettings, ...settings } as object,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformView(view),
    });
  } catch (error) {
    console.error('Error creating view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create view' },
      { status: 500 }
    );
  }
}
