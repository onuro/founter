'use client';

import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/shared/Header';
import { URLInput } from './URLInput';
import { ImageGrid } from './ImageGrid';
import { useCrawl } from '@/hooks/useCrawl';
import { useHistory } from '@/hooks/useHistory';
import { HistorySheet } from '@/components/ui/history-sheet';
import { Button } from '@/components/ui/button';
import { Loader2, History } from 'lucide-react';

export function DRBFetcherLayout() {
  const { images, isLoading, error, crawledUrl, crawlUrl, clearResults } = useCrawl();
  const { items, addItem, removeItem, clearAll } = useHistory({
    key: 'drb-fetch-history',
    maxItems: 20,
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastCrawledUrl = useRef<string | null>(null);

  // Add to history when crawl succeeds
  useEffect(() => {
    if (crawledUrl && images.length > 0 && crawledUrl !== lastCrawledUrl.current) {
      // Extract domain for label
      try {
        const urlObj = new URL(crawledUrl);
        const label = urlObj.hostname + urlObj.pathname;
        addItem(crawledUrl, label, { imageCount: images.length });
      } catch {
        addItem(crawledUrl);
      }
      lastCrawledUrl.current = crawledUrl;
    }
  }, [crawledUrl, images.length, addItem]);

  const handleHistoryItemClick = (item: { url: string }) => {
    crawlUrl(item.url);
  };

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <Header />

      <main className="max-w-[1750px] mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DRB Fetcher</h1>
            <p className="text-muted-foreground mt-1">
              Extract images from any webpage using Crawl4AI
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            title="View history"
            className="cursor-pointer"
          >
            <History className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <URLInput
            onSubmit={crawlUrl}
            onClear={clearResults}
            isLoading={isLoading}
            hasResults={images.length > 0}
          />

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Crawling page and extracting images...</span>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && images.length > 0 && (
            <ImageGrid images={images} crawledUrl={crawledUrl} />
          )}

          {/* Empty State */}
          {!isLoading && !error && images.length === 0 && crawledUrl && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No images found on this page.</p>
            </div>
          )}
        </div>
      </main>

      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Fetch History"
        description="Your recent crawled URLs"
        items={items}
        onItemClick={handleHistoryItemClick}
        onItemRemove={removeItem}
        onClearAll={clearAll}
      />
    </div>
  );
}
