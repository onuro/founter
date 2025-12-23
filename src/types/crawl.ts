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
}

export interface CrawlState {
  images: ExtractedImage[];
  isLoading: boolean;
  error: string | null;
}
