'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Field, NumberFieldOptions } from '@/types/tables';

interface NumberInputProps {
  field: Field;
  value: number | null;
  onChange: (value: number | null) => void;
}

export function NumberInput({ field, value, onChange }: NumberInputProps) {
  const options = field.options as NumberFieldOptions | null;
  const precision = options?.precision ?? 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(null);
    } else {
      const num = precision > 0 ? parseFloat(val) : parseInt(val, 10);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>
      <Input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        step={precision > 0 ? Math.pow(10, -precision) : 1}
        placeholder={`Enter ${field.name.toLowerCase()}`}
        className="bg-secondary font-mono"
      />
    </div>
  );
}
