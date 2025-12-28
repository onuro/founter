import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tables/[id]/rows/bulk-delete - Delete multiple rows
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params;
    const body = await request.json();
    const { rowIds } = body as { rowIds: string[] };

    if (!Array.isArray(rowIds) || rowIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'rowIds must be a non-empty array' },
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

    // Delete rows in a transaction
    const result = await prisma.row.deleteMany({
      where: {
        id: { in: rowIds },
        tableId: tableId,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Failed to bulk delete rows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete rows' },
      { status: 500 }
    );
  }
}
