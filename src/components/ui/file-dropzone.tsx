'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileDropzoneProps {
  /** Callback when file(s) are selected */
  onFilesSelected: (files: FileList) => void;
  /** Accepted file types (e.g., "image/*", ".pdf,.doc") */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Show loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom icon (defaults to Upload) */
  icon?: React.ReactNode;
  /** Main title text */
  title?: string;
  /** Description text below title */
  description?: string;
  /** Loading text */
  loadingText?: string;
  /** Additional class names for the outer wrapper */
  className?: string;
  /** Additional class names for the inner dropzone */
  dropzoneClassName?: string;
  /** Enable clipboard paste support (default: true for image accept types) */
  enablePaste?: boolean;
}

export function FileDropzone({
  onFilesSelected,
  accept = 'image/*',
  multiple = false,
  isLoading = false,
  disabled = false,
  icon,
  title = 'Drop file or click to browse',
  description = 'PNG, JPG, WebP up to 10MB',
  loadingText = 'Loading...',
  className,
  dropzoneClassName,
  enablePaste,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteFeedback, setShowPasteFeedback] = useState(false);

  // Default enablePaste to true for image types
  const shouldEnablePaste = enablePaste ?? accept.includes('image');

  // Handle clipboard paste
  useEffect(() => {
    if (!shouldEnablePaste || disabled || isLoading) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        // Create a FileList-like object
        const dt = new DataTransfer();
        const filesToAdd = multiple ? imageFiles : [imageFiles[0]];
        filesToAdd.forEach(file => dt.items.add(file));

        // Show paste feedback
        setShowPasteFeedback(true);
        setTimeout(() => setShowPasteFeedback(false), 500);

        onFilesSelected(dt.files);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [shouldEnablePaste, disabled, isLoading, multiple, onFilesSelected]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || isLoading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, disabled, isLoading]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isLoading) {
      setIsDragging(true);
    }
  }, [disabled, isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelected(files);
      }
      // Reset input so same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isLoading) {
      inputRef.current?.click();
    }
  }, [disabled, isLoading]);

  const isDisabled = disabled || isLoading;

  return (
    <div className={cn('bg-secondary p-1.5 rounded-md', className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'rounded-sm p-8 text-center cursor-pointer transition-all',
          'shadow-inset-emboss-soft bg-muted',
          'hover:bg-neutral-900 hover:shadow-inset-emboss',
          'active:bg-muted active:shadow-none',
          (isDragging || showPasteFeedback) && 'bg-neutral-900 shadow-inset-emboss ring-2 ring-primary/50',
          isDisabled && 'pointer-events-none opacity-50',
          dropzoneClassName
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={isDisabled}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            <span className="text-sm text-muted-foreground">{loadingText}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center">
              {icon || <Upload className="h-5 w-5 text-primary" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{title}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
