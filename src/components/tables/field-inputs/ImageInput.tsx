'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Field } from '@/types/tables';
import { Lightbox } from '@/components/ui/lightbox';

interface ImageInputProps {
  field: Field;
  value: string | null;
  onChange: (value: string | null) => void;
  tableId: string;
}

export function ImageInput({ field, value, onChange, tableId }: ImageInputProps) {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('upload');
  const [urlValue, setUrlValue] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (url: string) => {
    setUrlValue(url);
    onChange(url || null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            <Expand className="w-8 h-8 text-white" />
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

      {/* Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={inputMode === 'upload' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setInputMode('upload')}
            className="text-xs"
          >
            Upload
          </Button>
          <Button
            type="button"
            variant={inputMode === 'url' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setInputMode('url')}
            className="text-xs"
          >
            URL
          </Button>
        </div>

        {inputMode === 'url' ? (
          <Input
            type="text"
            value={urlValue}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="bg-secondary"
          />
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-700 rounded-md cursor-pointer hover:border-neutral-600 transition-colors',
              isUploading && 'pointer-events-none opacity-50'
            )}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG, WebP</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
