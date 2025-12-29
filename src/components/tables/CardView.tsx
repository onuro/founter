'use client';

import { useRef, useEffect, useCallback, type SetStateAction } from 'react';
import { Plus, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { CustomTable, Row } from '@/types/tables';
import type { ViewSettings } from '@/types/views';
import { CardItem } from './CardItem';

const LOAD_MORE_THRESHOLD = 200; // pixels from bottom

interface CardViewProps {
  table: CustomTable | null;
  viewSettings: ViewSettings;
  onRowSelect: (rowId: string) => void;
  onAddRow: () => void;
  isLoading?: boolean;
  // Pagination props
  totalRows?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  // Selection props
  selectedRowIds: Set<string>;
  onSelectionChange: (value: SetStateAction<Set<string>>) => void;
  onDeleteSelected?: () => void;
  isDeleting?: boolean;
  className?: string;
}

export function CardView({
  table,
  viewSettings,
  onRowSelect,
  onAddRow,
  isLoading,
  totalRows = 0,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  selectedRowIds,
  onSelectionChange,
  isDeleting = false,
  className,
}: CardViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rows = table?.rows || [];
  const columns = viewSettings.cardColumns || 3;

  // Selection handlers
  const toggleRowSelection = useCallback(
    (rowId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectionChange((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(rowId)) {
          newSelection.delete(rowId);
        } else {
          newSelection.add(rowId);
        }
        return newSelection;
      });
    },
    [onSelectionChange]
  );

  const selectAll = useCallback(() => {
    const allRowIds = new Set(rows.map((r) => r.id));
    onSelectionChange(allRowIds);
  }, [rows, onSelectionChange]);

  const deselectAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  // Determine select-all checkbox state
  const allSelected = rows.length > 0 && selectedRowIds.size === rows.length;
  const someSelected = selectedRowIds.size > 0 && selectedRowIds.size < rows.length;

  // Infinite scroll detection
  const handleScroll = useCallback(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < LOAD_MORE_THRESHOLD) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
            <Table2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Select a table</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a table from the sidebar or create a new one
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { fields } = table;
  const displayTotal = totalRows > 0 ? totalRows : rows.length;

  // Grid column classes based on settings
  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  }[columns] || 'grid-cols-3';

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Selection header */}
      {rows.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => {
              if (checked) {
                selectAll();
              } else {
                deselectAll();
              }
            }}
            aria-label="Select all"
            className={cn(someSelected && 'opacity-50')}
            disabled={isDeleting}
          />
          <span className="text-sm text-muted-foreground">
            {selectedRowIds.size > 0
              ? `${selectedRowIds.size} selected`
              : 'Select all'}
          </span>
        </div>
      )}

      {/* Card grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto p-4"
      >
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No rows yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddRow}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add first row
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className={cn('grid gap-4', gridColsClass)}>
              {rows.map((row) => (
                <div key={row.id} className="relative group">
                  {/* Selection checkbox overlay */}
                  <div
                    className={cn(
                      'absolute top-2 left-2 z-10 transition-opacity',
                      selectedRowIds.size > 0 || 'opacity-0 group-hover:opacity-100'
                    )}
                  >
                    <Checkbox
                      checked={selectedRowIds.has(row.id)}
                      onCheckedChange={() => {
                        onSelectionChange((prev) => {
                          const newSelection = new Set(prev);
                          if (newSelection.has(row.id)) {
                            newSelection.delete(row.id);
                          } else {
                            newSelection.add(row.id);
                          }
                          return newSelection;
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select row`}
                      disabled={isDeleting}
                      className="bg-background/80 backdrop-blur-sm"
                    />
                  </div>

                  <CardItem
                    row={row}
                    fields={fields}
                    titleFieldId={viewSettings.cardTitleFieldId}
                    onClick={() => onRowSelect(row.id)}
                    isSelected={selectedRowIds.has(row.id)}
                  />
                </div>
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with row count and add button */}
      <div className="border-t bg-surface border-border p-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {rows.length.toLocaleString()} of {displayTotal.toLocaleString()} rows
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRow}
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add row
        </Button>
      </div>
    </div>
  );
}
