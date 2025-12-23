'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExtractedImage } from '@/types/crawl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Check, ExternalLink, ImageIcon } from 'lucide-react';

interface ImageGridProps {
  images: ExtractedImage[];
  crawledUrl: string | null;
}

export function ImageGrid({ images, crawledUrl }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<ExtractedImage | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
            {images.map((image, index) => (
              <div
                key={`${image.src}-${index}`}
                className="group relative aspect-square bg-neutral-900 rounded-md overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                {/* Thumbnail */}
                <button
                  onClick={() => setSelectedImage(image)}
                  className="w-full h-full cursor-pointer"
                >
                  <Image
                    src={image.src}
                    alt={image.alt || `Image ${index + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    unoptimized
                  />
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="truncate">
                {selectedImage?.alt || 'Image Preview'}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedImage) {
                      copyToClipboard(selectedImage.src, -1);
                    }
                  }}
                >
                  {copiedIndex === -1 ? (
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
                <a
                  href={selectedImage?.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="sm" variant="outline" className="cursor-pointer">
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </Button>
                </a>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full aspect-video bg-neutral-900 rounded-md overflow-hidden">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt || 'Full size preview'}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
                unoptimized
              />
            </div>
          )}
          {selectedImage && (
            <p className="text-xs text-muted-foreground break-all mt-2">
              {selectedImage.src}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
