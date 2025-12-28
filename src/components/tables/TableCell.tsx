'use client';

import { memo, useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Field, FieldType, SelectFieldOptions, SelectChoice, RowHeight } from '@/types/tables';
import { TAG_COLORS, TAG_BORING_STYLE, ROW_HEIGHT_CONFIG } from '@/types/tables';
import { Lightbox } from '@/components/ui/lightbox';

interface TableCellProps {
  field: Field;
  value: unknown;
  rowHeight?: RowHeight;
  className?: string;
}

function getTagColor(colorName: string) {
  return TAG_COLORS.find((c) => c.name === colorName) || TAG_COLORS[0];
}

function renderSelectValue(
  value: unknown,
  options: SelectFieldOptions | null,
  rowHeight: RowHeight = 'small'
): React.ReactNode {
  if (!value) return null;

  const choices = options?.choices || [];
  const boringMode = options?.boringMode ?? false;
  const valueArray = Array.isArray(value) ? value : [value];
  const config = ROW_HEIGHT_CONFIG[rowHeight];

  return (
    <div
      className={cn(
        'flex gap-1 overflow-hidden',
        rowHeight === 'small' && 'flex-nowrap',
        rowHeight !== 'small' && 'flex-wrap content-start'
      )}
      style={{ maxHeight: config.selectMaxHeight }}
    >
      {valueArray.map((v, idx) => {
        const choice = choices.find((c: SelectChoice) => c.id === v || c.label === v);

        // Handle orphan values with warning style
        if (!choice) {
          return (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 shrink-0"
              title="Invalid value - edit row to remove"
            >
              {String(v)}
            </span>
          );
        }

        const color = boringMode ? TAG_BORING_STYLE : getTagColor(choice.color);
        return (
          <span
            key={idx}
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-sm font-medium shrink-0',
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

interface ImageCellProps {
  src: string;
}

const ImageCell = memo(function ImageCell({ src }: ImageCellProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <div
        data-lightbox-trigger
        className="w-8 h-8 rounded overflow-hidden bg-neutral-800 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      <Lightbox
        image={{ src }}
        open={isLightboxOpen}
        onOpenChange={setIsLightboxOpen}
        showTitle={false}
        showFooter={false}
      />
    </>
  );
});

function renderCellValue(
  field: Field,
  value: unknown,
  rowHeight: RowHeight = 'small'
): React.ReactNode {
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
      return renderSelectValue(value, field.options as SelectFieldOptions | null, rowHeight);

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
      // Show more lines in medium/large row heights
      if (rowHeight === 'large') {
        return (
          <span className="text-sm line-clamp-4 whitespace-pre-wrap" title={text}>
            {text}
          </span>
        );
      }
      if (rowHeight === 'medium') {
        return (
          <span className="text-sm line-clamp-2 whitespace-pre-wrap" title={text}>
            {text}
          </span>
        );
      }
      // Small: single line truncate
      return (
        <span className="truncate text-sm" title={text}>
          {text}
        </span>
      );

    case 'image':
      const imgUrl = String(value);
      return imgUrl ? <ImageCell src={imgUrl} /> : null;

    default:
      return <span className="truncate">{String(value)}</span>;
  }
}

export const TableCell = memo(
  function TableCell({ field, value, rowHeight = 'small', className }: TableCellProps) {
    const config = ROW_HEIGHT_CONFIG[rowHeight];

    return (
      <div
        className={cn(
          'flex px-3 py-2.5 text-sm overflow-hidden',
          // Field-type-specific alignment
          field.type === 'select' && rowHeight !== 'small' ? 'items-start pt-1.5' : 'items-start',
          className
        )}
        style={{ height: config.height }}
      >
        {renderCellValue(field, value, rowHeight)}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for optimal memoization
    return (
      prevProps.field.id === nextProps.field.id &&
      prevProps.field.type === nextProps.field.type &&
      prevProps.field.width === nextProps.field.width &&
      prevProps.field.options === nextProps.field.options &&
      prevProps.value === nextProps.value &&
      prevProps.rowHeight === nextProps.rowHeight &&
      prevProps.className === nextProps.className
    );
  }
);
