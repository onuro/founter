'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ExtractedImage } from '@/types/crawl';
import { GridOptions } from '@/types/preset';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Copy, Check, ExternalLink, ImageIcon, LayoutGrid, Link2 } from 'lucide-react';
import {
  COLUMN_OPTIONS,
  GAP_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  DEFAULT_COLUMNS,
  DEFAULT_GAP,
  DEFAULT_ASPECT_RATIO,
  type AspectRatioValue,
} from '@/lib/grid-options';

interface ImageGridProps {
  images: ExtractedImage[];
  crawledUrl: string | null;
  gridOptions?: GridOptions;
}

export function ImageGrid({ images, crawledUrl, gridOptions }: ImageGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<number>(DEFAULT_COLUMNS);
  const [gap, setGap] = useState<string>(DEFAULT_GAP);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioValue>(DEFAULT_ASPECT_RATIO);

  // Apply grid options from preset when they change
  useEffect(() => {
    if (gridOptions) {
      setColumns(gridOptions.columns);
      setGap(gridOptions.gap);
      setAspectRatio(gridOptions.aspectRatio as AspectRatioValue);
    }
  }, [gridOptions]);

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
    () => images.map(img => ({ src: img.src, alt: img.alt, link: img.link })),
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
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Found {images.length} image{images.length !== 1 ? 's' : ''}
              {crawledUrl && (
                <a
                  href={crawledUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm pl-4 font-normal text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline truncate max-w-[200px]">{crawledUrl}</span>
                </a>
              )}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid Options</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Columns</h4>
                    <div className="flex flex-wrap gap-1">
                      {COLUMN_OPTIONS.map((col) => (
                        <Button
                          key={col}
                          variant={columns === col ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-8 cursor-pointer"
                          onClick={() => setColumns(col)}
                        >
                          {col}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Gap</h4>
                    <div className="flex flex-wrap gap-1">
                      {GAP_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={gap === option.value ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-8 cursor-pointer"
                          onClick={() => setGap(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Aspect Ratio</h4>
                    <div className="grid grid-cols-3 gap-1">
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          variant={aspectRatio === option.value ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 text-xs cursor-pointer"
                          onClick={() => setAspectRatio(option.value)}
                          title={option.description}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid auto-rows-fr"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}
          >
            {images.map((image, index) => {
              const isFailed = failedImages.has(image.src);

              return (
                <div key={`${image.src}-${index}`} className="bg-secondary p-1 rounded-lg">
                  <div
                    className="group fetchimg-grid-item"
                    style={{ aspectRatio }}
                  >
                    {/* Thumbnail */}
                    <button
                      onClick={() => openLightbox(
                        { src: image.src, alt: image.alt, link: image.link },
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
                          loader={({ src }) => `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75`}
                          // sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          className="object-cover object-top transition-transform group-hover:scale-105 ease-out-expo duration-500"
                          onError={() => handleImageError(image.src)}
                        />
                      )}
                    </button>

                    {/* Action buttons overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {image.link && (
                          <a
                            href={image.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full h-7 text-xs cursor-pointer"
                            >
                              <Link2 className="w-3 h-3" />
                              Open Link
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          className={`h-7 text-xs cursor-pointer ${image.link ? 'flex-1' : 'w-full'}`}
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
