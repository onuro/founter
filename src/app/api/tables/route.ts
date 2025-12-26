import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TableSummary, CustomTable, Field, FieldType, FieldOptions } from '@/types/tables';

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

    // Create table with a default "Name" field
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
      },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        rows: {
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
