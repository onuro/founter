import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { MediaTagWithCount } from '@/types/media';

// GET /api/media/tags - List all tags with file counts
export async function GET() {
  try {
    const tags = await prisma.mediaTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    const data: MediaTagWithCount[] = tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      fileCount: t._count.files,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// POST /api/media/tags - Create a tag
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!color) {
      return NextResponse.json(
        { success: false, error: 'Color is required' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.mediaTag.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A tag with this name already exists' },
        { status: 400 }
      );
    }

    const tag = await prisma.mediaTag.create({
      data: {
        name: name.trim(),
        color,
      },
    });

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('Failed to create tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
