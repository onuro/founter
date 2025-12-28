import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { downloadImagesInBatches } from '@/lib/image-fetcher/download';
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
        status: item.status,
        downloadedCount: item.downloadedCount,
        failedCount: item.failedCount,
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

/**
 * Background download function - runs after response is sent
 */
async function downloadImagesInBackground(
  savedId: string,
  images: ExtractedImage[]
): Promise<void> {
  try {
    const downloadedImages = await downloadImagesInBatches(
      images,
      savedId,
      async (progress) => {
        // Update progress in database
        await prisma.imageFetcherSaved.update({
          where: { id: savedId },
          data: {
            downloadedCount: progress.downloaded,
            failedCount: progress.failed,
          },
        });
      }
    );

    // Final update: mark as complete and create image records
    await prisma.$transaction([
      prisma.imageFetcherSaved.update({
        where: { id: savedId },
        data: {
          status: 'complete',
          imageCount: downloadedImages.length,
          downloadedCount: downloadedImages.length,
        },
      }),
      prisma.imageFetcherSavedImage.createMany({
        data: downloadedImages.map((img) => ({
          savedId: savedId,
          originalUrl: img.originalUrl,
          localPath: img.localPath,
          filename: img.filename,
          width: img.width,
          alt: img.alt,
          link: img.link,
        })),
      }),
    ]);

    console.log(`Background download complete for ${savedId}: ${downloadedImages.length} images`);
  } catch (error) {
    console.error(`Background download failed for ${savedId}:`, error);

    // Mark as failed
    await prisma.imageFetcherSaved.update({
      where: { id: savedId },
      data: { status: 'failed' },
    }).catch(console.error);
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

    // Create the saved record with "downloading" status
    const saved = await prisma.imageFetcherSaved.create({
      data: {
        label: label.trim(),
        url: url.trim(),
        imageCount: images.length,
        status: 'downloading',
        downloadedCount: 0,
        failedCount: 0,
        options: options ?? Prisma.JsonNull,
      },
    });

    // Start background download (don't await - fire and forget)
    // Using setImmediate/setTimeout to ensure response is sent first
    setImmediate(() => {
      downloadImagesInBackground(saved.id, images);
    });

    // Return immediately with the saved ID
    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        label: saved.label,
        url: saved.url,
        imageCount: images.length,
        status: 'downloading',
        downloadedCount: 0,
        failedCount: 0,
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
