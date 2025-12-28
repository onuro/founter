'use client';

import { Rows3, Rows4, Rows2, Plus, Trash2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RowHeight } from '@/types/tables';

interface TableToolbarProps {
  rowHeight: RowHeight;
  onRowHeightChange: (height: RowHeight) => void;
  onAddRow: () => void;
  // Selection props
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onDeselectAll?: () => void;
  isDeleting?: boolean;
  className?: string;
}

const ROW_HEIGHT_OPTIONS: { value: RowHeight; label: string; icon: typeof Rows3 }[] = [
  { value: 'small', label: 'Compact', icon: Rows4 },
  { value: 'medium', label: 'Medium', icon: Rows3 },
  { value: 'large', label: 'Tall', icon: Rows2 },
];

export function TableToolbar({
  rowHeight,
  onRowHeightChange,
  onAddRow,
  selectedCount = 0,
  onDeleteSelected,
  onDeselectAll,
  isDeleting = false,
  className,
}: TableToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 border-b border-border bg-surface',
        className
      )}
    >
      {/* Left side - Add row button OR Selection actions */}
      {hasSelection ? (
        <div className="flex items-center gap-2">
          {/* Selection count badge */}
          <span className="text-sm text-muted-foreground">
            {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
          </span>

          {/* Delete selected button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeleteSelected}
            disabled={isDeleting}
            className="h-7 px-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 mr-1 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-3.5 mr-1" />
                Delete
              </>
            )}
          </Button>

          {/* Deselect all button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            disabled={isDeleting}
            className="h-7 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4 mr-1" />
            Deselect
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRow}
          className="h-7 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Row
        </Button>
      )}

      {/* Right side - Row height toggle */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-sm bg-secondary">
        {ROW_HEIGHT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRowHeightChange(value)}
                className={cn(
                  'h-6 w-6 rounded-xs cursor-pointer',
                  rowHeight === value
                    ? 'bg-neutral-800 text-foreground hover:bg-neutral-700/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-neutral-700/50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {label} rows
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
