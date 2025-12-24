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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const presets = await prisma.sitePreset.findMany({
      where: type ? { type } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: presets.map(transformPreset),
    });
  } catch (error) {
    console.error('Failed to fetch presets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, url, type, crawlOptions } = body;

    // Validation
    if (!label?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Label is required' },
        { status: 400 }
      );
    }
    if (!url?.trim()) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }
    if (!type || !['IMAGE', 'CONTENT'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Valid type (IMAGE or CONTENT) is required' },
        { status: 400 }
      );
    }
    if (!crawlOptions) {
      return NextResponse.json(
        { success: false, error: 'Crawl options are required' },
        { status: 400 }
      );
    }

    const preset = await prisma.sitePreset.create({
      data: {
        label: label.trim(),
        url: url.trim(),
        type,
        crawlOptions,
      },
    });

    return NextResponse.json({
      success: true,
      data: transformPreset(preset),
    });
  } catch (error) {
    console.error('Failed to create preset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create preset' },
      { status: 500 }
    );
  }
}
