import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface CleanupRequest {
  files?: string[];
  directories?: string[];
  confirmed: boolean;
}

interface CleanupResult {
  movedFiles: number;
  movedDirectories: number;
  trashPath: string;
  errors: string[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function POST(request: NextRequest) {
  try {
    const body: CleanupRequest = await request.json();

    if (!body.confirmed) {
      return NextResponse.json(
        { success: false, error: 'Cleanup must be confirmed' },
        { status: 400 }
      );
    }

    const files = body.files || [];
    const directories = body.directories || [];

    if (files.length === 0 && directories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files or directories specified for cleanup' },
        { status: 400 }
      );
    }

    // Create trash directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const trashDir = path.join(process.cwd(), 'uploads', 'trash', timestamp);
    await fs.mkdir(trashDir, { recursive: true });

    const errors: string[] = [];
    let movedFiles = 0;
    let movedDirectories = 0;

    // Security: Validate all paths are within uploads/tables/
    const uploadsTablesDir = path.join(process.cwd(), 'uploads', 'tables');

    const isValidPath = (filePath: string): boolean => {
      const resolved = path.resolve(filePath);
      return resolved.startsWith(uploadsTablesDir);
    };

    // Move individual files
    for (const filePath of files) {
      if (!isValidPath(filePath)) {
        errors.push(`Invalid path (outside uploads/tables): ${filePath}`);
        continue;
      }

      try {
        // Extract relative path structure
        const relativePath = path.relative(uploadsTablesDir, filePath);
        const trashFilePath = path.join(trashDir, 'files', relativePath);

        // Create parent directory in trash
        await fs.mkdir(path.dirname(trashFilePath), { recursive: true });

        // Move file to trash
        await fs.rename(filePath, trashFilePath);
        movedFiles++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to move ${filePath}: ${message}`);
      }
    }

    // Move directories
    for (const dirPath of directories) {
      if (!isValidPath(dirPath)) {
        errors.push(`Invalid path (outside uploads/tables): ${dirPath}`);
        continue;
      }

      try {
        // Extract relative path structure
        const relativePath = path.relative(uploadsTablesDir, dirPath);
        const trashDirPath = path.join(trashDir, 'directories', relativePath);

        // Create parent directory in trash
        await fs.mkdir(path.dirname(trashDirPath), { recursive: true });

        // Move directory to trash
        await fs.rename(dirPath, trashDirPath);
        movedDirectories++;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to move ${dirPath}: ${message}`);
      }
    }

    // Clean up empty parent directories in uploads/tables
    try {
      const tableDirs = await fs.readdir(uploadsTablesDir);
      for (const tableId of tableDirs) {
        const tablePath = path.join(uploadsTablesDir, tableId);
        try {
          const stat = await fs.stat(tablePath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(tablePath);
            if (files.length === 0) {
              await fs.rmdir(tablePath);
            }
          }
        } catch {
          // Ignore errors when cleaning up empty directories
        }
      }
    } catch {
      // Ignore if uploads/tables doesn't exist
    }

    const result: CleanupResult = {
      movedFiles,
      movedDirectories,
      trashPath: trashDir,
      errors
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Orphan cleanup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean up orphan data' },
      { status: 500 }
    );
  }
}

// GET endpoint to list trash contents
export async function GET() {
  try {
    const trashDir = path.join(process.cwd(), 'uploads', 'trash');

    let trashFolders: { name: string; size: number; sizeFormatted: string; fileCount: number }[] = [];

    try {
      const folders = await fs.readdir(trashDir);

      for (const folder of folders) {
        const folderPath = path.join(trashDir, folder);
        const stat = await fs.stat(folderPath);

        if (stat.isDirectory()) {
          // Calculate total size and file count
          let totalSize = 0;
          let fileCount = 0;

          const countFiles = async (dir: string): Promise<void> => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
              const entryPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                await countFiles(entryPath);
              } else {
                const fileStat = await fs.stat(entryPath);
                totalSize += fileStat.size;
                fileCount++;
              }
            }
          };

          await countFiles(folderPath);

          trashFolders.push({
            name: folder,
            size: totalSize,
            sizeFormatted: formatBytes(totalSize),
            fileCount
          });
        }
      }

      // Sort by name (date) descending
      trashFolders.sort((a, b) => b.name.localeCompare(a.name));
    } catch {
      // Trash directory doesn't exist
    }

    return NextResponse.json({ success: true, data: trashFolders });
  } catch (error) {
    console.error('Trash list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list trash contents' },
      { status: 500 }
    );
  }
}
