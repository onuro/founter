'use client';

import { Plus, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { CustomTable, Field, Row } from '@/types/tables';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

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
  className,
}: TableViewProps) {
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

  const { fields, rows } = table;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Table content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Header */}
          <TableHeader
            fields={fields}
            onAddField={onAddField}
            onEditField={onEditField}
            onDeleteField={onDeleteField}
            onReorderFields={onReorderFields}
            onResizeField={onResizeField}
          />

          {/* Rows */}
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
            <div>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  row={row}
                  fields={fields}
                  isSelected={selectedRowId === row.id}
                  onClick={() => onRowSelect(row.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add row button */}
      {rows.length > 0 && (
        <div className="border-t border-border p-3">
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
      )}
    </div>
  );
}
