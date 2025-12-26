'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Field, DateFieldOptions } from '@/types/tables';

interface DateInputProps {
  field: Field;
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DateInput({ field, value, onChange }: DateInputProps) {
  const options = field.options as DateFieldOptions | null;
  const includeTime = options?.includeTime ?? false;

  // Convert ISO string to input format
  const inputValue = value
    ? includeTime
      ? value.slice(0, 16) // datetime-local format: YYYY-MM-DDTHH:mm
      : value.slice(0, 10) // date format: YYYY-MM-DD
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      onChange(null);
    } else {
      // Convert to ISO string
      const date = new Date(val);
      onChange(date.toISOString());
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>
      <Input
        type={includeTime ? 'datetime-local' : 'date'}
        value={inputValue}
        onChange={handleChange}
        className="bg-secondary"
      />
    </div>
  );
}
