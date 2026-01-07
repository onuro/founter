import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { Prisma } from '@/generated/prisma';
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

// Helper: Check file usage in table rows
async function checkFileUsage(filePath: string) {
  // Get all image fields
  const imageFields = await prisma.field.findMany({
    where: { type: 'image' },
    select: { id: true, tableId: true },
  });
  const imageFieldIds = new Set(imageFields.map((f) => f.id));

  // Get all tables for name lookup
  const tables = await prisma.customTable.findMany({
    select: { id: true, name: true },
  });
  const tableMap = new Map(tables.map((t) => [t.id, t.name]));

  // Get all rows and find matches
  const rows = await prisma.row.findMany({
    select: { id: true, tableId: true, values: true },
  });

  const tableUsage: Record<string, number> = {};
  let totalCount = 0;

  for (const row of rows) {
    const values = row.values as Record<string, unknown>;
    for (const [fieldId, value] of Object.entries(values)) {
      if (imageFieldIds.has(fieldId) && value === filePath) {
        totalCount++;
        tableUsage[row.tableId] = (tableUsage[row.tableId] || 0) + 1;
      }
    }
  }

  return {
    count: totalCount,
    tables: Object.entries(tableUsage).map(([tableId, rowCount]) => ({
      id: tableId,
      name: tableMap.get(tableId) || 'Unknown Table',
      rowCount,
    })),
  };
}

// Helper: Nullify image references in table rows
async function nullifyImageReferences(imagePath: string): Promise<number> {
  // Get all image field IDs
  const imageFields = await prisma.field.findMany({
    where: { type: 'image' },
    select: { id: true },
  });
  const imageFieldIds = new Set(imageFields.map((f) => f.id));

  // Find and update rows containing this path
  const rows = await prisma.row.findMany();
  let clearedCount = 0;

  for (const row of rows) {
    const values = row.values as Record<string, unknown>;
    let updated = false;
    const newValues = { ...values };

    for (const [fieldId, value] of Object.entries(values)) {
      if (imageFieldIds.has(fieldId) && value === imagePath) {
        newValues[fieldId] = null;
        updated = true;
        clearedCount++;
      }
    }

    if (updated) {
      await prisma.row.update({
        where: { id: row.id },
        data: { values: newValues as Prisma.InputJsonValue },
      });
    }
  }

  return clearedCount;
}

// DELETE /api/media/files/[fileId] - Delete a file
// Query params:
//   ?checkUsage=true - Returns usage info instead of deleting
//   ?cascadeNullify=true - Nullifies table field references before deleting
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const checkUsage = searchParams.get('checkUsage') === 'true';
    const cascadeNullify = searchParams.get('cascadeNullify') === 'true';

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

    // If checkUsage, return usage info without deleting
    if (checkUsage) {
      const usage = await checkFileUsage(existing.path);
      return NextResponse.json({
        success: true,
        data: {
          file: transformFile({
            ...existing,
            tags: [],
          }),
          usage,
        },
      });
    }

    // Cascade nullify if requested
    let clearedReferences = 0;
    if (cascadeNullify) {
      clearedReferences = await nullifyImageReferences(existing.path);
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
      clearedReferences,
    });
  } catch (error) {
    console.error('Failed to delete media file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media file' },
      { status: 500 }
    );
  }
}
