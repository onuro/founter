import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteSavedImagesFolder } from '@/lib/image-fetcher/download';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const saved = await prisma.imageFetcherSaved.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { createdAt: 'asc' },
        },
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
      data: {
        id: saved.id,
        url: saved.url,
        label: saved.label,
        imageCount: saved.imageCount,
        options: saved.options,
        images: saved.images.map((img) => ({
          id: img.id,
          originalUrl: img.originalUrl,
          localPath: img.localPath,
          filename: img.filename,
          width: img.width,
          alt: img.alt,
          link: img.link,
        })),
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to fetch saved item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved item' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label } = body;

    // Check if exists
    const existing = await prisma.imageFetcherSaved.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Saved fetch not found' },
        { status: 404 }
      );
    }

    // Update label
    const updated = await prisma.imageFetcherSaved.update({
      where: { id },
      data: { label: label?.trim() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        label: updated.label,
      },
    });
  } catch (error) {
    console.error('Failed to update saved item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update saved item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if exists
    const existing = await prisma.imageFetcherSaved.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Saved fetch not found' },
        { status: 404 }
      );
    }

    // Delete from filesystem first
    await deleteSavedImagesFolder(id);

    // Delete from database (cascade will delete images)
    await prisma.imageFetcherSaved.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete saved item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete saved item' },
      { status: 500 }
    );
  }
}
