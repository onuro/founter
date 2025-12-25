'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Header } from '@/components/shared/Header';
import { URLInput } from './URLInput';
import { ImageGrid } from './ImageGrid';
import { CrawlOptionsSheet } from './CrawlOptionsSheet';
import { PresetsSheet } from './PresetsSheet';
import { useCrawl } from '@/hooks/useCrawl';
import { useHistory } from '@/hooks/useHistory';
import { usePresets } from '@/hooks/usePresets';
import { HistorySheet } from '@/components/ui/history-sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, History, Settings, ImageIcon, FileText } from 'lucide-react';
import { ScrollOptions, DEFAULT_SCROLL_OPTIONS } from '@/types/crawl';
import { toast } from 'sonner';
import type { SitePreset } from '@/types/preset';
import { Card } from '../ui/card';

export function FetcherLayout() {
  const { images, isLoading, error, crawledUrl, scrollUsed, crawlUrl, clearResults } = useCrawl();
  const { items, addItem, removeItem, clearAll } = useHistory({
    key: 'fetcher-history',
    maxItems: 20,
  });
  const {
    presets,
    isLoading: presetsLoading,
    createPreset,
    updatePreset,
    deletePreset,
  } = usePresets('IMAGE');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [scrollOptions, setScrollOptions] = useState<ScrollOptions>(DEFAULT_SCROLL_OPTIONS);
  const [activeCookies, setActiveCookies] = useState<string | undefined>(undefined);
  const [activeLoadMoreSelector, setActiveLoadMoreSelector] = useState<string | undefined>(undefined);
  const [inputUrl, setInputUrl] = useState('');
  const lastCrawledUrl = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState('images');

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

      // Show toast with scroll info if scrolling was used
      if (scrollUsed) {
        toast.success(`Found ${images.length} images`, {
          description: `Page was scrolled ${scrollUsed.scrollCount}x with ${scrollUsed.scrollDelay}ms delay`,
        });
      }
    }
  }, [crawledUrl, images.length, addItem, scrollUsed]);

  const handleHistoryItemClick = useCallback((item: { url: string }) => {
    // History items don't have preset options - clear them
    setActiveCookies(undefined);
    setActiveLoadMoreSelector(undefined);
    crawlUrl(item.url, scrollOptions);
  }, [crawlUrl, scrollOptions]);

  const handleHistoryItemRemove = useCallback((item: { id: string }) => {
    removeItem(item.id);
  }, [removeItem]);

  const handleCrawl = useCallback((url: string) => {
    crawlUrl(url, scrollOptions, activeCookies, activeLoadMoreSelector);
  }, [crawlUrl, scrollOptions, activeCookies, activeLoadMoreSelector]);

  const handlePresetSelect = useCallback((preset: SitePreset) => {
    setInputUrl(preset.url);
    setScrollOptions(preset.crawlOptions.scroll);
    setActiveCookies(preset.crawlOptions.cookies);
    setActiveLoadMoreSelector(preset.crawlOptions.loadMoreSelector);
    const hasCookies = !!preset.crawlOptions.cookies;
    toast.info(`Loaded preset: ${preset.label}${hasCookies ? ' (with auth)' : ''}`);
  }, []);

  const handleClearResults = useCallback(() => {
    setInputUrl('');
    setActiveCookies(undefined);
    setActiveLoadMoreSelector(undefined);
    clearResults();
  }, [clearResults]);

  // Memoize sheet toggle callbacks to prevent re-renders
  const openHistory = useCallback(() => setHistoryOpen(true), []);
  const openOptions = useCallback(() => setOptionsOpen(true), []);
  const openPresets = useCallback(() => setPresetsOpen(true), []);

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <Header />

      <main className="max-w-[1750px] mx-auto px-3 py-8">
        <Card className='rounded-b-xs'>
          <div className="p-2 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fetcher</h1>
              <p className="text-muted-foreground mt-1">
                Extract images and content from any webpage
              </p>
            </div>
            <div className="flex items-center gap-1 bg-secondary p-1 rounded-md">
              <Button
                variant="secondary"
                size="icon"
                onClick={openOptions}
                title="Crawl options"
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={openHistory}
                title="View history"
                className="cursor-pointer"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 mt-1">
          <Card className='rounded-t-xs'>
            <TabsList>
              <TabsTrigger value="images" className="cursor-pointer">
                <ImageIcon className="w-4 h-4 mr-2" />
                Image Fetcher
              </TabsTrigger>
              <TabsTrigger value="content" className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Content Fetcher
              </TabsTrigger>
            </TabsList>
          </Card>
          <TabsContent value="images">
            <URLInput
              value={inputUrl}
              onChange={setInputUrl}
              onSubmit={handleCrawl}
              onClear={handleClearResults}
              onOpenPresets={openPresets}
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
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Content Fetcher</h3>
              <p className="text-sm text-center max-w-md">
                Extract text content from any webpage. Coming soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <HistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title="Fetch History"
        description="Your recent crawled URLs"
        items={items}
        onItemClick={handleHistoryItemClick}
        onItemRemove={handleHistoryItemRemove}
        onClearAll={clearAll}
      />

      <CrawlOptionsSheet
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        options={scrollOptions}
        onOptionsChange={setScrollOptions}
      />

      <PresetsSheet
        open={presetsOpen}
        onOpenChange={setPresetsOpen}
        presets={presets}
        isLoading={presetsLoading}
        onPresetSelect={handlePresetSelect}
        onPresetCreate={createPreset}
        onPresetUpdate={updatePreset}
        onPresetDelete={deletePreset}
      />
    </div>
  );
}
