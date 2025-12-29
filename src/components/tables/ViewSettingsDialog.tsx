'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Rows2, Rows3, Rows4, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Field, RowHeight } from '@/types/tables';
import type { TableView, ViewSettings } from '@/types/views';

interface ViewSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: TableView | null;
  fields: Field[];
  onSave: (viewId: string, settings: Partial<ViewSettings>) => Promise<void>;
}

const ROW_HEIGHT_OPTIONS: { value: RowHeight; label: string; icon: React.ReactNode }[] = [
  { value: 'small', label: 'Small', icon: <Rows2 className="w-4 h-4" /> },
  { value: 'medium', label: 'Medium', icon: <Rows3 className="w-4 h-4" /> },
  { value: 'large', label: 'Large', icon: <Rows4 className="w-4 h-4" /> },
];

const COLUMN_OPTIONS = [
  { value: 2, label: '2 columns' },
  { value: 3, label: '3 columns' },
  { value: 4, label: '4 columns' },
  { value: 5, label: '5 columns' },
] as const;

export function ViewSettingsDialog({
  open,
  onOpenChange,
  view,
  fields,
  onSave,
}: ViewSettingsDialogProps) {
  const [settings, setSettings] = useState<Partial<ViewSettings>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset settings when view changes
  useEffect(() => {
    if (view) {
      setSettings({
        rowHeight: view.settings.rowHeight,
        cardTitleFieldId: view.settings.cardTitleFieldId,
        cardColumns: view.settings.cardColumns,
      });
    }
  }, [view]);

  const handleSave = async () => {
    if (!view) return;
    setIsLoading(true);
    try {
      await onSave(view.id, settings);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const isCardView = view?.type === 'card';

  // Get text/longText fields for title selection
  const titleFieldOptions = fields.filter(
    (f) => f.type === 'text' || f.type === 'longText'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCardView ? (
              <LayoutGrid className="w-5 h-5" />
            ) : (
              <Table2 className="w-5 h-5" />
            )}
            View settings
          </DialogTitle>
          <DialogDescription>
            Configure how data is displayed in &quot;{view?.name}&quot; view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Row Height - for Grid view */}
          {!isCardView && (
            <div className="space-y-2">
              <Label>Row height</Label>
              <div className="flex gap-2">
                {ROW_HEIGHT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({ ...prev, rowHeight: option.value }))
                    }
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                      settings.rowHeight === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {option.icon}
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card-specific settings */}
          {isCardView && (
            <>
              {/* Title field */}
              <div className="space-y-2">
                <Label htmlFor="title-field">Card title field</Label>
                <Select
                  value={settings.cardTitleFieldId || 'auto'}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      cardTitleFieldId: value === 'auto' ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger id="title-field">
                    <SelectValue placeholder="Auto-detect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect (first text field)</SelectItem>
                    {titleFieldOptions.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This field will be displayed as the card title.
                </p>
              </div>

              {/* Number of columns */}
              <div className="space-y-2">
                <Label>Number of columns</Label>
                <div className="flex gap-2">
                  {COLUMN_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({ ...prev, cardColumns: option.value }))
                      }
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                        settings.cardColumns === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-lg font-medium">{option.value}</span>
                      <span className="text-xs text-muted-foreground">cols</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
