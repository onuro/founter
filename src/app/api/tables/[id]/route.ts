import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { CustomTable, FieldType, FieldOptions } from '@/types/tables';

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

// GET /api/tables/[id] - Get a single table with fields and rows
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeRows = searchParams.get('includeRows') !== 'false';

    const table = await prisma.customTable.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
        ...(includeRows && {
          rows: {
            orderBy: { order: 'asc' },
          },
        }),
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // When not including rows, return empty array for rows
    const tableData = {
      ...table,
      rows: includeRows ? table.rows : [],
    };

    return NextResponse.json({
      success: true,
      data: transformTable(tableData as typeof table),
    });
  } catch (error) {
    console.error('Failed to fetch table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch table' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id] - Update table metadata
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, icon } = body;

    // Check if table exists
    const existing = await prisma.customTable.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Update table
    const table = await prisma.customTable.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(icon !== undefined && { icon: icon || null }),
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
    console.error('Failed to update table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update table' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Delete a table (cascades to fields and rows)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if table exists
    const existing = await prisma.customTable.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Delete table (cascades to fields and rows due to onDelete: Cascade)
    await prisma.customTable.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete table:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete table' },
      { status: 500 }
    );
  }
}
