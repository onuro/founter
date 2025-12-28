'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SELECTION_COLUMN_WIDTH } from './TableView';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Field } from '@/types/tables';
import { FieldTypeIcon } from './FieldTypeIcon';

interface TableHeaderProps {
  fields: Field[];
  onAddField: () => void;
  onEditField: (field: Field) => void;
  onDeleteField: (fieldId: string) => void;
  onReorderFields: (orderedIds: string[]) => void;
  onResizeField: (fieldId: string, width: number) => void;
  // Selection props
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  disabled?: boolean;
  className?: string;
}

interface SortableHeaderCellProps {
  field: Field;
  liveWidth: number | null; // Live width during resize drag
  onEditField: (field: Field) => void;
  onDeleteField: (fieldId: string) => void;
  onResizeStart: (fieldId: string, startX: number, startWidth: number) => void;
}

function SortableHeaderCell({
  field,
  liveWidth,
  onEditField,
  onDeleteField,
  onResizeStart,
}: SortableHeaderCellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  // Use liveWidth during drag, otherwise use field.width
  const currentWidth = liveWidth ?? field.width;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    width: currentWidth,
    minWidth: currentWidth,
    maxWidth: currentWidth,
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onResizeStart(field.id, e.clientX, field.width);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onDoubleClick={() => onEditField(field)}
      className={cn(
        'group relative flex items-center justify-between border-r border-border px-3 py-2 select-none',
        isDragging && 'opacity-50 z-20'
      )}
    >

      {/* Field info */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FieldTypeIcon type={field.type} size="sm" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
          {field.name}
        </span>
        {field.required && (
          <span className="text-primary text-xs">*</span>
        )}
      </div>

      {/* Drag handle */}
      <button
        className="shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground mr-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 shrink-0"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEditField(field)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit Field
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDeleteField(field.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Field
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary/70"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

export function TableHeader({
  fields,
  onAddField,
  onEditField,
  onDeleteField,
  onReorderFields,
  onResizeField,
  allSelected = false,
  someSelected = false,
  onSelectAll,
  onDeselectAll,
  disabled = false,
  className,
}: TableHeaderProps) {
  const [resizing, setResizing] = useState<{
    fieldId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Track live width during resize for visual feedback
  const [liveWidth, setLiveWidth] = useState<{ fieldId: string; width: number } | null>(null);

  // Track field pending deletion for confirmation
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);

  const handleDeleteClick = useCallback((field: Field) => {
    setFieldToDelete(field);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (fieldToDelete) {
      onDeleteField(fieldToDelete.id);
      setFieldToDelete(null);
    }
  }, [fieldToDelete, onDeleteField]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      const newOrder = arrayMove(fields, oldIndex, newIndex);
      onReorderFields(newOrder.map((f) => f.id));
    }
  };

  const handleResizeStart = useCallback(
    (fieldId: string, startX: number, startWidth: number) => {
      setResizing({ fieldId, startX, startWidth });
    },
    []
  );

  // Handle resize mouse move and up
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(100, Math.min(600, resizing.startWidth + delta));
      setLiveWidth({ fieldId: resizing.fieldId, width: newWidth });
    };

    const handleMouseUp = (e: MouseEvent) => {
      const delta = e.clientX - resizing.startX;
      const newWidth = Math.max(100, Math.min(600, resizing.startWidth + delta));
      onResizeField(resizing.fieldId, newWidth);
      setResizing(null);
      setLiveWidth(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, onResizeField]);

  const handleCheckboxChange = () => {
    if (allSelected || someSelected) {
      onDeselectAll?.();
    } else {
      onSelectAll?.();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center border-b border-border bg-surface sticky top-0 z-10',
        className
      )}
    >
      {/* Selection checkbox column */}
      <div
        className="flex items-center justify-center border-r border-border shrink-0"
        style={{ width: SELECTION_COLUMN_WIDTH, minWidth: SELECTION_COLUMN_WIDTH }}
      >
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={handleCheckboxChange}
          disabled={disabled}
          aria-label="Select all rows"
          className="cursor-pointer"
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={horizontalListSortingStrategy}
        >
          {fields.map((field) => (
            <SortableHeaderCell
              key={field.id}
              field={field}
              liveWidth={liveWidth?.fieldId === field.id ? liveWidth.width : null}
              onEditField={onEditField}
              onDeleteField={() => handleDeleteClick(field)}
              onResizeStart={handleResizeStart}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add field button */}
      <div className="flex items-center justify-center w-[60px] px-2 py-2 border-l border-border shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onAddField}
          className="h-6 w-6"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Delete field confirmation dialog */}
      <AlertDialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete field "{fieldToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this field and all its data from every row in the table. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
