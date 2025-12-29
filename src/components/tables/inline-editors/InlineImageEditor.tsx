'use client';

import { useState, useRef } from 'react';
import { Plus, X, Link, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InlineImageEditorProps {
  value: string | null;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export function InlineImageEditor({ value, onSave, onCancel }: InlineImageEditorProps) {
  const [isOpen, setIsOpen] = useState(!value); // Auto-open if no value
  const [urlValue, setUrlValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSave = () => {
    if (urlValue.trim()) {
      onSave(urlValue.trim());
      setIsOpen(false);
      onCancel(); // Close editor after save
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onSave(data.url);
      setIsOpen(false);
      onCancel(); // Close editor after save
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave(null);
    onCancel(); // Close editor after clearing
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
      } else {
        onCancel();
      }
    } else if (e.key === 'Enter' && urlValue.trim()) {
      e.preventDefault();
      handleUrlSave();
    }
  };

  // If there's an existing image, show thumbnail with clear option
  if (value) {
    return (
      <div className="relative group">
        <div className="w-8 h-8 rounded overflow-hidden bg-neutral-800">
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <button
          type="button"
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleClear}
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    );
  }

  // No image - show add button with popover
  return (
    <div onKeyDown={handleKeyDown}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-neutral-800"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="text-xs">
                <Link className="w-3 h-3 mr-1" />
                URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="p-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Choose file'}
              </Button>
            </TabsContent>
            <TabsContent value="url" className="p-3 space-y-2">
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="text-sm"
              />
              <Button
                type="button"
                className="w-full"
                onClick={handleUrlSave}
                disabled={!urlValue.trim()}
              >
                Add image
              </Button>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
