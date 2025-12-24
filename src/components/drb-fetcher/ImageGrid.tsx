'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExtractedImage } from '@/types/crawl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { Copy, Check, ExternalLink, ImageIcon, ChevronDown } from 'lucide-react';

const IMAGES_PER_PAGE = 30;

interface ImageGridProps {
  images: ExtractedImage[];
  crawledUrl: string | null;
}

export function ImageGrid({ images, crawledUrl }: ImageGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(IMAGES_PER_PAGE);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const {
    selectedImage,
    isOpen,
    openLightbox,
    setOpen,
    images: lightboxImages,
    currentIndex,
    navigateTo,
  } = useLightbox();

  // Convert images to LightboxImage format
  const allLightboxImages = images.map(img => ({ src: img.src, alt: img.alt }));

  // Reset display count when images change (new crawl)
  useEffect(() => {
    setDisplayCount(IMAGES_PER_PAGE);
    setFailedImages(new Set());
  }, [images]);

  const displayedImages = images.slice(0, displayCount);
  const hasMore = displayCount < images.length;
  const remainingCount = images.length - displayCount;

  const copyToClipboard = async (src: string, index: number) => {
    try {
      await navigator.clipboard.writeText(src);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Found {images.length} image{images.length !== 1 ? 's' : ''}
            </div>
            {crawledUrl && (
              <a
                href={crawledUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline truncate max-w-[200px]">{crawledUrl}</span>
              </a>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedImages.map((image, index) => {
              const isFailed = failedImages.has(image.src);

              return (
                <div
                  key={`${image.src}-${index}`}
                  className="group relative aspect-square bg-neutral-900 rounded-md overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  {/* Thumbnail */}
                  <button
                    onClick={() => openLightbox(
                      { src: image.src, alt: image.alt },
                      allLightboxImages,
                      index
                    )}
                    className="w-full h-full cursor-pointer"
                  >
                    {isFailed ? (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                      </div>
                    ) : (
                      <Image
                        src={image.src}
                        alt={image.alt || `Image ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        onError={() => {
                          setFailedImages(prev => new Set(prev).add(image.src));
                        }}
                      />
                    )}
                  </button>

                  {/* Copy button overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full h-7 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(image.src, index);
                      }}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy URL
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setDisplayCount(prev => prev + IMAGES_PER_PAGE)}
                className="cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Load More ({remainingCount} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Lightbox
        image={selectedImage}
        open={isOpen}
        onOpenChange={setOpen}
        images={lightboxImages}
        currentIndex={currentIndex}
        onNavigate={navigateTo}
      />
    </>
  );
}
