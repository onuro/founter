'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Field } from '@/types/tables';

interface BooleanInputProps {
  field: Field;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function BooleanInput({ field, value, onChange }: BooleanInputProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>
      <Switch
        checked={value || false}
        onCheckedChange={onChange}
      />
    </div>
  );
}
