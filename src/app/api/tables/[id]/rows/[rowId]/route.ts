import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Row } from '@/types/tables';

function transformRow(dbRow: {
  id: string;
  tableId: string;
  values: unknown;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): Row {
  return {
    id: dbRow.id,
    tableId: dbRow.tableId,
    values: dbRow.values as Record<string, unknown>,
    order: dbRow.order,
    createdAt: dbRow.createdAt,
    updatedAt: dbRow.updatedAt,
  };
}

// GET /api/tables/[id]/rows/[rowId] - Get a single row
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  try {
    const { id, rowId } = await params;

    const row = await prisma.row.findUnique({
      where: { id: rowId },
    });

    if (!row || row.tableId !== id) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformRow(row),
    });
  } catch (error) {
    console.error('Failed to fetch row:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch row' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id]/rows/[rowId] - Update a row
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  try {
    const { id, rowId } = await params;
    const body = await request.json();
    const { values } = body;

    // Check if row exists and belongs to table
    const existing = await prisma.row.findUnique({
      where: { id: rowId },
    });

    if (!existing || existing.tableId !== id) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    // Merge existing values with new values
    const existingValues = existing.values as Record<string, unknown>;
    const mergedValues = { ...existingValues, ...values };

    // Update row
    const row = await prisma.row.update({
      where: { id: rowId },
      data: {
        values: mergedValues,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformRow(row),
    });
  } catch (error) {
    console.error('Failed to update row:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update row' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id]/rows/[rowId] - Delete a row
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  try {
    const { id, rowId } = await params;

    // Check if row exists and belongs to table
    const existing = await prisma.row.findUnique({
      where: { id: rowId },
    });

    if (!existing || existing.tableId !== id) {
      return NextResponse.json(
        { success: false, error: 'Row not found' },
        { status: 404 }
      );
    }

    // Delete row
    await prisma.row.delete({
      where: { id: rowId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete row:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete row' },
      { status: 500 }
    );
  }
}
