import { ScrollOptions } from './crawl';

export type PresetType = 'IMAGE' | 'CONTENT';

export interface GridOptions {
  columns: number;      // 2, 3, 4, 5, 6, 8
  gap: string;          // '0.5rem', '0.75rem', '1rem', '1.25rem', '1.5rem'
  aspectRatio: string;  // '1/1', '16/9', '9/16', etc.
}

export interface CrawlOptions {
  scroll: ScrollOptions;
  cookies?: string; // Tab-separated cookie string from browser DevTools
  loadMoreSelector?: string; // CSS selector for "Load more" button (e.g., "button.load-more")
  gridOptions?: GridOptions; // Display options for the image grid
}

export interface SitePreset {
  id: string;
  label: string;
  url: string;
  type: PresetType;
  crawlOptions: CrawlOptions;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePresetInput {
  label: string;
  url: string;
  type: PresetType;
  crawlOptions: CrawlOptions;
}

export interface UpdatePresetInput {
  id: string;
  label?: string;
  url?: string;
  crawlOptions?: CrawlOptions;
}
