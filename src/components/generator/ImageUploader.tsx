'use client';

import { useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadedImage } from '@/types/generator';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  image: UploadedImage | null;
  onClear: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ImageUploader({
  onUpload,
  image,
  onClear,
  isLoading,
  error,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <Card>
      <CardHeader>
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Screenshot</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {image ? (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-sm overflow-hidden bg-secondary">
              <img
                src={image.dataUrl}
                alt="Uploaded screenshot"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {image.width} x {image.height}px
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className='bg-secondary p-1.5 rounded-md'>
            <div
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="rounded-sm p-8 text-center cursor-pointer shadow-inset-emboss-soft transition-all bg-muted hover:bg-neutral-900 hover:shadow-inset-emboss active:bg-muted active:shadow-none"
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Drop image or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
