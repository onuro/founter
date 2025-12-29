'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { Field, DateFieldOptions } from '@/types/tables';

interface InlineDateEditorProps {
  value: string | null;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  field: Field;
}

export function InlineDateEditor({ value, onSave, onCancel, field }: InlineDateEditorProps) {
  const options = field.options as DateFieldOptions | null;
  const includeTime = options?.includeTime ?? false;

  // Convert ISO string to input format
  const formatForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (includeTime) {
        return date.toISOString().slice(0, 16);
      }
      return date.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const [localValue, setLocalValue] = useState(formatForInput(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const saveValue = () => {
    if (!localValue) {
      onSave(null);
    } else {
      const date = new Date(localValue);
      onSave(date.toISOString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveValue();
      onCancel(); // Close after save
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    saveValue();
    onCancel(); // Close after save
  };

  return (
    <Input
      ref={inputRef}
      type={includeTime ? 'datetime-local' : 'date'}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="h-6 px-1 py-0 text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
    />
  );
}
