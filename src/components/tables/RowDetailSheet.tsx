'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Trash2, ArrowDownToDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Field, Row, FieldType } from '@/types/tables';
import {
  TextInput,
  NumberInput,
  UrlInput,
  SelectInput,
  DateInput,
  BooleanInput,
  LongTextInput,
  ImageInput,
} from './field-inputs';

interface RowDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: Row | null;
  fields: Field[];
  tableId: string;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onDelete?: (rowId: string) => Promise<void>;
  isNew?: boolean;
}

function getDefaultValues(fields: Field[], row: Row | null): Record<string, unknown> {
  if (row) return row.values;

  const defaults: Record<string, unknown> = {};
  fields.forEach((field) => {
    switch (field.type) {
      case 'text':
      case 'url':
      case 'longText':
        defaults[field.id] = '';
        break;
      case 'number':
        defaults[field.id] = null;
        break;
      case 'select':
        defaults[field.id] = [];
        break;
      case 'date':
        defaults[field.id] = null;
        break;
      case 'boolean':
        defaults[field.id] = false;
        break;
      case 'image':
        defaults[field.id] = null;
        break;
    }
  });
  return defaults;
}

export function RowDetailSheet({
  open,
  onOpenChange,
  row,
  fields,
  tableId,
  onSave,
  onDelete,
  isNew = false,
}: RowDetailSheetProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<Record<string, unknown>>({
    defaultValues: getDefaultValues(fields, row),
  });

  // Reset form when row changes
  useEffect(() => {
    form.reset(getDefaultValues(fields, row));
  }, [row, fields, form]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!row || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(row.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderFieldInput = (field: Field) => {
    const value = form.watch(field.id);

    switch (field.type as FieldType) {
      case 'text':
        return (
          <TextInput
            field={field}
            value={value as string}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'number':
        return (
          <NumberInput
            field={field}
            value={value as number | null}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'url':
        return (
          <UrlInput
            field={field}
            value={value as string}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'select':
        return (
          <SelectInput
            field={field}
            value={value as string | string[]}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'date':
        return (
          <DateInput
            field={field}
            value={value as string | null}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'boolean':
        return (
          <BooleanInput
            field={field}
            value={value as boolean}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'longText':
        return (
          <LongTextInput
            field={field}
            value={value as string}
            onChange={(v) => form.setValue(field.id, v)}
          />
        );
      case 'image':
        return (
          <ImageInput
            field={field}
            value={value as string | null}
            onChange={(v) => form.setValue(field.id, v)}
            tableId={tableId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle>{isNew ? 'Add Row' : 'Edit Row'}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            {/* Form fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {fields.map((field) => (
                <div key={field.id}>{renderFieldInput(field)}</div>
              ))}
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center justify-between p-4 border-t border-border">
              {!isNew && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting || isSaving}
                  className="text-destructive-fg"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" className="min-w-32" disabled={isSaving}>
                  <ArrowDownToDot className="size-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
