import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/media/projects/reorder - Reorder projects
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    // Update order for each project in a transaction
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.mediaProject.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to reorder media projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder media projects' },
      { status: 500 }
    );
  }
}
