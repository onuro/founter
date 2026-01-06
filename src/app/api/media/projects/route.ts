import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { MediaProjectSummary, MediaProject } from '@/types/media';

// Transform database project to API response
function transformProject(dbProject: {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): MediaProject {
  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description,
    icon: dbProject.icon,
    order: dbProject.order,
    createdAt: dbProject.createdAt,
    updatedAt: dbProject.updatedAt,
  };
}

// GET /api/media/projects - List all projects with counts
export async function GET() {
  try {
    const projects = await prisma.mediaProject.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            files: true,
            folders: true,
          },
        },
        files: {
          select: {
            size: true,
          },
        },
      },
    });

    const summaries: MediaProjectSummary[] = projects.map((p) => ({
      ...transformProject(p),
      fileCount: p._count.files,
      folderCount: p._count.folders,
      totalSize: p.files.reduce((sum, f) => sum + f.size, 0),
    }));

    return NextResponse.json({
      success: true,
      data: summaries,
    });
  } catch (error) {
    console.error('Failed to fetch media projects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media projects' },
      { status: 500 }
    );
  }
}

// POST /api/media/projects - Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, icon } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get the highest order value to place new project at the end
    const maxOrderProject = await prisma.mediaProject.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const newOrder = (maxOrderProject?.order ?? -1) + 1;

    // Create project
    const project = await prisma.mediaProject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || null,
        order: newOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformProject(project),
    });
  } catch (error) {
    console.error('Failed to create media project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create media project' },
      { status: 500 }
    );
  }
}
