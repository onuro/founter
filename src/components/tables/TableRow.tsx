'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Field, Row, RowHeight, CellPosition } from '@/types/tables';
import { ROW_HEIGHT_CONFIG } from '@/types/tables';
import { TableCell } from './TableCell';
import { Checkbox } from '@/components/ui/checkbox';
import { SELECTION_COLUMN_WIDTH } from './TableView';

interface TableRowProps {
  row: Row;
  fields: Field[];
  rowHeight?: RowHeight;
  isSelected?: boolean;
  onClick?: () => void;
  // Selection props
  isChecked?: boolean;
  onCheckChange?: () => void;
  checkDisabled?: boolean;
  // Inline editing props
  focusedCell: CellPosition | null;
  editingCell: CellPosition | null;
  onCellFocus: (position: CellPosition | null) => void;
  onCellEdit: (position: CellPosition | null) => void;
  onInlineSave: (rowId: string, fieldId: string, value: unknown) => void;
  onOpenSheet: (rowId: string) => void;
  className?: string;
}

export const TableRow = memo(
  function TableRow({
    row,
    fields,
    rowHeight = 'small',
    isSelected,
    onClick,
    isChecked = false,
    onCheckChange,
    checkDisabled = false,
    focusedCell,
    editingCell,
    onCellFocus,
    onCellEdit,
    onInlineSave,
    onOpenSheet,
    className,
  }: TableRowProps) {
    const config = ROW_HEIGHT_CONFIG[rowHeight];

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // Don't open detail sheet if:
        // 1. Clicking on image thumbnail (lightbox trigger)
        // 2. ANY dialog is currently open (prevents portal click leakage)
        // 3. Clicking on checkbox
        // 4. Clicking on a cell (handled by cell click)
        if (
          target.closest('[data-lightbox-trigger]') ||
          target.closest('[data-row-checkbox]') ||
          target.closest('[data-table-cell]') ||
          document.querySelector('[role="dialog"]')
        ) {
          return;
        }

        onClick?.();
      },
      [onClick]
    );

    const handleCheckboxCellClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!checkDisabled) {
          onCheckChange?.();
        }
      },
      [checkDisabled, onCheckChange]
    );

    const handleCellClick = useCallback(
      (e: React.MouseEvent, fieldId: string) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;

        // Don't focus if clicking lightbox trigger
        if (target.closest('[data-lightbox-trigger]')) {
          return;
        }

        onCellFocus({ rowId: row.id, fieldId });
      },
      [row.id, onCellFocus]
    );

    const handleCellDoubleClick = useCallback(
      (e: React.MouseEvent, fieldId: string) => {
        e.stopPropagation();
        onCellEdit({ rowId: row.id, fieldId });
      },
      [row.id, onCellEdit]
    );

    const handleCellSave = useCallback(
      (fieldId: string, value: unknown) => {
        onInlineSave(row.id, fieldId, value);
        // Don't auto-close - let each editor decide when to close via onCancel
      },
      [row.id, onInlineSave]
    );

    const handleCellCancel = useCallback(() => {
      onCellEdit(null);
    }, [onCellEdit]);

    return (
      <div
        className={cn(
          'flex items-center border-b border-border bg-neutral-950 hover:bg-neutral-950/50 transition-colors cursor-pointer',
          isSelected && 'bg-neutral-950/70',
          className
        )}
        style={{ height: config.height }}
        onClick={handleClick}
      >
        {/* Selection checkbox cell */}
        <div
          data-row-checkbox
          className="flex items-start pt-3 justify-center border-r border-border shrink-0 h-full"
          style={{ width: SELECTION_COLUMN_WIDTH, minWidth: SELECTION_COLUMN_WIDTH }}
          onClick={handleCheckboxCellClick}
        >
          <Checkbox
            checked={isChecked}
            disabled={checkDisabled}
            aria-label={`Select row ${row.id}`}
            className="cursor-pointer pointer-events-none"
          />
        </div>

        {fields.map((field) => {
          const isFocused = focusedCell?.rowId === row.id && focusedCell?.fieldId === field.id;
          const isEditing = editingCell?.rowId === row.id && editingCell?.fieldId === field.id;

          return (
            <div
              key={field.id}
              data-table-cell
              style={{ width: field.width, minWidth: field.width, maxWidth: field.width }}
              className={cn(
                'border-r border-border last:border-r-0 relative',
                isFocused && !isEditing && 'ring-1 ring-primary ring-inset'
              )}
              onClick={(e) => handleCellClick(e, field.id)}
              onDoubleClick={(e) => handleCellDoubleClick(e, field.id)}
            >
              <TableCell
                field={field}
                value={row.values[field.id]}
                rowHeight={rowHeight}
                isFocused={isFocused}
                isEditing={isEditing}
                onSave={(value) => handleCellSave(field.id, value)}
                onCancel={handleCellCancel}
                onOpenSheet={() => onOpenSheet(row.id)}
              />
            </div>
          );
        })}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row.id === nextProps.row.id &&
      prevProps.row.updatedAt === nextProps.row.updatedAt &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isChecked === nextProps.isChecked &&
      prevProps.checkDisabled === nextProps.checkDisabled &&
      prevProps.rowHeight === nextProps.rowHeight &&
      prevProps.fields === nextProps.fields &&
      prevProps.focusedCell === nextProps.focusedCell &&
      prevProps.editingCell === nextProps.editingCell
    );
  }
);
