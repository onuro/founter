'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Field } from '@/types/tables';

interface TextInputProps {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ field, value, onChange }: TextInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${field.name.toLowerCase()}`}
        className="bg-secondary"
      />
    </div>
  );
}
