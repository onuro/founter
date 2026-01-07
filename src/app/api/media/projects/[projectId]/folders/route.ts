import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { MediaFolder, MediaFolderTree } from '@/types/media';

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

// Build folder tree from flat list
function buildFolderTree(
  folders: Array<MediaFolder & { _count?: { files: number } }>,
  parentId: string | null = null
): MediaFolderTree[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((folder) => ({
      ...folder,
      children: buildFolderTree(folders, folder.id),
      fileCount: (folder as { _count?: { files: number } })._count?.files ?? 0,
    }));
}

// GET /api/media/projects/[projectId]/folders - List folders as tree
export async function GET(
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

    const folders = await prisma.mediaFolder.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    const tree = buildFolderTree(folders.map(f => ({ ...transformFolder(f), _count: f._count })));

    return NextResponse.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error('Failed to fetch folders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST /api/media/projects/[projectId]/folders - Create folder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { name, parentId } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

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

    // Verify parent folder if provided
    if (parentId) {
      const parentFolder = await prisma.mediaFolder.findUnique({
        where: { id: parentId },
      });
      if (!parentFolder || parentFolder.projectId !== projectId) {
        return NextResponse.json(
          { success: false, error: 'Parent folder not found' },
          { status: 404 }
        );
      }
    }

    // Get max order
    const maxOrderFolder = await prisma.mediaFolder.findFirst({
      where: { projectId, parentId: parentId || null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const newOrder = (maxOrderFolder?.order ?? -1) + 1;

    const folder = await prisma.mediaFolder.create({
      data: {
        projectId,
        parentId: parentId || null,
        name: name.trim(),
        order: newOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformFolder(folder),
    });
  } catch (error) {
    console.error('Failed to create folder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
