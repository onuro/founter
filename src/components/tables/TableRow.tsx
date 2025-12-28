'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Field, Row, RowHeight } from '@/types/tables';
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
        if (
          target.closest('[data-lightbox-trigger]') ||
          target.closest('[data-row-checkbox]') ||
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

        {fields.map((field) => (
          <div
            key={field.id}
            style={{ width: field.width, minWidth: field.width, maxWidth: field.width }}
            className="border-r border-border last:border-r-0"
          >
            <TableCell field={field} value={row.values[field.id]} rowHeight={rowHeight} />
          </div>
        ))}
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
      prevProps.fields === nextProps.fields
    );
  }
);
