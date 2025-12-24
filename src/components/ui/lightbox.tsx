'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface LightboxProps {
  image: LightboxImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  showTitle = true,
  showFooter = true,
  showFullscreenToggle = true,
  showCopyButton = true,
  showOpenButton = true,
  title,
}: LightboxProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

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

        <div className="relative flex-1 min-h-0 bg-neutral-900 rounded-md flex items-center justify-center overflow-hidden">
          {isFullscreen ? (
            <a
              href={image.src}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full flex items-center justify-center"
            >
              <img
                src={image.src}
                alt={image.alt || 'Full size preview'}
                className="w-full h-auto max-h-full object-contain cursor-zoom-in"
              />
            </a>
          ) : (
            <Image
              src={image.src}
              alt={image.alt || 'Full size preview'}
              width={1200}
              height={900}
              className="object-contain max-w-full max-h-[60vh]"
              unoptimized
            />
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

// Hook for easy lightbox state management
export function useLightbox() {
  const [selectedImage, setSelectedImage] = useState<LightboxImage | null>(null);

  const openLightbox = useCallback((image: LightboxImage) => {
    setSelectedImage(image);
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return {
    selectedImage,
    isOpen: !!selectedImage,
    openLightbox,
    closeLightbox,
    setOpen: (open: boolean) => {
      if (!open) closeLightbox();
    },
  };
}
