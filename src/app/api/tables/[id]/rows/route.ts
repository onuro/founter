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

// GET /api/tables/[id]/rows - List all rows for a table (with pagination)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    // Check if table exists
    const table = await prisma.customTable.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get total count
    const total = await prisma.row.count({
      where: { tableId: id },
    });

    // Get rows with pagination
    const rows = await prisma.row.findMany({
      where: { tableId: id },
      orderBy: { order: 'asc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: rows.map(transformRow),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch rows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rows' },
      { status: 500 }
    );
  }
}

// POST /api/tables/[id]/rows - Create a new row
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { values } = body;

    // Check if table exists
    const table = await prisma.customTable.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get the highest order value to place new row at the end
    const maxOrderRow = await prisma.row.findFirst({
      where: { tableId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const newOrder = (maxOrderRow?.order ?? -1) + 1;

    // Create row
    const row = await prisma.row.create({
      data: {
        tableId: id,
        values: values || {},
        order: newOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformRow(row),
    });
  } catch (error) {
    console.error('Failed to create row:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create row' },
      { status: 500 }
    );
  }
}
