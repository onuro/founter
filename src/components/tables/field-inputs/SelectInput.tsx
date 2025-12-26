'use client';

import { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Field, SelectFieldOptions, SelectChoice } from '@/types/tables';
import { TAG_COLORS } from '@/types/tables';

interface SelectInputProps {
  field: Field;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

function getTagColor(colorName: string) {
  return TAG_COLORS.find((c) => c.name === colorName) || TAG_COLORS[0];
}

export function SelectInput({ field, value, onChange }: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newChoiceLabel, setNewChoiceLabel] = useState('');

  const options = field.options as SelectFieldOptions | null;
  const choices = options?.choices || [];
  const allowMultiple = options?.allowMultiple ?? true;

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const toggleChoice = (choiceId: string) => {
    if (allowMultiple) {
      if (selectedValues.includes(choiceId)) {
        onChange(selectedValues.filter((v) => v !== choiceId));
      } else {
        onChange([...selectedValues, choiceId]);
      }
    } else {
      onChange(choiceId);
      setIsOpen(false);
    }
  };

  const removeChoice = (choiceId: string) => {
    onChange(selectedValues.filter((v) => v !== choiceId));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="w-full justify-start h-auto min-h-[40px] px-3 py-2 font-normal"
          >
            {selectedValues.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selectedValues.map((v) => {
                  const choice = choices.find((c: SelectChoice) => c.id === v);

                  // Handle orphan values (values not in choices list)
                  if (!choice) {
                    return (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeChoice(v);
                        }}
                        title="Invalid value - click to remove"
                      >
                        {String(v)}
                        <X className="w-3 h-3 cursor-pointer" />
                      </span>
                    );
                  }

                  const color = getTagColor(choice.color);
                  return (
                    <span
                      key={v}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        color.bg,
                        color.text
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChoice(v);
                      }}
                    >
                      {choice.label}
                      <X className="w-3 h-3 cursor-pointer" />
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-muted-foreground">Select options...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-2" align="start">
          <div className="space-y-2">
            {choices.map((choice: SelectChoice) => {
              const isSelected = selectedValues.includes(choice.id);
              const color = getTagColor(choice.color);
              return (
                <button
                  key={choice.id}
                  onClick={() => toggleChoice(choice.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-neutral-800 transition-colors',
                    isSelected && 'bg-neutral-800'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      isSelected ? 'bg-primary border-primary' : 'border-neutral-600'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className={cn('px-2 py-0.5 rounded text-xs', color.bg, color.text)}>
                    {choice.label}
                  </span>
                </button>
              );
            })}

            {choices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No options available
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
