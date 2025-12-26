import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/tables/[id]/fields/reorder - Reorder fields
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds must be an array' },
        { status: 400 }
      );
    }

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

    // Update order for each field
    await prisma.$transaction(
      orderedIds.map((fieldId: string, index: number) =>
        prisma.field.update({
          where: { id: fieldId },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to reorder fields:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder fields' },
      { status: 500 }
    );
  }
}
