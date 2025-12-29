'use client';

import type { Field, RowHeight } from '@/types/tables';
import { InlineTextEditor } from './InlineTextEditor';
import { InlineNumberEditor } from './InlineNumberEditor';
import { InlineBooleanEditor } from './InlineBooleanEditor';
import { InlineDateEditor } from './InlineDateEditor';
import { InlineUrlEditor } from './InlineUrlEditor';
import { InlineLongTextEditor } from './InlineLongTextEditor';
import { InlineSelectEditor } from './InlineSelectEditor';
import { InlineImageEditor } from './InlineImageEditor';

interface InlineEditorProps {
  field: Field;
  value: unknown;
  onSave: (value: unknown) => void;
  onCancel: () => void;
  rowHeight?: RowHeight;
}

export function InlineEditor({ field, value, onSave, onCancel, rowHeight }: InlineEditorProps) {
  switch (field.type) {
    case 'text':
      return (
        <InlineTextEditor
          value={value as string | null}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'number':
      return (
        <InlineNumberEditor
          value={value as number | null}
          onSave={onSave}
          onCancel={onCancel}
          field={field}
        />
      );

    case 'boolean':
      return (
        <InlineBooleanEditor
          value={value as boolean}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'date':
      return (
        <InlineDateEditor
          value={value as string | null}
          onSave={onSave}
          onCancel={onCancel}
          field={field}
        />
      );

    case 'url':
      return (
        <InlineUrlEditor
          value={value as string | null}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    case 'longText':
      return (
        <InlineLongTextEditor
          value={value as string | null}
          onSave={onSave}
          onCancel={onCancel}
          rowHeight={rowHeight}
        />
      );

    case 'select':
      return (
        <InlineSelectEditor
          value={value as string | string[] | null}
          onSave={onSave}
          onCancel={onCancel}
          field={field}
        />
      );

    case 'image':
      return (
        <InlineImageEditor
          value={value as string | null}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

    default:
      return (
        <InlineTextEditor
          value={value as string | null}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
  }
}
