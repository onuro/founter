import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
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

// GET /api/media/projects/[projectId]/files - List files in project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Verify project exists
    const project = await prisma.mediaProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where = {
      projectId,
      ...(folderId === 'root' ? { folderId: null } : folderId ? { folderId } : {}),
    };

    // Get total count
    const total = await prisma.mediaFile.count({ where });

    // Get files
    const files = await prisma.mediaFile.findMany({
      where,
      orderBy: { order: 'asc' },
      skip,
      take: limit,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: files.map(transformFile),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch media files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

// POST /api/media/projects/[projectId]/files - Upload file(s)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Verify project exists
    const project = await prisma.mediaProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folderId = formData.get('folderId') as string | null;

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate folder exists if provided
    if (folderId) {
      const folder = await prisma.mediaFolder.findUnique({
        where: { id: folderId },
      });
      if (!folder || folder.projectId !== projectId) {
        return NextResponse.json(
          { success: false, error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    // Validate and process files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const results: MediaFile[] = [];
    const errors: string[] = [];

    // Get max order
    const maxOrderFile = await prisma.mediaFile.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let currentOrder = (maxOrderFile?.order ?? -1) + 1;

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads/media', projectId);
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      // Validate type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Allowed: JPG, PNG, WebP, GIF`);
        continue;
      }

      // Validate size
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large. Max 50MB`);
        continue;
      }

      try {
        // Generate unique filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filename = `${uuid()}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        // Create database record
        const mediaFile = await prisma.mediaFile.create({
          data: {
            projectId,
            folderId: folderId || null,
            filename,
            originalFilename: file.name,
            path: `/api/uploads/media/${projectId}/${filename}`,
            mimeType: file.type,
            size: file.size,
            order: currentOrder++,
          },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        results.push(transformFile(mediaFile));
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
        errors.push(`${file.name}: Failed to upload`);
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to upload media files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload media files' },
      { status: 500 }
    );
  }
}
