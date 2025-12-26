'use client';

import { Check, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Field, FieldType, SelectFieldOptions, SelectChoice } from '@/types/tables';
import { TAG_COLORS } from '@/types/tables';

interface TableCellProps {
  field: Field;
  value: unknown;
  className?: string;
}

function getTagColor(colorName: string) {
  return TAG_COLORS.find((c) => c.name === colorName) || TAG_COLORS[0];
}

function renderSelectValue(
  value: unknown,
  options: SelectFieldOptions | null
): React.ReactNode {
  if (!value) return null;

  const choices = options?.choices || [];
  const valueArray = Array.isArray(value) ? value : [value];

  return (
    <div className="flex flex-wrap gap-1">
      {valueArray.map((v, idx) => {
        const choice = choices.find((c: SelectChoice) => c.id === v || c.label === v);

        // Handle orphan values with warning style
        if (!choice) {
          return (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30"
              title="Invalid value - edit row to remove"
            >
              {String(v)}
            </span>
          );
        }

        const color = getTagColor(choice.color);
        return (
          <span
            key={idx}
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              color.bg,
              color.text
            )}
          >
            {choice.label}
          </span>
        );
      })}
    </div>
  );
}

function renderCellValue(field: Field, value: unknown): React.ReactNode {
  const type = field.type as FieldType;

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground/50">-</span>;
  }

  switch (type) {
    case 'text':
      return <span className="truncate">{String(value)}</span>;

    case 'number':
      return <span className="font-mono">{String(value)}</span>;

    case 'url':
      const urlStr = String(value);
      return (
        <a
          href={urlStr}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate">{urlStr}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      );

    case 'select':
      return renderSelectValue(value, field.options as SelectFieldOptions | null);

    case 'date':
      try {
        const date = new Date(value as string);
        return (
          <span className="text-sm">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        );
      } catch {
        return <span>{String(value)}</span>;
      }

    case 'boolean':
      return value ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/50" />
      );

    case 'longText':
      const text = String(value);
      return (
        <span className="truncate text-sm" title={text}>
          {text.length > 100 ? `${text.slice(0, 100)}...` : text}
        </span>
      );

    case 'image':
      const imgUrl = String(value);
      return imgUrl ? (
        <div className="w-8 h-8 rounded overflow-hidden bg-neutral-800">
          <img
            src={imgUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : null;

    default:
      return <span className="truncate">{String(value)}</span>;
  }
}

export function TableCell({ field, value, className }: TableCellProps) {
  return (
    <div
      className={cn(
        'flex items-center min-h-[40px] px-3 py-2 text-sm',
        className
      )}
    >
      {renderCellValue(field, value)}
    </div>
  );
}
