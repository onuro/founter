'use client';

import { useCallback } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
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
  const handleFilesSelected = useCallback(
    (files: FileList) => {
      const file = files[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <Card>
      <CardHeader>
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
        <CardTitle>Screenshot</CardTitle>
      </CardHeader>
      <CardContent>
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
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            accept="image/png,image/jpeg,image/webp"
            isLoading={isLoading}
            title="Drop image or click to browse"
            description="PNG, JPG, WebP up to 10MB"
          />
        )}

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
