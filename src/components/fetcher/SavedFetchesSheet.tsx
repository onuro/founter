'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowDownToDot, Trash2, Loader2, ImageIcon } from 'lucide-react';
import type { ImageFetcherSaved } from '@/hooks/useImageFetcherSaved';

interface SavedFetchesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved: ImageFetcherSaved[];
  isLoading: boolean;
  onSelect: (item: ImageFetcherSaved) => void;
  onDelete: (id: string) => Promise<void>;
}

export function SavedFetchesSheet({
  open,
  onOpenChange,
  saved,
  isLoading,
  onSelect,
  onDelete,
}: SavedFetchesSheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSelect = (item: ImageFetcherSaved) => {
    onSelect(item);
    onOpenChange(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays >= 14 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getFaviconUrl = (url: string) => {
    const domain = getDomain(url);
    if (!domain) return '';
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-[550px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between pr-6">
            <span>Saved Fetches</span>
            {saved.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {saved.length} saved
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            View and load your saved image fetches
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : saved.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <ArrowDownToDot className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No saved fetches yet</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {saved.map((item) => (
                <SavedFetchItem
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                  onDelete={(e) => handleDelete(item.id, e)}
                  isDeleting={deletingId === item.id}
                  formatDate={formatDate}
                  getFaviconUrl={getFaviconUrl}
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface SavedFetchItemProps {
  item: ImageFetcherSaved;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleting: boolean;
  formatDate: (date: Date) => string;
  getFaviconUrl: (url: string) => string;
}

function SavedFetchItem({
  item,
  onSelect,
  onDelete,
  isDeleting,
  formatDate,
  getFaviconUrl,
}: SavedFetchItemProps) {
  const [faviconError, setFaviconError] = useState(false);
  const faviconUrl = getFaviconUrl(item.url);

  const getInitial = (label: string) => {
    return label.charAt(0).toUpperCase();
  };

  return (
    <li className="group flex items-start gap-2 rounded-md hover:bg-background transition-colors">
      <button
        onClick={onSelect}
        className="flex-1 flex items-start gap-3 p-3 text-left cursor-pointer min-w-0"
        disabled={isDeleting}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
          {faviconUrl && !faviconError ? (
            <img
              src={faviconUrl}
              alt=""
              className="w-5 h-5 rounded-full"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {getInitial(item.label)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0 space-y-1">
          <span className="text-sm font-medium truncate w-full">
            {item.label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            {item.imageCount} images
          </span>
          <span className="text-xs text-muted-foreground/60">
            {formatDate(item.createdAt)}
          </span>
        </div>
      </button>
      <div className="flex items-center gap-1 pr-2 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
          title="Delete saved fetch"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </li>
  );
}
