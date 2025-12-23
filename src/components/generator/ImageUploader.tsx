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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Screenshot
        </CardTitle>
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
            <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
              <img
                src={image.dataUrl}
                alt="Uploaded screenshot"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>
                {image.width} x {image.height}px
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-neutral-400 hover:text-neutral-100"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center cursor-pointer hover:border-neutral-500 hover:bg-neutral-900/50 transition-colors"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-400" />
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <Upload className="h-8 w-8" />
                <span>Drop an image here or click to browse</span>
                <span className="text-xs text-neutral-500">
                  PNG, JPG, WebP up to 10MB
                </span>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
