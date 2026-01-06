import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import type { MediaFile, MediaTag } from '@/types/media';

// Transform database file to API response
function transformFile(dbFile: {
  id: string;
  projectId: string;
  folderId: string | null;
  filename: string;
  originalFilename: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  metadata: unknown;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: Array<{
    tag: {
      id: string;
      name: string;
      color: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
}): MediaFile {
  return {
    id: dbFile.id,
    projectId: dbFile.projectId,
    folderId: dbFile.folderId,
    filename: dbFile.filename,
    originalFilename: dbFile.originalFilename,
    path: dbFile.path,
    mimeType: dbFile.mimeType,
    size: dbFile.size,
    width: dbFile.width,
    height: dbFile.height,
    alt: dbFile.alt,
    metadata: dbFile.metadata as Record<string, unknown> | null,
    order: dbFile.order,
    tags: dbFile.tags?.map((t) => t.tag as MediaTag) || [],
    createdAt: dbFile.createdAt,
    updatedAt: dbFile.updatedAt,
  };
}

// GET /api/media/files/[fileId] - Get a single file
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    const file = await prisma.mediaFile.findUnique({
      where: { id: fileId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformFile(file),
    });
  } catch (error) {
    console.error('Failed to fetch media file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media file' },
      { status: 500 }
    );
  }
}

// PUT /api/media/files/[fileId] - Update file metadata
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const body = await request.json();
    const { originalFilename, alt, metadata, folderId, projectId, tagIds } = body;

    // Check if file exists
    const existing = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Validate new project if moving
    if (projectId && projectId !== existing.projectId) {
      const newProject = await prisma.mediaProject.findUnique({
        where: { id: projectId },
      });
      if (!newProject) {
        return NextResponse.json(
          { success: false, error: 'Target project not found' },
          { status: 404 }
        );
      }
    }

    // Validate new folder if moving
    if (folderId !== undefined && folderId !== existing.folderId) {
      if (folderId !== null) {
        const folder = await prisma.mediaFolder.findUnique({
          where: { id: folderId },
        });
        const targetProjectId = projectId || existing.projectId;
        if (!folder || folder.projectId !== targetProjectId) {
          return NextResponse.json(
            { success: false, error: 'Target folder not found' },
            { status: 404 }
          );
        }
      }
    }

    // Update file and tags in transaction
    const file = await prisma.$transaction(async (tx) => {
      // Update tags if provided
      if (tagIds !== undefined) {
        // Remove existing tags
        await tx.mediaFileTag.deleteMany({
          where: { fileId },
        });

        // Add new tags
        if (tagIds.length > 0) {
          await tx.mediaFileTag.createMany({
            data: tagIds.map((tagId: string) => ({
              fileId,
              tagId,
            })),
          });
        }
      }

      // Update file
      return tx.mediaFile.update({
        where: { id: fileId },
        data: {
          ...(originalFilename !== undefined && { originalFilename: originalFilename.trim() }),
          ...(alt !== undefined && { alt: alt?.trim() || null }),
          ...(metadata !== undefined && { metadata }),
          ...(folderId !== undefined && { folderId: folderId || null }),
          ...(projectId !== undefined && { projectId }),
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: transformFile(file),
    });
  } catch (error) {
    console.error('Failed to update media file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media file' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/files/[fileId] - Delete a file
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Check if file exists
    const existing = await prisma.mediaFile.findUnique({
      where: { id: fileId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from database (cascades to tags and versions)
    await prisma.mediaFile.delete({
      where: { id: fileId },
    });

    // Delete physical file (best effort)
    try {
      const filepath = path.join(
        process.cwd(),
        'uploads/media',
        existing.projectId,
        existing.filename
      );
      await unlink(filepath);
    } catch (err) {
      console.warn('Failed to delete physical file:', err);
      // Continue anyway - database record is deleted
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete media file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}
