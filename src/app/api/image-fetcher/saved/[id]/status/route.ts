import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const saved = await prisma.imageFetcherSaved.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        imageCount: true,
        downloadedCount: true,
        failedCount: true,
      },
    });

    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'Saved fetch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    console.error('Failed to fetch status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
