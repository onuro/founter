'use client';

import { useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface InlineBooleanEditorProps {
  value: boolean;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

export function InlineBooleanEditor({ value, onSave, onCancel }: InlineBooleanEditorProps) {
  // Immediately toggle and save on mount (single click toggles)
  useEffect(() => {
    onSave(!value);
    onCancel(); // Close after save
  }, []);

  return (
    <Checkbox
      checked={!value}
      className="pointer-events-none"
    />
  );
}
