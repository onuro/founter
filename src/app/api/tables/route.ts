import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TableSummary, CustomTable, FieldType, FieldOptions, TableView, ViewSettings } from '@/types/tables';
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

function transformTable(dbTable: {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  fields: Array<{
    id: string;
    tableId: string;
    name: string;
    type: string;
    options: unknown;
    order: number;
    width: number;
    required: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  rows: Array<{
    id: string;
    tableId: string;
    values: unknown;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  views: Array<{
    id: string;
    tableId: string;
    name: string;
    type: string;
    isDefault: boolean;
    order: number;
    settings: unknown;
    createdAt: Date;
    updatedAt: Date;
  }>;
}): CustomTable {
  return {
    id: dbTable.id,
    name: dbTable.name,
    icon: dbTable.icon,
    order: dbTable.order,
    createdAt: dbTable.createdAt,
    updatedAt: dbTable.updatedAt,
    fields: dbTable.fields.map((f) => ({
      id: f.id,
      tableId: f.tableId,
      name: f.name,
      type: f.type as FieldType,
      options: f.options as FieldOptions,
      order: f.order,
      width: f.width,
      required: f.required,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
    rows: dbTable.rows.map((r) => ({
      id: r.id,
      tableId: r.tableId,
      values: r.values as Record<string, unknown>,
      order: r.order,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    views: dbTable.views.map(transformView),
  };
}

// GET /api/tables - List all tables with counts
export async function GET() {
  try {
    const tables = await prisma.customTable.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            fields: true,
            rows: true,
          },
        },
      },
    });

    const summaries: TableSummary[] = tables.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      order: t.order,
      fieldCount: t._count.fields,
      rowCount: t._count.rows,
    }));

    return NextResponse.json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}

// POST /api/tables - Create a new table
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, icon } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get the highest order value to place new table at the end
    const maxOrderTable = await prisma.customTable.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const newOrder = (maxOrderTable?.order ?? -1) + 1;

    // Create table with a default "Name" field and a default "Grid" view
    const table = await prisma.customTable.create({
      data: {
        name: name.trim(),
        icon: icon || null,
        order: newOrder,
        fields: {
          create: {
            name: 'Name',
            type: 'text',
            order: 0,
            required: true,
          },
        },
        views: {
          create: {
            name: 'Grid',
            type: 'grid',
            isDefault: true,
            order: 0,
            settings: DEFAULT_VIEW_SETTINGS as object,
          },
        },
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        rows: {
          orderBy: { order: 'asc' },
        },
        views: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transformTable(table),
    });
  } catch (error) {
    console.error('Failed to create table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create table' },
      { status: 500 }
    );
  }
}
