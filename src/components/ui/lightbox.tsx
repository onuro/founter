'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface LightboxProps {
  image: LightboxImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Array of all images for gallery navigation */
  images?: LightboxImage[];
  /** Current image index in the gallery */
  currentIndex?: number;
  /** Callback when navigating to a different image */
  onNavigate?: (index: number) => void;
  /** Show the image title in header. Default: true */
  showTitle?: boolean;
  /** Show the URL and action buttons in footer. Default: true */
  showFooter?: boolean;
  /** Show the fullscreen toggle button. Default: true */
  showFullscreenToggle?: boolean;
  /** Show the copy URL button. Default: true */
  showCopyButton?: boolean;
  /** Show the open in new tab button. Default: true */
  showOpenButton?: boolean;
  /** Custom title override */
  title?: string;
}

export function Lightbox({
  image,
  open,
  onOpenChange,
  images,
  currentIndex,
  onNavigate,
  showTitle = true,
  showFooter = true,
  showFullscreenToggle = true,
  showCopyButton = true,
  showOpenButton = true,
  title,
}: LightboxProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gallery navigation
  const hasGallery = images && images.length > 1 && currentIndex !== undefined && onNavigate;
  const hasPrev = hasGallery && currentIndex > 0;
  const hasNext = hasGallery && currentIndex < images.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev && onNavigate && currentIndex !== undefined) {
      onNavigate(currentIndex - 1);
    }
  }, [hasPrev, onNavigate, currentIndex]);

  const goToNext = useCallback(() => {
    if (hasNext && onNavigate && currentIndex !== undefined) {
      onNavigate(currentIndex + 1);
    }
  }, [hasNext, onNavigate, currentIndex]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Use refs to keep keyboard handler stable (no re-attachment on navigation)
  const goToPrevRef = useRef(goToPrev);
  const goToNextRef = useRef(goToNext);
  const toggleFullscreenRef = useRef(toggleFullscreen);

  // Keep refs updated
  useEffect(() => {
    goToPrevRef.current = goToPrev;
    goToNextRef.current = goToNext;
    toggleFullscreenRef.current = toggleFullscreen;
  });

  // Keyboard navigation - only re-attaches when open state changes
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevRef.current();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNextRef.current();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreenRef.current();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setIsFullscreen(false);
        setCopied(false);
      }
      onOpenChange(open);
    },
    [onOpenChange]
  );

  const copyToClipboard = useCallback(async () => {
    if (!image) return;
    try {
      await navigator.clipboard.writeText(image.src);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [image]);

  if (!image) return null;

  const displayTitle = title || image.alt || 'Image Preview';
  const showHeader = showTitle || showFullscreenToggle;
  const showFooterButtons = showCopyButton || showOpenButton;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          isFullscreen
            ? '!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !p-4 flex flex-col'
            : 'sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'
        }
      >
        {showHeader && (
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="pr-8 flex items-center justify-between">
              {showTitle && <span className="line-clamp-1">{displayTitle}</span>}
              {!showTitle && <span />}
              {showFullscreenToggle && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="cursor-pointer ml-2"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
        )}

        <div className="relative flex-1 min-h-0 bg-neutral-900 rounded-md flex items-center justify-center overflow-hidden overflow-y-auto">
          {/* Previous Button */}
          {hasPrev && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
              onClick={goToPrev}
              title="Previous image (←)"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </Button>
          )}

          {/* Image */}
          {isFullscreen ? (
            <a
              href={image.src}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full max-w-[1400px] flex items-start justify-start"
            >
              <img
                src={image.src}
                alt={image.alt || 'Full size preview'}
                className="w-full h-auto cursor-zoom-in"
              />
            </a>
          ) : (
            <Image
              src={image.src}
              alt={image.alt || 'Full size preview'}
              width={1200}
              height={900}
              className="object-cover object-top w-full max-w-3xl max-h-[60vh]"
              unoptimized
            />
          )}

          {/* Next Button */}
          {hasNext && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
              onClick={goToNext}
              title="Next image (→)"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </Button>
          )}

          {/* Image counter */}
          {hasGallery && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-xs text-white">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {showFooter && (
          <div className="flex items-center justify-between gap-4 flex-shrink-0 pt-2">
            <p className="text-xs text-muted-foreground truncate flex-1">
              {image.src}
            </p>
            {showFooterButtons && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {showCopyButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
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
                )}
                {showOpenButton && (
                  <a
                    href={image.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button size="sm" variant="outline" className="cursor-pointer">
                      <ExternalLink className="w-3 h-3" />
                      Open
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy lightbox state management with gallery support
export function useLightbox() {
  const [selectedImage, setSelectedImage] = useState<LightboxImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [images, setImages] = useState<LightboxImage[]>([]);

  const openLightbox = useCallback((image: LightboxImage, allImages?: LightboxImage[], index?: number) => {
    setSelectedImage(image);
    if (allImages) {
      setImages(allImages);
      setCurrentIndex(index ?? 0);
    }
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
    setImages([]);
    setCurrentIndex(0);
  }, []);

  const navigateTo = useCallback((index: number) => {
    if (images[index]) {
      setCurrentIndex(index);
      setSelectedImage(images[index]);
    }
  }, [images]);

  return {
    selectedImage,
    isOpen: !!selectedImage,
    images,
    currentIndex,
    openLightbox,
    closeLightbox,
    navigateTo,
    setOpen: (open: boolean) => {
      if (!open) closeLightbox();
    },
  };
}
