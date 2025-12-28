import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { downloadImages } from '@/lib/image-fetcher/download';
import type { ExtractedImage } from '@/types/crawl';

export async function GET() {
  try {
    const saved = await prisma.imageFetcherSaved.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: saved.map((item) => ({
        id: item.id,
        url: item.url,
        label: item.label,
        imageCount: item.imageCount,
        options: item.options,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch saved items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch saved items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, url, images, options } = body as {
      label: string;
      url: string;
      images: ExtractedImage[];
      options?: unknown;
    };

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
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Images are required' },
        { status: 400 }
      );
    }

    // Create the saved record first to get the ID
    const saved = await prisma.imageFetcherSaved.create({
      data: {
        label: label.trim(),
        url: url.trim(),
        imageCount: images.length,
        options: options ?? Prisma.JsonNull,
      },
    });

    // Download images to filesystem
    const downloadedImages = await downloadImages(images, saved.id);

    // Update with actual downloaded count and create image records
    await prisma.$transaction([
      prisma.imageFetcherSaved.update({
        where: { id: saved.id },
        data: { imageCount: downloadedImages.length },
      }),
      prisma.imageFetcherSavedImage.createMany({
        data: downloadedImages.map((img) => ({
          savedId: saved.id,
          originalUrl: img.originalUrl,
          localPath: img.localPath,
          filename: img.filename,
          width: img.width,
          alt: img.alt,
          link: img.link,
        })),
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        label: saved.label,
        url: saved.url,
        imageCount: downloadedImages.length,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to save images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save images' },
      { status: 500 }
    );
  }
}
