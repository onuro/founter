import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/tables/reorder - Reorder tables
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds must be an array' },
        { status: 400 }
      );
    }

    // Update order for each table
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.customTable.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to reorder tables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder tables' },
      { status: 500 }
    );
  }
}
