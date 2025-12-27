'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Field, Row, RowHeight } from '@/types/tables';
import { ROW_HEIGHT_CONFIG } from '@/types/tables';
import { TableCell } from './TableCell';

interface TableRowProps {
  row: Row;
  fields: Field[];
  rowHeight?: RowHeight;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TableRow = memo(
  function TableRow({
    row,
    fields,
    rowHeight = 'small',
    isSelected,
    onClick,
    className,
  }: TableRowProps) {
    const config = ROW_HEIGHT_CONFIG[rowHeight];

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // Don't open detail sheet if:
        // 1. Clicking on image thumbnail (lightbox trigger)
        // 2. ANY dialog is currently open (prevents portal click leakage)
        if (
          target.closest('[data-lightbox-trigger]') ||
          document.querySelector('[role="dialog"]')
        ) {
          return;
        }

        onClick?.();
      },
      [onClick]
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
      prevProps.rowHeight === nextProps.rowHeight &&
      prevProps.fields === nextProps.fields
    );
  }
);
