import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';

// Helper: Check file usage in table rows for multiple paths
async function checkFilesUsage(filePaths: string[]) {
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

  // Get all rows
  const rows = await prisma.row.findMany({
    select: { id: true, tableId: true, values: true },
  });

  // Build usage map
  const pathSet = new Set(filePaths);
  const usageMap: Record<string, { count: number; tableUsage: Record<string, number> }> = {};

  for (const p of filePaths) {
    usageMap[p] = { count: 0, tableUsage: {} };
  }

  for (const row of rows) {
    const values = row.values as Record<string, unknown>;
    for (const [fieldId, value] of Object.entries(values)) {
      if (imageFieldIds.has(fieldId) && typeof value === 'string' && pathSet.has(value)) {
        usageMap[value].count++;
        usageMap[value].tableUsage[row.tableId] = (usageMap[value].tableUsage[row.tableId] || 0) + 1;
      }
    }
  }

  // Convert to response format
  const result: Record<string, { count: number; tables: { id: string; name: string; rowCount: number }[] }> = {};
  for (const [p, usage] of Object.entries(usageMap)) {
    result[p] = {
      count: usage.count,
      tables: Object.entries(usage.tableUsage).map(([tableId, rowCount]) => ({
        id: tableId,
        name: tableMap.get(tableId) || 'Unknown Table',
        rowCount,
      })),
    };
  }

  return result;
}

// Helper: Nullify image references in table rows for multiple paths
async function nullifyImageReferences(imagePaths: string[]): Promise<number> {
  const pathSet = new Set(imagePaths);

  // Get all image field IDs
  const imageFields = await prisma.field.findMany({
    where: { type: 'image' },
    select: { id: true },
  });
  const imageFieldIds = new Set(imageFields.map((f) => f.id));

  // Find and update rows containing these paths
  const rows = await prisma.row.findMany();
  let clearedCount = 0;

  for (const row of rows) {
    const values = row.values as Record<string, unknown>;
    let updated = false;
    const newValues = { ...values };

    for (const [fieldId, value] of Object.entries(values)) {
      if (imageFieldIds.has(fieldId) && typeof value === 'string' && pathSet.has(value)) {
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

// POST /api/media/files/bulk - Bulk operations on files
// For delete action, supports:
//   checkUsage: boolean - Returns usage info instead of deleting
//   cascadeNullify: boolean - Nullifies table field references before deleting
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, fileIds, folderId, projectId, tagIds, checkUsage, cascadeNullify } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'fileIds array is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'delete': {
        // Get files to delete
        const files = await prisma.mediaFile.findMany({
          where: { id: { in: fileIds } },
        });

        // If checkUsage, return usage info without deleting
        if (checkUsage) {
          const filePaths = files.map((f) => f.path);
          const usage = await checkFilesUsage(filePaths);

          // Calculate totals
          let totalCount = 0;
          const allTables: Record<string, { id: string; name: string; rowCount: number }> = {};

          for (const pathUsage of Object.values(usage)) {
            totalCount += pathUsage.count;
            for (const table of pathUsage.tables) {
              if (allTables[table.id]) {
                allTables[table.id].rowCount += table.rowCount;
              } else {
                allTables[table.id] = { ...table };
              }
            }
          }

          return NextResponse.json({
            success: true,
            data: {
              files: files.map((f) => ({ id: f.id, path: f.path, originalFilename: f.originalFilename })),
              usage,
              totals: {
                count: totalCount,
                tables: Object.values(allTables),
              },
            },
          });
        }

        // Cascade nullify if requested
        let clearedReferences = 0;
        if (cascadeNullify) {
          const filePaths = files.map((f) => f.path);
          clearedReferences = await nullifyImageReferences(filePaths);
        }

        // Delete from database
        await prisma.mediaFile.deleteMany({
          where: { id: { in: fileIds } },
        });

        // Delete physical files (best effort)
        for (const file of files) {
          try {
            const filepath = path.join(
              process.cwd(),
              'uploads/media',
              file.projectId,
              file.filename
            );
            await unlink(filepath);
          } catch {
            // Continue on error
          }
        }

        return NextResponse.json({
          success: true,
          deletedCount: files.length,
          clearedReferences,
        });
      }

      case 'move': {
        if (folderId === undefined) {
          return NextResponse.json(
            { success: false, error: 'folderId is required for move action' },
            { status: 400 }
          );
        }

        // Verify folder exists if not null
        if (folderId !== null) {
          const folder = await prisma.mediaFolder.findUnique({
            where: { id: folderId },
          });
          if (!folder) {
            return NextResponse.json(
              { success: false, error: 'Target folder not found' },
              { status: 404 }
            );
          }
        }

        await prisma.mediaFile.updateMany({
          where: { id: { in: fileIds } },
          data: { folderId: folderId || null },
        });

        return NextResponse.json({
          success: true,
          movedCount: fileIds.length,
        });
      }

      case 'move-project': {
        if (!projectId) {
          return NextResponse.json(
            { success: false, error: 'projectId is required for move-project action' },
            { status: 400 }
          );
        }

        // Verify project exists
        const project = await prisma.mediaProject.findUnique({
          where: { id: projectId },
        });
        if (!project) {
          return NextResponse.json(
            { success: false, error: 'Target project not found' },
            { status: 404 }
          );
        }

        // Move files to new project and clear folder
        await prisma.mediaFile.updateMany({
          where: { id: { in: fileIds } },
          data: { projectId, folderId: null },
        });

        return NextResponse.json({
          success: true,
          movedCount: fileIds.length,
        });
      }

      case 'add-tags': {
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'tagIds array is required for add-tags action' },
            { status: 400 }
          );
        }

        // Create tag associations (ignore duplicates using upsert)
        let addedCount = 0;
        for (const fileId of fileIds as string[]) {
          for (const tagId of tagIds as string[]) {
            try {
              await prisma.mediaFileTag.upsert({
                where: {
                  fileId_tagId: { fileId, tagId },
                },
                create: { fileId, tagId },
                update: {},
              });
              addedCount++;
            } catch {
              // Skip duplicates or errors
            }
          }
        }

        return NextResponse.json({
          success: true,
          addedCount,
        });
      }

      case 'remove-tags': {
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'tagIds array is required for remove-tags action' },
            { status: 400 }
          );
        }

        await prisma.mediaFileTag.deleteMany({
          where: {
            fileId: { in: fileIds },
            tagId: { in: tagIds },
          },
        });

        return NextResponse.json({
          success: true,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Failed to perform bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
