'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SitePreset, CrawlOptions } from '@/types/preset';
import { DEFAULT_SCROLL_OPTIONS } from '@/types/crawl';
import { Loader2 } from 'lucide-react';

const DEFAULT_CRAWL_OPTIONS: CrawlOptions = {
  scroll: DEFAULT_SCROLL_OPTIONS,
};

interface PresetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: SitePreset | null;
  onSubmit: (data: { label: string; url: string; crawlOptions: CrawlOptions }) => Promise<void>;
}

export function PresetFormDialog({
  open,
  onOpenChange,
  preset,
  onSubmit,
}: PresetFormDialogProps) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [crawlOptions, setCrawlOptions] = useState<CrawlOptions>(DEFAULT_CRAWL_OPTIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (preset) {
        setLabel(preset.label);
        setUrl(preset.url);
        setCrawlOptions(preset.crawlOptions);
      } else {
        setLabel('');
        setUrl('');
        setCrawlOptions(DEFAULT_CRAWL_OPTIONS);
      }
      setError(null);
    }
  }, [open, preset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!label.trim()) {
      setError('Label is required');
      return;
    }
    if (!url.trim()) {
      setError('URL is required');
      return;
    }
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ label: label.trim(), url: url.trim(), crawlOptions });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScrollCountChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      setCrawlOptions({
        ...crawlOptions,
        scroll: { ...crawlOptions.scroll, scrollCount: num },
      });
    }
  };

  const handleScrollDelayChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 100 && num <= 2000) {
      setCrawlOptions({
        ...crawlOptions,
        scroll: { ...crawlOptions.scroll, scrollDelay: num },
      });
    }
  };

  const isEditing = preset !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Preset' : 'Add New Preset'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your saved site configuration'
              : 'Save a site configuration for quick access'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Label</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Dribbble with 10 scrolls"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Enable page scrolling</label>
                <p className="text-xs text-muted-foreground">
                  Scroll the page to load lazy-loaded images
                </p>
              </div>
              <Switch
                checked={crawlOptions.scroll.enabled}
                onCheckedChange={(checked) =>
                  setCrawlOptions({
                    ...crawlOptions,
                    scroll: { ...crawlOptions.scroll, enabled: checked },
                  })
                }
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scroll count (1-10)</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={crawlOptions.scroll.scrollCount}
                onChange={(e) => handleScrollCountChange(e.target.value)}
                disabled={!crawlOptions.scroll.enabled || isSubmitting}
                className="w-24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scroll delay (100-2000ms)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={100}
                  max={2000}
                  step={100}
                  value={crawlOptions.scroll.scrollDelay}
                  onChange={(e) => handleScrollDelayChange(e.target.value)}
                  disabled={!crawlOptions.scroll.enabled || isSubmitting}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">ms</span>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Preset'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
