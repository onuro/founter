'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import type { Field, SelectFieldOptions, SelectChoice } from '@/types/tables';
import { TAG_COLORS, TAG_BORING_STYLE } from '@/types/tables';

interface InlineSelectEditorProps {
  value: string | string[] | null;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  field: Field;
}

function getTagColor(colorName: string) {
  return TAG_COLORS.find((c) => c.name === colorName) || TAG_COLORS[0];
}

export function InlineSelectEditor({ value, onSave, onCancel, field }: InlineSelectEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = field.options as SelectFieldOptions | null;
  const choices = options?.choices || [];
  const allowMultiple = options?.allowMultiple ?? true;
  const boringMode = options?.boringMode ?? false;

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Filter choices by search
  const filteredChoices = choices.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  // Update position based on anchor element
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left - 12,
        width: rect.width + 24,
      });
    }
  }, []);

  const portalRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen; // Keep ref in sync with state

  // Initial position and scroll listener
  useEffect(() => {
    updatePosition();

    const handleScroll = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [updatePosition]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if popover dropdown is open - let it handle its own interactions
      if (isOpenRef.current) return;

      const target = e.target as HTMLElement;

      // Don't close if clicking inside our portal
      if (portalRef.current && portalRef.current.contains(target)) return;

      onCancel();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleRemove = (choiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValues = selectedValues.filter((v) => v !== choiceId);
    onSave(allowMultiple ? newValues : newValues[0] || null);
  };

  const handleSelect = (choiceId: string) => {
    if (selectedValues.includes(choiceId)) {
      // Deselect
      const newValues = selectedValues.filter((v) => v !== choiceId);
      onSave(allowMultiple ? newValues : null);
    } else {
      // Select
      if (allowMultiple) {
        onSave([...selectedValues, choiceId]);
      } else {
        onSave(choiceId);
        setIsOpen(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isOpen) {
        setIsOpen(false);
      } else {
        onCancel();
      }
    }
  };

  return (
    <>
      {/* Invisible anchor to get position */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Portal the editor to body to escape overflow constraints */}
      {position && createPortal(
        <div
          ref={portalRef}
          className="fixed bg-neutral-950 border border-primary rounded shadow-lg px-2 py-1.5"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            zIndex: 9999,
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-1 flex-wrap w-full">
            {/* Selected tags */}
            {selectedValues.map((v) => {
              const choice = choices.find((c: SelectChoice) => c.id === v);
              if (!choice) {
                return (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30"
                  >
                    {String(v)}
                    <button
                      type="button"
                      className="hover:opacity-70"
                      onClick={(e) => handleRemove(v, e)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              }

              const color = boringMode ? TAG_BORING_STYLE : getTagColor(choice.color);
              return (
                <span
                  key={v}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium',
                    color.bg,
                    color.text
                  )}
                >
                  {choice.label}
                  <button
                    type="button"
                    className="hover:opacity-70"
                    onClick={(e) => handleRemove(v, e)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Add button with popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-neutral-800"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="h-8 pl-8 text-sm"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {filteredChoices.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                      No options found
                    </div>
                  ) : (
                    filteredChoices.map((choice: SelectChoice) => {
                      const isSelected = selectedValues.includes(choice.id);
                      const color = boringMode ? TAG_BORING_STYLE : getTagColor(choice.color);
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-neutral-800 text-left"
                          onClick={() => handleSelect(choice.id)}
                        >
                          <span className={cn('px-2 py-0.5 rounded text-sm font-medium', color.bg, color.text)}>
                            {choice.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 ml-auto text-primary" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
