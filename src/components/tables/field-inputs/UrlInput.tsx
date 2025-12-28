'use client';

import { ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Field } from '@/types/tables';

interface UrlInputProps {
  field: Field;
  value: string;
  onChange: (value: string) => void;
}

export function UrlInput({ field, value, onChange }: UrlInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.name}
        {field.required && <span className="text-primary ml-1">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com"
          className="flex-1"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => window.open(value, '_blank')}
            className="shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
