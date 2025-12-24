'use client';

import { SitePreset } from '@/types/preset';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ScrollText } from 'lucide-react';

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

  return (
    <li className="group flex items-center gap-2 rounded-md hover:bg-accent transition-colors">
      <button
        onClick={onSelect}
        className="flex-1 flex flex-col items-start gap-0.5 p-3 text-left cursor-pointer min-w-0"
      >
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
