'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollOptions } from '@/types/crawl';

interface CrawlOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: ScrollOptions;
  onOptionsChange: (options: ScrollOptions) => void;
}

export function CrawlOptionsSheet({
  open,
  onOpenChange,
  options,
  onOptionsChange,
}: CrawlOptionsSheetProps) {
  const handleScrollCountChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      onOptionsChange({ ...options, scrollCount: num });
    }
  };

  const handleScrollDelayChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 100 && num <= 2000) {
      onOptionsChange({ ...options, scrollDelay: num });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Crawl Options</SheetTitle>
          <SheetDescription>
            Configure how the crawler behaves when fetching images
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-4 space-y-6">
          {/* Scroll Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Enable page scrolling</label>
              <p className="text-xs text-muted-foreground">
                Scroll the page to load lazy-loaded images
              </p>
            </div>
            <Switch
              checked={options.enabled}
              onCheckedChange={(checked) =>
                onOptionsChange({ ...options, enabled: checked })
              }
            />
          </div>

          {/* Scroll Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scroll count</label>
            <p className="text-xs text-muted-foreground">
              Number of scroll actions (1-30)
            </p>
            <Input
              type="number"
              min={1}
              max={30}
              value={options.scrollCount}
              onChange={(e) => handleScrollCountChange(e.target.value)}
              disabled={!options.enabled}
              className="w-24"
            />
          </div>

          {/* Scroll Delay */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Scroll delay</label>
            <p className="text-xs text-muted-foreground">
              Delay between scrolls in milliseconds (100-2000)
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={100}
                max={2000}
                step={100}
                value={options.scrollDelay}
                onChange={(e) => handleScrollDelayChange(e.target.value)}
                disabled={!options.enabled}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">ms</span>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full cursor-pointer"
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
