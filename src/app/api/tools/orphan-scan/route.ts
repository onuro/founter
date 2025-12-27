import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export interface OrphanFile {
  path: string;
  tableId: string;
  tableName: string;
  filename: string;
  size: number;
  sizeFormatted: string;
}

export interface OrphanDirectory {
  tableId: string;
  path: string;
  fileCount: number;
  totalSize: number;
  totalSizeFormatted: string;
}

export interface ScanStats {
  totalFilesScanned: number;
  totalReferencedFiles: number;
  orphanFilesCount: number;
  orphanFilesSize: number;
  orphanFilesSizeFormatted: string;
  orphanDirectoriesCount: number;
}

export interface ScanResult {
  orphanFiles: OrphanFile[];
  orphanDirectories: OrphanDirectory[];
  stats: ScanStats;
  scannedAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function GET() {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'tables');

    // 1. Get all image fields from database
    const imageFields = await prisma.field.findMany({
      where: { type: 'image' },
      select: { id: true, tableId: true }
    });
    const imageFieldIds = new Set(imageFields.map(f => f.id));

    // 2. Get all table IDs and names from database
    const tables = await prisma.customTable.findMany({
      select: { id: true, name: true }
    });
    const validTableIds = new Set(tables.map(t => t.id));
    const tableNameMap = new Map(tables.map(t => [t.id, t.name]));

    // 3. Get all rows with their values
    const rows = await prisma.row.findMany({
      select: { id: true, tableId: true, values: true }
    });

    // 4. Extract all referenced image URLs from Row.values
    const referencedUrls = new Set<string>();
    for (const row of rows) {
      const values = row.values as Record<string, unknown>;
      for (const [fieldId, value] of Object.entries(values)) {
        if (imageFieldIds.has(fieldId) && typeof value === 'string' && value.startsWith('/api/uploads/')) {
          referencedUrls.add(value);
        }
      }
    }

    // 5. Scan filesystem for actual files
    const orphanFiles: OrphanFile[] = [];
    const orphanDirectories: OrphanDirectory[] = [];
    let totalFilesScanned = 0;

    // Check if uploads/tables directory exists
    let tableDirs: string[] = [];
    try {
      tableDirs = await fs.readdir(uploadsDir);
    } catch {
      // Directory doesn't exist yet, no orphans possible
      return NextResponse.json({
        success: true,
        data: {
          orphanFiles: [],
          orphanDirectories: [],
          stats: {
            totalFilesScanned: 0,
            totalReferencedFiles: referencedUrls.size,
            orphanFilesCount: 0,
            orphanFilesSize: 0,
            orphanFilesSizeFormatted: '0 B',
            orphanDirectoriesCount: 0
          },
          scannedAt: new Date().toISOString()
        } as ScanResult
      });
    }

    // Iterate through table directories
    for (const tableId of tableDirs) {
      const tablePath = path.join(uploadsDir, tableId);
      const stat = await fs.stat(tablePath);

      if (!stat.isDirectory()) continue;

      // Check if this table exists in DB
      const tableExists = validTableIds.has(tableId);

      // Get all files in this directory
      let files: string[] = [];
      try {
        files = await fs.readdir(tablePath);
      } catch {
        continue;
      }

      if (!tableExists) {
        // Entire directory is orphaned
        let totalSize = 0;
        for (const file of files) {
          try {
            const fileStat = await fs.stat(path.join(tablePath, file));
            if (fileStat.isFile()) {
              totalSize += fileStat.size;
              totalFilesScanned++;
            }
          } catch {
            // Skip files we can't stat
          }
        }

        orphanDirectories.push({
          tableId,
          path: tablePath,
          fileCount: files.length,
          totalSize,
          totalSizeFormatted: formatBytes(totalSize)
        });
      } else {
        // Table exists, check individual files
        for (const filename of files) {
          const filePath = path.join(tablePath, filename);
          try {
            const fileStat = await fs.stat(filePath);
            if (!fileStat.isFile()) continue;

            totalFilesScanned++;

            // Check if this file is referenced
            const expectedUrl = `/api/uploads/tables/${tableId}/${filename}`;
            if (!referencedUrls.has(expectedUrl)) {
              orphanFiles.push({
                path: filePath,
                tableId,
                tableName: tableNameMap.get(tableId) || 'Unknown Table',
                filename,
                size: fileStat.size,
                sizeFormatted: formatBytes(fileStat.size)
              });
            }
          } catch {
            // Skip files we can't stat
          }
        }
      }
    }

    // Calculate statistics
    const orphanFilesSize = orphanFiles.reduce((sum, f) => sum + f.size, 0);

    const result: ScanResult = {
      orphanFiles,
      orphanDirectories,
      stats: {
        totalFilesScanned,
        totalReferencedFiles: referencedUrls.size,
        orphanFilesCount: orphanFiles.length,
        orphanFilesSize,
        orphanFilesSizeFormatted: formatBytes(orphanFilesSize),
        orphanDirectoriesCount: orphanDirectories.length
      },
      scannedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Orphan scan error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scan for orphan data' },
      { status: 500 }
    );
  }
}
