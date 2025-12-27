'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import type { FieldType, CreateFieldInput, Field, SelectFieldOptions, SelectChoice } from '@/types/tables';
import { FIELD_TYPE_CONFIG, TAG_COLORS } from '@/types/tables';
import { FieldTypeIcon } from './FieldTypeIcon';

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: CreateFieldInput, cleanupChoiceIds?: string[]) => Promise<void>;
  existingField?: Field | null; // For editing
  tableId?: string | null;
}

const FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'url',
  'select',
  'date',
  'boolean',
  'longText',
  'image',
];

export function AddFieldDialog({
  open,
  onOpenChange,
  onAdd,
  existingField,
  tableId,
}: AddFieldDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Select field options
  const [choices, setChoices] = useState<{ id: string; label: string; color: string }[]>([]);
  const [newChoiceLabel, setNewChoiceLabel] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(true);

  // Track original choices for detecting removed options
  const [originalChoices, setOriginalChoices] = useState<SelectChoice[]>([]);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [affectedRowCount, setAffectedRowCount] = useState(0);
  const [pendingSubmit, setPendingSubmit] = useState<{
    input: CreateFieldInput;
    removedChoiceIds: string[];
  } | null>(null);

  const isEditing = !!existingField;

  // Sync state when existingField changes or dialog opens
  useEffect(() => {
    if (open) {
      if (existingField) {
        setName(existingField.name);
        setType(existingField.type);
        setRequired(existingField.required);
        const selectOptions = existingField.options as SelectFieldOptions | null;
        const existingChoices = selectOptions?.choices || [];
        setChoices(existingChoices);
        setOriginalChoices(existingChoices); // Store original for comparison
        setAllowMultiple(selectOptions?.allowMultiple ?? true);
      } else {
        // Reset form for new field
        setName('');
        setType('text');
        setRequired(false);
        setChoices([]);
        setOriginalChoices([]);
        setAllowMultiple(true);
      }
      setNewChoiceLabel('');
      // Reset confirmation state
      setShowConfirmDialog(false);
      setAffectedRowCount(0);
      setPendingSubmit(null);
    }
  }, [open, existingField]);

  // Execute the actual submit (called directly or after confirmation)
  const executeSubmit = async (input: CreateFieldInput, cleanupChoiceIds: string[] = []) => {
    try {
      await onAdd(input, cleanupChoiceIds.length > 0 ? cleanupChoiceIds : undefined);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save field:', error);
    } finally {
      setIsSubmitting(false);
      setPendingSubmit(null);
    }
  };

  // Handle confirmation dialog confirm action
  const handleConfirmRemoval = async () => {
    if (!pendingSubmit) return;
    setShowConfirmDialog(false);
    await executeSubmit(pendingSubmit.input, pendingSubmit.removedChoiceIds);
  };

  // Handle confirmation dialog cancel action
  const handleCancelRemoval = () => {
    setShowConfirmDialog(false);
    setIsSubmitting(false);
    setPendingSubmit(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      const input: CreateFieldInput = {
        name: name.trim(),
        type,
        required,
      };

      // Add options based on type
      if (type === 'select') {
        input.options = { choices, allowMultiple };
      }

      // Check if we're editing and have removed any choices
      if (isEditing && existingField && type === 'select' && tableId) {
        const removedChoiceIds = originalChoices
          .filter((oc) => !choices.some((c) => c.id === oc.id))
          .map((c) => c.id);

        if (removedChoiceIds.length > 0) {
          // Check if any rows are affected
          try {
            const response = await fetch(
              `/api/tables/${tableId}/fields/${existingField.id}/affected-rows?choiceIds=${removedChoiceIds.join(',')}`
            );
            const data = await response.json();

            if (data.success && data.data.total > 0) {
              // Show confirmation dialog
              setAffectedRowCount(data.data.total);
              setPendingSubmit({ input, removedChoiceIds });
              setShowConfirmDialog(true);
              return; // Don't proceed, wait for confirmation
            }
          } catch (error) {
            console.error('Failed to check affected rows:', error);
            // On error, proceed without cleanup to be safe
          }
        }
      }

      // No removed choices or no affected rows, proceed normally
      await executeSubmit(input);
    } catch (error) {
      console.error('Failed to save field:', error);
      setIsSubmitting(false);
    }
  };

  const addChoice = () => {
    if (!newChoiceLabel.trim()) return;
    const newChoice = {
      id: crypto.randomUUID(),
      label: newChoiceLabel.trim(),
      color: TAG_COLORS[choices.length % TAG_COLORS.length].name,
    };
    setChoices([...choices, newChoice]);
    setNewChoiceLabel('');
  };

  const removeChoice = (id: string) => {
    setChoices(choices.filter((c) => c.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'select') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
  <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Field' : 'Add Field'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Field Name */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Field Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Title, Status, Due Date"
              className="bg-secondary"
              autoFocus
            />
          </div>

          {/* Field Type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Field Type
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {FIELD_TYPES.map((fieldType) => {
                const config = FIELD_TYPE_CONFIG[fieldType];
                return (
                  <button
                    key={fieldType}
                    onClick={() => setType(fieldType)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-md border transition-colors',
                      type === fieldType
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-neutral-600 bg-secondary/50'
                    )}
                  >
                    <FieldTypeIcon type={fieldType} size="md" />
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select Options */}
          {type === 'select' && (
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Options
              </Label>

              {/* Existing choices */}
              <div className="space-y-2">
                {choices.map((choice) => {
                  const color = TAG_COLORS.find((c) => c.name === choice.color) || TAG_COLORS[0];
                  return (
                    <div
                      key={choice.id}
                      className="flex items-center justify-between gap-2 p-2 rounded bg-neutral-800/50"
                    >
                      <span className={cn('px-2 py-0.5 rounded text-xs', color.bg, color.text)}>
                        {choice.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeChoice(choice.id)}
                        className="h-6 w-6"
                      >
                        &times;
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Add new choice */}
              <div className="flex gap-2">
                <Input
                  value={newChoiceLabel}
                  onChange={(e) => setNewChoiceLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChoice();
                    }
                  }}
                  placeholder="Add option..."
                  className="bg-secondary flex-1"
                />
                <Button variant="secondary" size="sm" onClick={addChoice}>
                  Add
                </Button>
              </div>

              {/* Allow multiple */}
              <div className="flex items-center justify-between pt-2">
                <Label className="text-sm text-muted-foreground">Allow multiple selections</Label>
                <Switch checked={allowMultiple} onCheckedChange={setAllowMultiple} />
              </div>
            </div>
          )}

          {/* Required */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Required field</Label>
            <Switch checked={required} onCheckedChange={setRequired} />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Confirmation dialog for removing options in use */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove options in use?</AlertDialogTitle>
          <AlertDialogDescription>
            {affectedRowCount} {affectedRowCount === 1 ? 'row has a value' : 'rows have values'} that will be removed.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelRemoval}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmRemoval}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
