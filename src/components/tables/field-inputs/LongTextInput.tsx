'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Field } from '@/types/tables';

interface LongTextInputProps {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}

export function LongTextInput({ field, value, onChange }: LongTextInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${field.name.toLowerCase()}`}
        className="bg-secondary min-h-[120px] resize-y"
      />
    </div>
  );
}
