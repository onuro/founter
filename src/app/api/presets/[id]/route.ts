import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { SitePreset, CrawlOptions, PresetType } from '@/types/preset';

function transformPreset(dbPreset: {
  id: string;
  label: string;
  url: string;
  type: string;
  crawlOptions: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SitePreset {
  return {
    id: dbPreset.id,
    label: dbPreset.label,
    url: dbPreset.url,
    type: dbPreset.type as PresetType,
    crawlOptions: dbPreset.crawlOptions as CrawlOptions,
    createdAt: dbPreset.createdAt,
    updatedAt: dbPreset.updatedAt,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const preset = await prisma.sitePreset.findUnique({
      where: { id },
    });

    if (!preset) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transformPreset(preset),
    });
  } catch (error) {
    console.error('Failed to fetch preset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preset' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label, url, crawlOptions } = body;

    // Check if preset exists
    const existing = await prisma.sitePreset.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404 }
      );
    }

    // Build update data - only update provided fields
    const updateData: Record<string, unknown> = {};
    if (label !== undefined) updateData.label = label.trim();
    if (url !== undefined) updateData.url = url.trim();
    if (crawlOptions !== undefined) updateData.crawlOptions = crawlOptions;

    const preset = await prisma.sitePreset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: transformPreset(preset),
    });
  } catch (error) {
    console.error('Failed to update preset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preset' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if preset exists
    const existing = await prisma.sitePreset.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404 }
      );
    }

    await prisma.sitePreset.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete preset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete preset' },
      { status: 500 }
    );
  }
}
