'use client';

import { useRef, useEffect, useCallback, type SetStateAction } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CustomTable, Field, RowHeight, CellPosition } from '@/types/tables';
import { ROW_HEIGHT_CONFIG } from '@/types/tables';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableToolbar } from './TableToolbar';

const OVERSCAN = 10;
const LOAD_MORE_THRESHOLD = 20;
export const SELECTION_COLUMN_WIDTH = 40;

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
  // Selection props
  selectedRowIds: Set<string>;
  onSelectionChange: (value: SetStateAction<Set<string>>) => void;
  onDeleteSelected?: () => void;
  isDeleting?: boolean;
  // Inline editing props
  focusedCell: CellPosition | null;
  editingCell: CellPosition | null;
  onCellFocus: (position: CellPosition | null) => void;
  onCellEdit: (position: CellPosition | null) => void;
  onInlineSave: (rowId: string, fieldId: string, value: unknown) => void;
  onOpenSheet: (rowId: string) => void;
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
  selectedRowIds,
  onSelectionChange,
  onDeleteSelected,
  isDeleting = false,
  focusedCell,
  editingCell,
  onCellFocus,
  onCellEdit,
  onInlineSave,
  onOpenSheet,
  className,
}: TableViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rows = table?.rows || [];
  const rowHeightPx = ROW_HEIGHT_CONFIG[rowHeight].height;

  // Selection handlers - use updater function to avoid stale closure with memoized rows
  const toggleRowSelection = useCallback(
    (rowId: string) => {
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

  // Keyboard navigation
  const getNextCell = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down' | 'next' | 'prev'): CellPosition | null => {
      if (!focusedCell || !table) return null;

      const { fields } = table;
      const currentRowIndex = rows.findIndex((r) => r.id === focusedCell.rowId);
      const currentFieldIndex = fields.findIndex((f) => f.id === focusedCell.fieldId);

      if (currentRowIndex === -1 || currentFieldIndex === -1) return null;

      let newRowIndex = currentRowIndex;
      let newFieldIndex = currentFieldIndex;

      switch (direction) {
        case 'left':
          newFieldIndex = Math.max(0, currentFieldIndex - 1);
          break;
        case 'right':
          newFieldIndex = Math.min(fields.length - 1, currentFieldIndex + 1);
          break;
        case 'up':
          newRowIndex = Math.max(0, currentRowIndex - 1);
          break;
        case 'down':
          newRowIndex = Math.min(rows.length - 1, currentRowIndex + 1);
          break;
        case 'next': // Tab
          if (currentFieldIndex < fields.length - 1) {
            newFieldIndex = currentFieldIndex + 1;
          } else if (currentRowIndex < rows.length - 1) {
            newRowIndex = currentRowIndex + 1;
            newFieldIndex = 0;
          }
          break;
        case 'prev': // Shift+Tab
          if (currentFieldIndex > 0) {
            newFieldIndex = currentFieldIndex - 1;
          } else if (currentRowIndex > 0) {
            newRowIndex = currentRowIndex - 1;
            newFieldIndex = fields.length - 1;
          }
          break;
      }

      const newRow = rows[newRowIndex];
      const newField = fields[newFieldIndex];

      if (!newRow || !newField) return null;
      if (newRow.id === focusedCell.rowId && newField.id === focusedCell.fieldId) return null;

      return { rowId: newRow.id, fieldId: newField.id };
    },
    [focusedCell, table, rows]
  );

  // Scroll row into view when navigating
  const scrollToRow = useCallback(
    (rowId: string) => {
      const rowIndex = rows.findIndex((r) => r.id === rowId);
      if (rowIndex !== -1) {
        virtualizer.scrollToIndex(rowIndex, { align: 'auto' });
      }
    },
    [rows, virtualizer]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if we're editing (let the editor handle it)
      if (editingCell) return;

      // Don't handle if focus is in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Only handle if we have a focused cell or table is focused
      if (!focusedCell && !scrollContainerRef.current?.contains(target)) {
        return;
      }

      switch (e.key) {
        case 'Tab': {
          if (!focusedCell) return;
          e.preventDefault();
          const next = getNextCell(e.shiftKey ? 'prev' : 'next');
          if (next) {
            onCellFocus(next);
            scrollToRow(next.rowId);
          }
          break;
        }
        case 'ArrowLeft': {
          if (!focusedCell) return;
          e.preventDefault();
          const next = getNextCell('left');
          if (next) onCellFocus(next);
          break;
        }
        case 'ArrowRight': {
          if (!focusedCell) return;
          e.preventDefault();
          const next = getNextCell('right');
          if (next) onCellFocus(next);
          break;
        }
        case 'ArrowUp': {
          if (!focusedCell) return;
          e.preventDefault();
          const next = getNextCell('up');
          if (next) {
            onCellFocus(next);
            scrollToRow(next.rowId);
          }
          break;
        }
        case 'ArrowDown': {
          if (!focusedCell) return;
          e.preventDefault();
          const next = getNextCell('down');
          if (next) {
            onCellFocus(next);
            scrollToRow(next.rowId);
          }
          break;
        }
        case ' ': { // Space - open sheet
          if (!focusedCell) return;
          e.preventDefault();
          onOpenSheet(focusedCell.rowId);
          break;
        }
        case 'Enter': { // Start editing
          if (!focusedCell) return;
          e.preventDefault();
          onCellEdit(focusedCell);
          break;
        }
        case 'Escape': { // Clear focus
          if (focusedCell) {
            e.preventDefault();
            onCellFocus(null);
          }
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, editingCell, getNextCell, onCellFocus, onCellEdit, onOpenSheet, scrollToRow]);

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
          selectedCount={selectedRowIds.size}
          onDeleteSelected={onDeleteSelected}
          onDeselectAll={deselectAll}
          isDeleting={isDeleting}
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
            allSelected={allSelected}
            someSelected={someSelected}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            disabled={isDeleting}
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
                      isChecked={selectedRowIds.has(row.id)}
                      onCheckChange={() => toggleRowSelection(row.id)}
                      checkDisabled={isDeleting}
                      focusedCell={focusedCell}
                      editingCell={editingCell}
                      onCellFocus={onCellFocus}
                      onCellEdit={onCellEdit}
                      onInlineSave={onInlineSave}
                      onOpenSheet={onOpenSheet}
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
