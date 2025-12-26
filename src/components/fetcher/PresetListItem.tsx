'use client';

import { useState } from 'react';
import { SitePreset } from '@/types/preset';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ScrollText, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PresetListItemProps {
  preset: SitePreset;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PresetListItem({
  preset,
  onSelect,
  onEdit,
  onDelete,
}: PresetListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: preset.id });
  const [faviconError, setFaviconError] = useState(false);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const getFaviconUrl = (url: string) => {
    const domain = getDomain(url);
    if (!domain) return '';
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  };

  const getInitial = (label: string) => {
    return label.charAt(0).toUpperCase();
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const display = urlObj.hostname + urlObj.pathname;
      return display.length > 35 ? display.slice(0, 35) + '...' : display;
    } catch {
      return url.slice(0, 35);
    }
  };

  const formatScrollSummary = () => {
    const scroll = preset.crawlOptions.scroll;
    if (!scroll.enabled) return 'No scrolling';
    return `${scroll.scrollCount}x scroll, ${scroll.scrollDelay}ms`;
  };

  const faviconUrl = getFaviconUrl(preset.url);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 rounded-md hover:bg-background transition-colors ${
        isDragging ? 'opacity-50 bg-muted' : ''
      }`}
      {...attributes}
    >
      {/* Drag Handle */}
      <button
        {...listeners}
        className="flex-shrink-0 p-3 pr-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <button
        onClick={onSelect}
        className="flex-1 flex items-start gap-3 p-3 pl-1 text-left cursor-pointer min-w-0"
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
              {getInitial(preset.label)}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0 space-y-1">
          <span className="text-sm font-medium truncate w-full">
            {preset.label}
          </span>
          <span className="text-xs text-muted-foreground truncate w-full">
            {formatUrl(preset.url)}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <ScrollText className="w-3 h-3" />
            {formatScrollSummary()}
          </span>
        </div>
      </button>
      <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit preset"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete preset"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </li>
  );
}
