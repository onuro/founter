'use client';

import { memo, useState } from 'react';
import { Check, ExternalLink, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Field, FieldType, Row, SelectFieldOptions, SelectChoice } from '@/types/tables';
import { TAG_COLORS, TAG_BORING_STYLE } from '@/types/tables';
import { Lightbox } from '@/components/ui/lightbox';

interface CardItemProps {
  row: Row;
  fields: Field[];
  titleFieldId?: string;
  onClick: () => void;
  isSelected?: boolean;
  className?: string;
}

function getTagColor(colorName: string) {
  return TAG_COLORS.find((c) => c.name === colorName) || TAG_COLORS[0];
}

function CardFieldValue({
  field,
  value,
}: {
  field: Field;
  value: unknown;
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
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
        <div className="flex items-center gap-1 truncate">
          <span className="truncate text-amber-200">{urlStr}</span>
          <button
            type="button"
            className="p-0.5 hover:bg-neutral-800 rounded shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              window.open(urlStr, '_blank');
            }}
          >
            <ExternalLink className="w-3 h-3 text-amber-200" />
          </button>
        </div>
      );

    case 'select':
      const options = field.options as SelectFieldOptions | null;
      const choices = options?.choices || [];
      const boringMode = options?.boringMode ?? false;
      const valueArray = Array.isArray(value) ? value : [value];
      return (
        <div className="flex gap-1 flex-wrap">
          {valueArray.slice(0, 3).map((v, idx) => {
            const choice = choices.find((c: SelectChoice) => c.id === v || c.label === v);
            if (!choice) {
              return (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 shrink-0"
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
                  'inline-flex items-center px-1.5 py-0.5 rounded text-xs shrink-0',
                  color.bg,
                  color.text
                )}
              >
                {choice.label}
              </span>
            );
          })}
          {valueArray.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{valueArray.length - 3}
            </span>
          )}
        </div>
      );

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
        <span className="text-sm line-clamp-2 whitespace-pre-wrap" title={text}>
          {text}
        </span>
      );

    case 'image':
      const imgUrl = String(value);
      if (!imgUrl) return null;
      return (
        <>
          <div
            className="w-full h-24 rounded overflow-hidden bg-neutral-800 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
          >
            <img
              src={imgUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <Lightbox
            image={{ src: imgUrl }}
            open={isLightboxOpen}
            onOpenChange={setIsLightboxOpen}
            showTitle={false}
            showFooter={false}
          />
        </>
      );

    default:
      return <span className="truncate">{String(value)}</span>;
  }
}

export const CardItem = memo(function CardItem({
  row,
  fields,
  titleFieldId,
  onClick,
  isSelected = false,
  className,
}: CardItemProps) {
  // Find title field - use specified titleFieldId, or first text/longText field
  const titleField = titleFieldId
    ? fields.find((f) => f.id === titleFieldId)
    : fields.find((f) => f.type === 'text' || f.type === 'longText') || fields[0];

  const titleValue = titleField ? row.values[titleField.id] : null;

  // Find image field for card cover
  const imageField = fields.find((f) => f.type === 'image');
  const imageValue = imageField ? row.values[imageField.id] : null;
  const hasImage = typeof imageValue === 'string' && imageValue.length > 0;

  // Other fields to display (exclude title and image fields)
  const displayFields = fields.filter(
    (f) => f.id !== titleField?.id && f.id !== imageField?.id
  ).slice(0, 4); // Show max 4 additional fields

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface border border-border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg',
        isSelected && 'ring-2 ring-primary',
        className
      )}
    >
      {/* Card cover image */}
      {hasImage && (
        <div className="w-full h-32 bg-neutral-900 overflow-hidden">
          <img
            src={imageValue as string}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Card content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <h3 className="font-medium text-sm truncate">
          {titleValue ? String(titleValue) : <span className="text-muted-foreground">Untitled</span>}
        </h3>

        {/* Other fields */}
        {displayFields.length > 0 && (
          <div className="space-y-1.5">
            {displayFields.map((field) => {
              const value = row.values[field.id];
              if (value === null || value === undefined || value === '') return null;
              return (
                <div key={field.id} className="flex items-start gap-2 text-xs">
                  <span className="text-muted-foreground shrink-0 w-20 truncate">
                    {field.name}:
                  </span>
                  <div className="flex-1 min-w-0">
                    <CardFieldValue field={field} value={value} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state placeholder if no image */}
        {!hasImage && !titleValue && displayFields.length === 0 && (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <ImageIcon className="w-8 h-8 opacity-30" />
          </div>
        )}
      </div>
    </div>
  );
});
