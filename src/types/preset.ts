import { ScrollOptions } from './crawl';

export type PresetType = 'IMAGE' | 'CONTENT';

export interface CrawlOptions {
  scroll: ScrollOptions;
  cookies?: string; // Tab-separated cookie string from browser DevTools
  loadMoreSelector?: string; // CSS selector for "Load more" button (e.g., "button.load-more")
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
