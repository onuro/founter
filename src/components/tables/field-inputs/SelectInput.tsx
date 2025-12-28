'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { Field, SelectFieldOptions, SelectChoice } from '@/types/tables';
import { TAG_COLORS, TAG_BORING_STYLE } from '@/types/tables';

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

  const options = field.options as SelectFieldOptions | null;
  const choices = options?.choices || [];
  const allowMultiple = options?.allowMultiple ?? true;
  const boringMode = options?.boringMode ?? false;

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

  const removeChoice = (choiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
            type="button"
            variant="inputlike"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between h-auto min-h-10 pl-4 has-[span.inline-flex]:pl-2 py-2 font-normal"
          >
            <div className="flex flex-wrap items-center gap-1 pr-2">
              {selectedValues.length > 0 ? (
                selectedValues.map((v) => {
                  const choice = choices.find((c: SelectChoice) => c.id === v);

                  // Handle orphan values (values not in choices list)
                  if (!choice) {
                    return (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
                        onClick={(e) => removeChoice(v, e)}
                        title="Invalid value - click to remove"
                      >
                        {String(v)}
                        <X className="size-3 cursor-pointer" />
                      </span>
                    );
                  }

                  const color = boringMode ? TAG_BORING_STYLE : getTagColor(choice.color);
                  return (
                    <span
                      key={v}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                        color.bg,
                        color.text
                      )}
                    >
                      {choice.label}
                      <span
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer hover:opacity-70"
                        onClick={(e) => removeChoice(v, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            removeChoice(v, e as unknown as React.MouseEvent);
                          }
                        }}
                      >
                        <X className="size-3" />
                      </span>
                    </span>
                  );
                })
              ) : (
                <span className="text-muted-foreground">Select options...</span>
              )}
            </div>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground/80" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popper-anchor-width] min-w-xs p-0" align="start">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {choices.map((choice: SelectChoice) => {
                  const isSelected = selectedValues.includes(choice.id);
                  const color = boringMode ? TAG_BORING_STYLE : getTagColor(choice.color);
                  return (
                    <CommandItem
                      key={choice.id}
                      value={choice.label}
                      onSelect={() => toggleChoice(choice.id)}
                      className="flex items-center gap-2"
                    >
                      <span className={cn('px-2 py-0.5 rounded text-sm font-medium', color.bg, color.text)}>
                        {choice.label}
                      </span>
                      {isSelected && <Check className="size-4 ml-auto" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
