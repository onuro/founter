'use client';

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CustomTable, Field, RowHeight } from '@/types/tables';
import { ROW_HEIGHT_CONFIG } from '@/types/tables';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableToolbar } from './TableToolbar';

const OVERSCAN = 10;
const LOAD_MORE_THRESHOLD = 20;

interface TableViewProps {
  table: CustomTable | null;
  selectedRowId: string | null;
  onRowSelect: (rowId: string) => void;
  onAddField: () => void;
  onEditField: (field: Field) => void;
  onDeleteField: (fieldId: string) => void;
  onReorderFields: (orderedIds: string[]) => void;
  onResizeField: (fieldId: string, width: number) => void;
  onAddRow: () => void;
  isLoading?: boolean;
  // Row height
  rowHeight?: RowHeight;
  onRowHeightChange?: (height: RowHeight) => void;
  // Pagination props
  totalRows?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  className?: string;
}

export function TableView({
  table,
  selectedRowId,
  onRowSelect,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderFields,
  onResizeField,
  onAddRow,
  isLoading,
  rowHeight = 'small',
  onRowHeightChange,
  totalRows = 0,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  className,
}: TableViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rows = table?.rows || [];
  const rowHeightPx = ROW_HEIGHT_CONFIG[rowHeight].height;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeightPx,
    overscan: OVERSCAN,
  });

  // Force virtualizer to remeasure when row height changes
  useEffect(() => {
    virtualizer.measure();
  }, [rowHeightPx, virtualizer]);

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll: load more when approaching end
  useEffect(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    const distanceFromEnd = rows.length - lastItem.index;
    if (distanceFromEnd < LOAD_MORE_THRESHOLD) {
      onLoadMore();
    }
  }, [virtualItems, rows.length, hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading table...</p>
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

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar with row height toggle */}
      {onRowHeightChange && (
        <TableToolbar
          rowHeight={rowHeight}
          onRowHeightChange={onRowHeightChange}
          onAddRow={onAddRow}
        />
      )}

      {/* Table content with scroll container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Header - sticky */}
          <TableHeader
            fields={fields}
            onAddField={onAddField}
            onEditField={onEditField}
            onDeleteField={onDeleteField}
            onReorderFields={onReorderFields}
            onResizeField={onResizeField}
          />

          {/* Virtualized Rows */}
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
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualItems.map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <div
                    key={row.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TableRow
                      row={row}
                      fields={fields}
                      rowHeight={rowHeight}
                      isSelected={selectedRowId === row.id}
                      onClick={() => onRowSelect(row.id)}
                    />
                  </div>
                );
              })}

              {/* Loading indicator for infinite scroll */}
              {isLoadingMore && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualizer.getTotalSize()}px)`,
                  }}
                  className="flex items-center justify-center py-4"
                >
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer with row count and add button */}
      <div className="border-t border-border p-3 flex items-center justify-between">
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
