'use client';

import { useState } from 'react';
import { X, Maximize2, FolderOpen } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { MediaPicker } from '@/components/media/MediaPicker';
import type { Field } from '@/types/tables';
import type { MediaFile } from '@/types/media';
import { Lightbox } from '@/components/ui/lightbox';

interface ImageInputProps {
  field: Field;
  value: string | null;
  onChange: (value: string | null) => void;
  tableId: string;
}

export function ImageInput({ field, value, onChange, tableId }: ImageInputProps) {
  const [urlValue, setUrlValue] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    onChange(url || null);
  };

  const handleFilesSelected = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableId', tableId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.url);
        setUrlValue(result.url);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    onChange(null);
    setUrlValue('');
  };

  const handleMediaSelect = (file: MediaFile) => {
    onChange(file.path);
    setUrlValue(file.path);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>

      {/* Preview */}
      {value && (
        <div className="relative w-full aspect-video rounded-md overflow-hidden bg-neutral-800 mb-2 group">
          <img
            src={value}
            alt=""
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => setIsLightboxOpen(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
            }}
          />
          {/* Expand button overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Maximize2 className="size-6 text-white" />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={clearImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Lightbox */}
      {value && (
        <Lightbox
          image={{ src: value }}
          open={isLightboxOpen}
          onOpenChange={setIsLightboxOpen}
          showTitle={false}
          showFooter={false}
        />
      )}

      {/* Input - only show when no image */}
      {!value && (
        <Tabs defaultValue="upload" size="sm">
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <FileDropzone
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              isLoading={isUploading}
              title="Click to upload"
              description="PNG, JPG, WebP"
              loadingText="Uploading..."
            />
          </TabsContent>
          <TabsContent value="library">
            <Button
              type="button"
              variant="outline"
              className="w-full h-20 gap-2"
              onClick={() => setIsMediaPickerOpen(true)}
            >
              <FolderOpen className="w-5 h-5" />
              Browse Media Library
            </Button>
          </TabsContent>
          <TabsContent value="url">
            <Input
              type="text"
              value={urlValue}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-secondary"
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Media Picker */}
      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
