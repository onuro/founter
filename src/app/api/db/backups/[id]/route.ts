import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// DELETE /api/db/backups/[id] - Delete a backup
export async function DELETE(
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

    // Delete the backup file
    await fs.unlink(backupPath);

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
