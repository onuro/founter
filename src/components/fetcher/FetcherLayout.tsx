'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { ContentHeader } from '@/components/shared/ContentHeader';
import { URLInput } from './URLInput';
import { ImageGrid } from './ImageGrid';
import { CrawlOptionsSheet } from './CrawlOptionsSheet';
import { PresetsSheet } from './PresetsSheet';
import { SaveFetchDialog } from './SaveFetchDialog';
import { SavedFetchesSheet } from './SavedFetchesSheet';
import { useCrawl } from '@/hooks/useCrawl';
import { useHistory } from '@/hooks/useHistory';
import { usePresets } from '@/hooks/usePresets';
import { useImageFetcherSaved } from '@/hooks/useImageFetcherSaved';
import { HistorySheet } from '@/components/ui/history-sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, History, Settings, ImageIcon, FileText, ArrowDownToDot } from 'lucide-react';
import { ScrollOptions, DEFAULT_SCROLL_OPTIONS, CrawlPhase } from '@/types/crawl';
import { toast } from 'sonner';
import type { SitePreset, GridOptions } from '@/types/preset';
import { Card } from '../ui/card';

// Format seconds to "Xm Ys" or "Xs"
function formatElapsedTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Phase messages for live status updates
const phaseMessages: Record<CrawlPhase, string> = {
  submitting: 'Submitting crawl job...',
  loading: 'Loading page content...',
  scrolling: 'Scrolling page & loading images...',
  extracting: 'Extracting images...',
  complete: 'Complete!',
};

export function FetcherLayout() {
  const { images, isLoading, error, crawledUrl, scrollUsed, elapsedSeconds, phase, crawlUrl, clearResults, loadImages } = useCrawl();
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
    reorderPresets,
    refetch: refetchPresets,
  } = usePresets('IMAGE', { immediate: false }); // Defer fetch until sheet opens
  const {
    saved,
    isLoading: savedLoading,
    saveProgress,
    save: saveImages,
    remove: removeSaved,
    getSavedWithImages,
    refetch: refetchSaved,
  } = useImageFetcherSaved({ immediate: false });

  const [historyOpen, setHistoryOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Lazy mount tracking - sheets only mount after first open
  const [hasOpenedHistory, setHasOpenedHistory] = useState(false);
  const [hasOpenedOptions, setHasOpenedOptions] = useState(false);
  const [hasOpenedPresets, setHasOpenedPresets] = useState(false);
  const [hasOpenedSaved, setHasOpenedSaved] = useState(false);
  const [scrollOptions, setScrollOptions] = useState<ScrollOptions>(DEFAULT_SCROLL_OPTIONS);
  const [activeCookies, setActiveCookies] = useState<string | undefined>(undefined);
  const [activeLoadMoreSelector, setActiveLoadMoreSelector] = useState<string | undefined>(undefined);
  const [activeGridOptions, setActiveGridOptions] = useState<GridOptions | undefined>(undefined);
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
    setActiveGridOptions(preset.crawlOptions.gridOptions);
    const hasCookies = !!preset.crawlOptions.cookies;
    const hasGridOptions = !!preset.crawlOptions.gridOptions;
    toast.info(`Loaded preset: ${preset.label}${hasCookies ? ' (with auth)' : ''}${hasGridOptions ? ' (with grid settings)' : ''}`);
  }, []);

  const handleClearResults = useCallback(() => {
    setInputUrl('');
    setActiveCookies(undefined);
    setActiveLoadMoreSelector(undefined);
    setActiveGridOptions(undefined);
    clearResults();
  }, [clearResults]);

  // Memoize sheet toggle callbacks with startTransition for better INP
  const openHistory = useCallback(() => {
    setHasOpenedHistory(true);
    startTransition(() => setHistoryOpen(true));
  }, []);
  const openOptions = useCallback(() => {
    setHasOpenedOptions(true);
    startTransition(() => setOptionsOpen(true));
  }, []);
  const openPresets = useCallback(() => {
    setHasOpenedPresets(true);
    refetchPresets(); // Fetch presets when sheet opens
    startTransition(() => setPresetsOpen(true));
  }, [refetchPresets]);

  const openSaved = useCallback(() => {
    setHasOpenedSaved(true);
    refetchSaved();
    startTransition(() => setSavedOpen(true));
  }, [refetchSaved]);

  const openSaveDialog = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const handleSave = useCallback(async (label: string) => {
    if (!crawledUrl) return;
    await saveImages(label, crawledUrl, images, { scroll: scrollOptions });
    toast.success('Images saved successfully');
  }, [crawledUrl, images, scrollOptions, saveImages]);

  const handleSavedSelect = useCallback(async (item: { id: string }) => {
    const savedWithImages = await getSavedWithImages(item.id);
    // Convert saved images format to ExtractedImage format
    const extractedImages = savedWithImages.images.map((img) => ({
      src: img.localPath,
      alt: img.alt ?? undefined,
      width: img.width ?? undefined,
      link: img.link ?? undefined,
    }));
    // Load images into the view
    loadImages(extractedImages, savedWithImages.url);
    setInputUrl(savedWithImages.url);
    toast.success(`Loaded ${extractedImages.length} images from "${savedWithImages.label}"`);
  }, [getSavedWithImages, loadImages]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ContentHeader title="Fetcher" />

      <main className="mx-auto px-6 pl-2">
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
                onClick={openSaved}
                title="Saved fetches"
                className="cursor-pointer"
              >
                <ArrowDownToDot className="w-4 h-4" />
              </Button>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0 gap-0 mt-1">
          <Card className='rounded-none mb-0'>
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
              <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 space-y-3">
                <p className="text-sm text-destructive font-medium">{error.message}</p>
                {error.type === 'timeout' && error.suggestions && error.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">What you can try:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {error.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground/60">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{phaseMessages[phase]}</span>
                </div>
                <span className="text-sm text-muted-foreground/60">
                  Elapsed: {formatElapsedTime(elapsedSeconds)}
                </span>
              </div>
            )}

            {/* Results */}
            {!isLoading && images.length > 0 && (
              <ImageGrid images={images} crawledUrl={crawledUrl} gridOptions={activeGridOptions} onSave={openSaveDialog} />
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

      {/* Lazy mount sheets - only render after first open */}
      {hasOpenedHistory && (
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
      )}

      {hasOpenedOptions && (
        <CrawlOptionsSheet
          open={optionsOpen}
          onOpenChange={setOptionsOpen}
          options={scrollOptions}
          onOptionsChange={setScrollOptions}
        />
      )}

      {hasOpenedPresets && (
        <PresetsSheet
          open={presetsOpen}
          onOpenChange={setPresetsOpen}
          presets={presets}
          isLoading={presetsLoading}
          onPresetSelect={handlePresetSelect}
          onPresetCreate={createPreset}
          onPresetUpdate={updatePreset}
          onPresetDelete={deletePreset}
          onPresetReorder={reorderPresets}
        />
      )}

      {hasOpenedSaved && (
        <SavedFetchesSheet
          open={savedOpen}
          onOpenChange={setSavedOpen}
          saved={saved}
          isLoading={savedLoading}
          onSelect={handleSavedSelect}
          onDelete={removeSaved}
        />
      )}

      <SaveFetchDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        imageCount={images.length}
        url={crawledUrl || ''}
        onSave={handleSave}
        saveProgress={saveProgress}
      />
    </div>
  );
}
