import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/tables/[id]/views/reorder - Reorder views
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await context.params;
    const body = await request.json();

    const { orderedIds } = body as { orderedIds: string[] };

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required' },
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

    // Update order for each view
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.tableView.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error reordering views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder views' },
      { status: 500 }
    );
  }
}
