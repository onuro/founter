'use client';

import { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2, X, Clock, ExternalLink } from 'lucide-react';
import { HistoryItem } from '@/hooks/useHistory';

interface HistorySheetProps {
  // Core
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Content customization
  /** Sheet title. Default: "History" */
  title?: string;
  /** Sheet description. Default: none */
  description?: string;

  // History items
  items: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  /** Called when individual item is removed. If not provided, remove button is hidden */
  onItemRemove?: (item: HistoryItem) => void;
  /** Called when clear all is clicked. If not provided, clear all button is hidden */
  onClearAll?: () => void;

  // Display options
  /** Show timestamp for each item. Default: true */
  showTimestamp?: boolean;
  /** Show item count in header. Default: true */
  showItemCount?: boolean;
  /** Message when no items. Default: "No history yet" */
  emptyMessage?: string;
  /** Custom empty state content */
  emptyContent?: ReactNode;

  // Layout
  /** Which side the sheet opens from. Default: "right" */
  side?: 'left' | 'right' | 'top' | 'bottom';
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export function HistorySheet({
  open,
  onOpenChange,
  title = 'History',
  description,
  items,
  onItemClick,
  onItemRemove,
  onClearAll,
  showTimestamp = true,
  showItemCount = true,
  emptyMessage = 'No history yet',
  emptyContent,
  side = 'right',
}: HistorySheetProps) {
  const handleItemClick = (item: HistoryItem) => {
    onItemClick(item);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between pr-6">
            <span>{title}</span>
            {showItemCount && items.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            )}
          </SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              {emptyContent || (
                <>
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">{emptyMessage}</p>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-1">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group flex items-center gap-2 rounded-md hover:bg-accent transition-colors"
                >
                  <button
                    onClick={() => handleItemClick(item)}
                    className="flex-1 flex flex-col items-start gap-0.5 p-2 text-left cursor-pointer min-w-0"
                  >
                    <span className="text-sm font-medium truncate w-full">
                      {item.label}
                    </span>
                    {showTimestamp && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-background"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                    {onItemRemove && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemRemove(item);
                        }}
                        className="p-1 rounded hover:bg-background cursor-pointer"
                        title="Remove from history"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {onClearAll && items.length > 0 && (
          <SheetFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="w-full cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
