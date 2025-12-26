export interface CrawlRequest {
  urls: string[];
  crawler_config?: Record<string, unknown>;
  browser_config?: Record<string, unknown>;
}

export interface CrawlResult {
  url: string;
  html: string;
  success: boolean;
  cleaned_html?: string;
  markdown?: string;
  media?: {
    images?: Array<{
      src: string;
      alt?: string;
      desc?: string;
      width?: number | null;
      height?: number | null;
      score?: number;
      group_id?: number;
      type?: string;
      format?: string;
    }>;
  };
  links?: {
    internal?: Array<{ href: string; text: string }>;
    external?: Array<{ href: string; text: string }>;
  };
}

export interface CrawlResponse {
  results: CrawlResult[];
  success: boolean;
}

export interface ExtractedImage {
  src: string;
  alt?: string;
  width?: number;
  link?: string;  // href from parent <a> tag
}

export interface CrawlState {
  images: ExtractedImage[];
  isLoading: boolean;
  error: string | null;
}

export interface ScrollOptions {
  enabled: boolean;
  scrollCount: number;  // Default: 3
  scrollDelay: number;  // Default: 500ms
}

export const DEFAULT_SCROLL_OPTIONS: ScrollOptions = {
  enabled: false,
  scrollCount: 3,
  scrollDelay: 500,
};

// Job Queue API types (Crawl4AI v0.7.6+)
export interface CrawlJobResponse {
  task_id: string;
  status?: string;
}

export interface CrawlTaskStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: CrawlResult;
  error?: string;
}

// Error response types
export type CrawlErrorType = 'timeout' | 'network' | 'crawl_error' | 'unknown';

export interface CrawlErrorResponse {
  success: false;
  error: string;
  errorType?: CrawlErrorType;
  suggestions?: string[];
}
