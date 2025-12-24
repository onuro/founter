import { ScrollOptions } from './crawl';

export type PresetType = 'IMAGE' | 'CONTENT';

export interface CrawlOptions {
  scroll: ScrollOptions;
  // Future options can be added here (e.g., selectors, delays, etc.)
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
