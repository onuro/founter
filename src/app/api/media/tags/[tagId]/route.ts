import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/media/tags/[tagId] - Update a tag
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await params;
    const body = await request.json();
    const { name, color } = body;

    const existing = await prisma.mediaTag.findUnique({
      where: { id: tagId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name if changing
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.mediaTag.findUnique({
        where: { name: name.trim() },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A tag with this name already exists' },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.mediaTag.update({
      where: { id: tagId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    console.error('Failed to update tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tag' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/tags/[tagId] - Delete a tag
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await params;

    const existing = await prisma.mediaTag.findUnique({
      where: { id: tagId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tag not found' },
        { status: 404 }
      );
    }

    // Delete tag (cascades to MediaFileTag entries)
    await prisma.mediaTag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tag' },
      { status: 500 }
    );
  }
}
