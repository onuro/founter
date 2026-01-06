import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { MediaProject } from '@/types/media';

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

// GET /api/media/projects/[projectId] - Get a single project
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const project = await prisma.mediaProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformProject(project),
    });
  } catch (error) {
    console.error('Failed to fetch media project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch media project' },
      { status: 500 }
    );
  }
}

// PUT /api/media/projects/[projectId] - Update project metadata
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { name, description, icon } = body;

    // Check if project exists
    const existing = await prisma.mediaProject.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update project
    const project = await prisma.mediaProject.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(icon !== undefined && { icon: icon || null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: transformProject(project),
    });
  } catch (error) {
    console.error('Failed to update media project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update media project' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/projects/[projectId] - Delete a project (cascades to folders and files)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Check if project exists
    const existing = await prisma.mediaProject.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project (cascades to folders and files due to onDelete: Cascade)
    await prisma.mediaProject.delete({
      where: { id: projectId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete media project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media project' },
      { status: 500 }
    );
  }
}
