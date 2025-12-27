export type AIProvider = 'openai' | 'anthropic' | 'glm' | 'deepseek';

export interface SummarizeOptions {
  shortMaxLength: number;
  longMaxLength: number;
}

export interface SummarizeResult {
  short: string;
  long: string;
}

export interface AIClient {
  summarize(content: string, options: SummarizeOptions): Promise<SummarizeResult>;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}
