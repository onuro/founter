'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Table2, MoreHorizontal, Pencil, Trash2, GripVertical, Download, Upload } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TableSummary } from '@/types/tables';

interface TablesSidebarProps {
  tables: TableSummary[];
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  onCreateTable: () => void;
  onDeleteTable: (id: string) => void;
  onRenameTable: (id: string, name: string) => void;
  onReorderTables: (orderedIds: string[]) => void;
  onExportTable: (id: string) => void;
  onImportTable: () => void;
  isLoading?: boolean;
}

interface SortableTableItemProps {
  table: TableSummary;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onExport: () => void;
}

function SortableTableItem({
  table,
  isSelected,
  onSelect,
  onDelete,
  onRename,
  onExport,
}: SortableTableItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(table.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRename = () => {
    if (newName.trim() && newName !== table.name) {
      onRename(newName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-sm transition-colors',
        isSelected ? 'bg-neutral-800/50' : 'hover:bg-neutral-900',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <button
        className="shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Table icon & name */}
      <button
        onClick={onSelect}
        className="flex-1 flex items-center gap-2 min-w-0 text-left"
      >
        <Table2 className="w-4 h-4 shrink-0 text-muted-foreground" />
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="flex-1 bg-transparent border-b border-primary outline-none text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-sm">{table.name}</span>
        )}
      </button>

      {/* Row count */}
      <span className="text-xs text-muted-foreground shrink-0">
        {table.rowCount}
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TablesSidebar({
  tables,
  selectedTableId,
  onSelectTable,
  onCreateTable,
  onDeleteTable,
  onRenameTable,
  onReorderTables,
  onExportTable,
  onImportTable,
  isLoading,
}: TablesSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tables.findIndex((t) => t.id === active.id);
      const newIndex = tables.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(tables, oldIndex, newIndex);
      onReorderTables(newOrder.map((t) => t.id));
    }
  };

  return (
    <div className="flex flex-col h-full sticky top-0 bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-r border-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          All Tables
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCreateTable}>
              <Plus className="w-4 h-4 mr-2" />
              Create Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportTable}>
              <Upload className="w-4 h-4 mr-2" />
              Import Table
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tables list */}
      <div className="flex-1 overflow-y-auto p-2 border-r border-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-8">
            <Table2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No tables yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateTable}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create table
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tables.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {tables.map((table) => (
                  <SortableTableItem
                    key={table.id}
                    table={table}
                    isSelected={selectedTableId === table.id}
                    onSelect={() => onSelectTable(table.id)}
                    onDelete={() => onDeleteTable(table.id)}
                    onRename={(name) => onRenameTable(table.id, name)}
                    onExport={() => onExportTable(table.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
