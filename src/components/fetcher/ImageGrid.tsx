'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ExtractedImage } from '@/types/crawl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbox, useLightbox } from '@/components/ui/lightbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Copy, Check, ExternalLink, ImageIcon, LayoutGrid, Link2 } from 'lucide-react';

const COLUMN_OPTIONS = [2, 3, 4, 5, 6, 8] as const;

const GAP_OPTIONS = [
  { label: '2', value: '0.5rem' },
  { label: '3', value: '0.75rem' },
  { label: '4', value: '1rem' },
  { label: '5', value: '1.25rem' },
  { label: '6', value: '1.5rem' },
] as const;

const ASPECT_RATIO_OPTIONS = [
  { label: '1:1', value: '1/1', description: 'Square' },
  { label: '16:9', value: '16/9', description: 'Landscape HD' },
  { label: '9:16', value: '9/16', description: 'Portrait HD' },
  { label: '4:3', value: '4/3', description: 'Classic' },
  { label: '3:4', value: '3/4', description: 'Portrait' },
  { label: '3:2', value: '3/2', description: 'Photo' },
  { label: '2:3', value: '2/3', description: 'Portrait Photo' },
  { label: '21:9', value: '21/9', description: 'Ultra Wide' },
  { label: '4:5', value: '4/5', description: 'Instagram' },
  { label: '5:4', value: '5/4', description: 'Large Format' },
  { label: '2:1', value: '2/1', description: 'Panorama' },
] as const;

type AspectRatioValue = typeof ASPECT_RATIO_OPTIONS[number]['value'];

interface ImageGridProps {
  images: ExtractedImage[];
  crawledUrl: string | null;
}

export function ImageGrid({ images, crawledUrl }: ImageGridProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<number>(5);
  const [gap, setGap] = useState<string>('1rem');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioValue>('1/1');

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
                <div className="bg-secondary p-1 rounded-lg">
                  <div
                    key={`${image.src}-${index}`}
                    className="group relative bg-surface rounded-md overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors"
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
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
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
