import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: string[] };

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { success: false, error: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    // Update each preset's order based on its position in the array
    const updates = orderedIds.map((id, index) =>
      prisma.sitePreset.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder presets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder presets' },
      { status: 500 }
    );
  }
}
