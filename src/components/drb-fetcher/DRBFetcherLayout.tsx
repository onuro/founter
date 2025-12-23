'use client';

import { Header } from '@/components/shared/Header';
import { URLInput } from './URLInput';
import { ImageGrid } from './ImageGrid';
import { useCrawl } from '@/hooks/useCrawl';
import { Loader2 } from 'lucide-react';

export function DRBFetcherLayout() {
  const { images, isLoading, error, crawledUrl, crawlUrl, clearResults } = useCrawl();

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">DRB Fetcher</h1>
          <p className="text-muted-foreground mt-1">
            Extract images from any webpage using Crawl4AI
          </p>
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
    </div>
  );
}
