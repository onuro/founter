import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// Parse DATABASE_URL to get actual db path (format: file:./path/to/db or file:/absolute/path)
function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const filePath = dbUrl.replace('file:', '');

  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return path.join(process.cwd(), filePath);
  }
  return filePath;
}

const DB_PATH = getDbPath();

export interface BackupInfo {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  sizeFormatted: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// GET /api/db/backups - List all backups
export async function GET() {
  try {
    // Ensure backups directory exists
    await fs.mkdir(BACKUPS_DIR, { recursive: true });

    const files = await fs.readdir(BACKUPS_DIR);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.db')) {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = await fs.stat(filePath);

        // Extract timestamp from filename (format: backup_YYYY-MM-DD_HH-mm-ss.db)
        const match = file.match(/backup_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})\.db/);
        const id = match ? match[1] : file.replace('.db', '');

        backups.push({
          id,
          filename: file,
          createdAt: stats.mtime.toISOString(),
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
        });
      }
    }

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list backups' },
      { status: 500 }
    );
  }
}

// POST /api/db/backups - Create a new backup
export async function POST() {
  try {
    // Ensure backups directory exists
    await fs.mkdir(BACKUPS_DIR, { recursive: true });

    // Check if source database exists
    try {
      await fs.access(DB_PATH);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Database file not found' },
        { status: 404 }
      );
    }

    // Generate timestamp-based filename
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    const backupFilename = `backup_${timestamp}.db`;
    const backupPath = path.join(BACKUPS_DIR, backupFilename);

    // Copy the database file
    await fs.copyFile(DB_PATH, backupPath);

    // Get file stats
    const stats = await fs.stat(backupPath);

    const backup: BackupInfo = {
      id: timestamp,
      filename: backupFilename,
      createdAt: stats.mtime.toISOString(),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
    };

    return NextResponse.json({
      success: true,
      data: backup,
      message: 'Backup created successfully',
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
