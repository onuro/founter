'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus, Bookmark, Loader2 } from 'lucide-react';
import { SitePreset, CrawlOptions } from '@/types/preset';
import { PresetListItem } from './PresetListItem';
import { PresetFormDialog } from './PresetFormDialog';

interface PresetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: SitePreset[];
  isLoading: boolean;
  onPresetSelect: (preset: SitePreset) => void;
  onPresetCreate: (data: { label: string; url: string; crawlOptions: CrawlOptions }) => Promise<SitePreset>;
  onPresetUpdate: (preset: SitePreset) => Promise<SitePreset>;
  onPresetDelete: (id: string) => Promise<void>;
}

export function PresetsSheet({
  open,
  onOpenChange,
  presets,
  isLoading,
  onPresetSelect,
  onPresetCreate,
  onPresetUpdate,
  onPresetDelete,
}: PresetsSheetProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SitePreset | null>(null);

  const handleSelect = (preset: SitePreset) => {
    onPresetSelect(preset);
    onOpenChange(false);
  };

  const handleEdit = (preset: SitePreset) => {
    setEditingPreset(preset);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPreset(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (data: { label: string; url: string; crawlOptions: CrawlOptions }) => {
    if (editingPreset) {
      await onPresetUpdate({ ...editingPreset, ...data });
    } else {
      await onPresetCreate(data);
    }
    setFormOpen(false);
    setEditingPreset(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between pr-6">
              <span>Site Presets</span>
              {presets.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {presets.length} preset{presets.length !== 1 ? 's' : ''}
                </span>
              )}
            </SheetTitle>
            <SheetDescription>
              Save and quickly load your favorite site configurations
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : presets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                <Bookmark className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No presets saved yet</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {presets.map((preset) => (
                  <PresetListItem
                    key={preset.id}
                    preset={preset}
                    onSelect={() => handleSelect(preset)}
                    onEdit={() => handleEdit(preset)}
                    onDelete={() => onPresetDelete(preset.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <SheetFooter>
            <Button onClick={handleCreate} className="w-full cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Add New Preset
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PresetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        preset={editingPreset}
        onSubmit={handleFormSubmit}
      />
    </>
  );
}
