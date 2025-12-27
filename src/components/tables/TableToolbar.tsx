'use client';

import { Rows3, Rows4, LayoutGrid, Plus } from 'lucide-react';
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
  className?: string;
}

const ROW_HEIGHT_OPTIONS: { value: RowHeight; label: string; icon: typeof Rows3 }[] = [
  { value: 'small', label: 'Compact', icon: Rows4 },
  { value: 'medium', label: 'Medium', icon: Rows3 },
  { value: 'large', label: 'Tall', icon: LayoutGrid },
];

export function TableToolbar({
  rowHeight,
  onRowHeightChange,
  onAddRow,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5 border-b border-border bg-surface',
        className
      )}
    >
      {/* Left side - Add row button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddRow}
        className="h-7 px-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Row
      </Button>

      {/* Right side - Row height toggle */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-neutral-800/50">
        {ROW_HEIGHT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onRowHeightChange(value)}
                className={cn(
                  'h-6 w-6 rounded-sm',
                  rowHeight === value
                    ? 'bg-neutral-700 text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-neutral-700/50'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {label} rows
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
