'use client';

import { cn } from '@/lib/utils';
import type { Field, Row } from '@/types/tables';
import { TableCell } from './TableCell';

interface TableRowProps {
  row: Row;
  fields: Field[];
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TableRow({
  row,
  fields,
  isSelected,
  onClick,
  className,
}: TableRowProps) {
  return (
    <div
      className={cn(
        'flex items-center border-b border-border hover:bg-neutral-950/50 transition-colors cursor-pointer',
        isSelected && 'bg-neutral-950/70',
        className
      )}
      onClick={onClick}
    >
      {fields.map((field) => (
        <div
          key={field.id}
          style={{ width: field.width, minWidth: field.width, maxWidth: field.width }}
          className="border-r border-border last:border-r-0"
        >
          <TableCell field={field} value={row.values[field.id]} />
        </div>
      ))}
    </div>
  );
}
