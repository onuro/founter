import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { resetPrismaConnection } from '@/lib/prisma';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// Parse DATABASE_URL to get actual db path
// Prisma resolves relative paths from schema.prisma location (prisma/), not project root
function getDbPath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  // Remove file: prefix and any query string (e.g., ?mode=wal)
  const filePath = dbUrl.replace('file:', '').split('?')[0];

  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    // Resolve relative to prisma/ directory (where schema.prisma lives)
    return path.join(process.cwd(), 'prisma', filePath);
  }
  return filePath;
}

const DB_PATH = getDbPath();

// POST /api/db/restore/[id] - Restore from a backup
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backupFilename = `backup_${id}.db`;
    const backupPath = path.join(BACKUPS_DIR, backupFilename);

    // Check if backup exists
    try {
      await fs.access(backupPath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Backup not found' },
        { status: 404 }
      );
    }

    // Create a pre-restore backup before restoring
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);
    const preRestoreFilename = `backup_${timestamp}_pre-restore.db`;
    const preRestorePath = path.join(BACKUPS_DIR, preRestoreFilename);

    // Backup current database before overwriting
    try {
      await fs.access(DB_PATH);
      await fs.copyFile(DB_PATH, preRestorePath);
    } catch {
      // Database doesn't exist, skip pre-restore backup
    }

    // Restore from backup
    await fs.copyFile(backupPath, DB_PATH);

    // Reset Prisma connection so it reads from the restored database
    await resetPrismaConnection();

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully. A pre-restore backup was created.',
      preRestoreBackup: preRestoreFilename,
    });
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
