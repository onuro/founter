'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ExtractedImage } from '@/types/crawl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { Copy, Check, ExternalLink, ImageIcon } from 'lucide-react';

interface ImageGridProps {
  images: ExtractedImage[];
  crawledUrl: string | null;
}

export function ImageGrid({ images, crawledUrl }: ImageGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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
  const allLightboxImages = useMemo(
    () => images.map(img => ({ src: img.src, alt: img.alt })),
    [images]
  );

  // Reset failed images when images change (new crawl)
  useEffect(() => {
    setFailedImages(new Set());
  }, [images]);

  const copyToClipboard = useCallback(async (src: string, index: number) => {
    try {
      await navigator.clipboard.writeText(src);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleImageError = useCallback((src: string) => {
    setFailedImages(prev => new Set(prev).add(src));
  }, []);

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-fr">
            {images.map((image, index) => {
              const isFailed = failedImages.has(image.src);

              return (
                <div
                  key={`${image.src}-${index}`}
                  className="group relative bg-neutral-900 rounded-md overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors"
                  style={{ aspectRatio: '1 / 1' }}
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
                        className="object-cover object-top transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        onError={() => handleImageError(image.src)}
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
