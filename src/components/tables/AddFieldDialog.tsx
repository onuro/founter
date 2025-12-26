'use client';

import { useState, useEffect } from 'react';
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
import type { FieldType, CreateFieldInput, Field, SelectFieldOptions } from '@/types/tables';
import { FIELD_TYPE_CONFIG, TAG_COLORS } from '@/types/tables';
import { FieldTypeIcon } from './FieldTypeIcon';

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (input: CreateFieldInput) => Promise<void>;
  existingField?: Field | null; // For editing
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
}: AddFieldDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Select field options
  const [choices, setChoices] = useState<{ id: string; label: string; color: string }[]>([]);
  const [newChoiceLabel, setNewChoiceLabel] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(true);

  const isEditing = !!existingField;

  // Sync state when existingField changes or dialog opens
  useEffect(() => {
    if (open) {
      if (existingField) {
        setName(existingField.name);
        setType(existingField.type);
        setRequired(existingField.required);
        const selectOptions = existingField.options as SelectFieldOptions | null;
        setChoices(selectOptions?.choices || []);
        setAllowMultiple(selectOptions?.allowMultiple ?? true);
      } else {
        // Reset form for new field
        setName('');
        setType('text');
        setRequired(false);
        setChoices([]);
        setAllowMultiple(true);
      }
      setNewChoiceLabel('');
    }
  }, [open, existingField]);

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

      await onAdd(input);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add field:', error);
    } finally {
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
  );
}
