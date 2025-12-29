'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface InlineUrlEditorProps {
  value: string | null;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export function InlineUrlEditor({ value, onSave, onCancel }: InlineUrlEditorProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(localValue);
      onCancel(); // Close after save
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleBlur = () => {
    onSave(localValue);
    onCancel(); // Close after save
  };

  return (
    <Input
      ref={inputRef}
      type="url"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder="https://example.com"
      className="h-6 px-1 py-0 text-sm bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-amber-200"
    />
  );
}
