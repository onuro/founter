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
import { Label } from '@/components/ui/label';
import { SitePreset, CrawlOptions } from '@/types/preset';
import { DEFAULT_SCROLL_OPTIONS } from '@/types/crawl';
import { Loader2, ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { isValidCookieFormat, parseCookieString, getCookieSummary } from '@/lib/cookies';
import {
  COLUMN_OPTIONS,
  GAP_OPTIONS,
  ASPECT_RATIO_OPTIONS,
  DEFAULT_COLUMNS,
  DEFAULT_GAP,
  DEFAULT_ASPECT_RATIO,
} from '@/lib/grid-options';

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
  const [showCookies, setShowCookies] = useState(false);
  const [showGridOptions, setShowGridOptions] = useState(false);

  useEffect(() => {
    if (open) {
      if (preset) {
        setLabel(preset.label);
        setUrl(preset.url);
        setCrawlOptions(preset.crawlOptions);
        setShowCookies(!!preset.crawlOptions.cookies);
        setShowGridOptions(!!preset.crawlOptions.gridOptions);
      } else {
        setLabel('');
        setUrl('');
        setCrawlOptions(DEFAULT_CRAWL_OPTIONS);
        setShowCookies(false);
        setShowGridOptions(false);
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

    // Validate cookies format if provided
    if (crawlOptions.cookies && !isValidCookieFormat(crawlOptions.cookies)) {
      setError('Invalid cookie format. Please paste cookies from browser DevTools.');
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
    if (!isNaN(num) && num >= 1 && num <= 100) {
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
      <DialogContent className="sm:max-w-md max-h-[85vh] pb-0 flex flex-col overflow-clip overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Preset' : 'Add New Preset'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your saved site configuration'
              : 'Save a site configuration for quick access'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1  space-y-4 py-2 space-y-6">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Dribbble with 10 scrolls"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4 pt-2 border-t pt-8">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable page scrolling</Label>
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
              <div className="flex gap-12 py-4 pt-6">
                <div className="space-y-2">
                  <Label>Scroll count (1-100)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={crawlOptions.scroll.scrollCount}
                    onChange={(e) => handleScrollCountChange(e.target.value)}
                    disabled={!crawlOptions.scroll.enabled || isSubmitting}
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scroll delay (100-2000ms)</Label>
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
              <div className="space-y-2">
                <Label>Load more selector</Label>
                <Input
                  value={crawlOptions.loadMoreSelector || ''}
                  onChange={(e) =>
                    setCrawlOptions({
                      ...crawlOptions,
                      loadMoreSelector: e.target.value || undefined,
                    })
                  }
                  placeholder="e.g., button.load-more, [data-load-more]"
                  disabled={!crawlOptions.scroll.enabled || isSubmitting}
                  className="text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  CSS selector for &quot;Load more&quot; button (for sites like Dribbble)
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowCookies(!showCookies)}
                className="flex items-center justify-between w-full text-left"
                disabled={isSubmitting}
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-medium">Authentication (Cookies)</span>
                  <p className="text-xs text-muted-foreground">
                    {crawlOptions.cookies
                      ? getCookieSummary(parseCookieString(crawlOptions.cookies))
                      : 'Add cookies for authenticated access'}
                  </p>
                </div>
                {showCookies ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showCookies && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Paste cookies from Chrome DevTools → Application → Cookies → select all rows → Copy
                  </p>
                  <textarea
                    value={crawlOptions.cookies || ''}
                    onChange={(e) =>
                      setCrawlOptions({
                        ...crawlOptions,
                        cookies: e.target.value || undefined,
                      })
                    }
                    placeholder="_dribbble_session&#9;abc123...&#9;dribbble.com&#9;/&#9;Session..."
                    disabled={isSubmitting}
                    className="w-full h-24 px-3 py-2 text-xs border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowGridOptions(!showGridOptions)}
                className="flex items-center justify-between w-full text-left"
                disabled={isSubmitting}
              >
                <div className="space-y-0.5">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Grid Display
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {crawlOptions.gridOptions
                      ? `${crawlOptions.gridOptions.columns} cols, ${crawlOptions.gridOptions.aspectRatio.replace('/', ':')} ratio`
                      : 'Save preferred grid layout for this preset'}
                  </p>
                </div>
                {showGridOptions ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {showGridOptions && (
                <div className="bg-secondary p-4 rounded-md">
                  <div className="space-y-2">
                    <Label className="text-xs">Columns</Label>
                    <div className="flex flex-wrap gap-1">
                      {COLUMN_OPTIONS.map((col) => (
                        <Button
                          key={col}
                          type="button"
                          variant={crawlOptions.gridOptions?.columns === col ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-8 cursor-pointer"
                          onClick={() =>
                            setCrawlOptions({
                              ...crawlOptions,
                              gridOptions: {
                                columns: col,
                                gap: crawlOptions.gridOptions?.gap || DEFAULT_GAP,
                                aspectRatio: crawlOptions.gridOptions?.aspectRatio || DEFAULT_ASPECT_RATIO,
                              },
                            })
                          }
                          disabled={isSubmitting}
                        >
                          {col}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Gap</Label>
                    <div className="flex flex-wrap gap-1">
                      {GAP_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={crawlOptions.gridOptions?.gap === option.value ? 'default' : 'outline'}
                          size="sm"
                          className="w-9 h-8 cursor-pointer"
                          onClick={() =>
                            setCrawlOptions({
                              ...crawlOptions,
                              gridOptions: {
                                columns: crawlOptions.gridOptions?.columns || DEFAULT_COLUMNS,
                                gap: option.value,
                                aspectRatio: crawlOptions.gridOptions?.aspectRatio || DEFAULT_ASPECT_RATIO,
                              },
                            })
                          }
                          disabled={isSubmitting}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Aspect Ratio</Label>
                    <div className="grid grid-cols-4 gap-1">
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={crawlOptions.gridOptions?.aspectRatio === option.value ? 'default' : 'outline'}
                          size="sm"
                          className="h-8 text-xs cursor-pointer"
                          onClick={() =>
                            setCrawlOptions({
                              ...crawlOptions,
                              gridOptions: {
                                columns: crawlOptions.gridOptions?.columns || DEFAULT_COLUMNS,
                                gap: crawlOptions.gridOptions?.gap || DEFAULT_GAP,
                                aspectRatio: option.value,
                              },
                            })
                          }
                          disabled={isSubmitting}
                          title={option.description}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {crawlOptions.gridOptions && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground cursor-pointer"
                      onClick={() =>
                        setCrawlOptions({
                          ...crawlOptions,
                          gridOptions: undefined,
                        })
                      }
                      disabled={isSubmitting}
                    >
                      Clear grid settings
                    </Button>
                  )}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="sticky bottom-0 py-4 border-t mt-4 bg-surface">
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
