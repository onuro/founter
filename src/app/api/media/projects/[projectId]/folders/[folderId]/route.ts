import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { MediaFolder } from '@/types/media';

// Transform database folder to API response
function transformFolder(dbFolder: {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): MediaFolder {
  return {
    id: dbFolder.id,
    projectId: dbFolder.projectId,
    parentId: dbFolder.parentId,
    name: dbFolder.name,
    order: dbFolder.order,
    createdAt: dbFolder.createdAt,
    updatedAt: dbFolder.updatedAt,
  };
}

// GET /api/media/projects/[projectId]/folders/[folderId] - Get folder
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params;

    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformFolder(folder),
    });
  } catch (error) {
    console.error('Failed to fetch folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folder' },
      { status: 500 }
    );
  }
}

// PUT /api/media/projects/[projectId]/folders/[folderId] - Update folder
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params;
    const body = await request.json();
    const { name, parentId } = body;

    const existing = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });

    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Prevent moving folder into itself or its descendants
    if (parentId !== undefined && parentId !== existing.parentId) {
      if (parentId === folderId) {
        return NextResponse.json(
          { success: false, error: 'Cannot move folder into itself' },
          { status: 400 }
        );
      }

      // Check for circular reference
      if (parentId) {
        let current = await prisma.mediaFolder.findUnique({ where: { id: parentId } });
        while (current) {
          if (current.id === folderId) {
            return NextResponse.json(
              { success: false, error: 'Cannot create circular folder structure' },
              { status: 400 }
            );
          }
          if (!current.parentId) break;
          current = await prisma.mediaFolder.findUnique({ where: { id: current.parentId } });
        }
      }
    }

    const folder = await prisma.mediaFolder.update({
      where: { id: folderId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: transformFolder(folder),
    });
  } catch (error) {
    console.error('Failed to update folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/projects/[projectId]/folders/[folderId] - Delete folder
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string; folderId: string }> }
) {
  try {
    const { projectId, folderId } = await params;

    const existing = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });

    if (!existing || existing.projectId !== projectId) {
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Delete folder (cascades to children and sets files' folderId to null)
    await prisma.mediaFolder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
