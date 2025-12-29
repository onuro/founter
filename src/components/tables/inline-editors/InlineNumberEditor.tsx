'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { Field, NumberFieldOptions } from '@/types/tables';

interface InlineNumberEditorProps {
  value: number | null;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  field: Field;
}

export function InlineNumberEditor({ value, onSave, onCancel, field }: InlineNumberEditorProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const options = field.options as NumberFieldOptions | null;
  const precision = options?.precision ?? 0;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const saveValue = () => {
    if (localValue === '') {
      onSave(null);
    } else {
      const num = precision > 0 ? parseFloat(localValue) : parseInt(localValue, 10);
      if (!isNaN(num)) {
        onSave(num);
      } else {
        onSave(value); // Keep original if invalid
      }
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
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      step={precision > 0 ? Math.pow(10, -precision) : 1}
      className="h-6 px-1 py-0 text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
    />
  );
}
