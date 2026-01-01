// Automation types
export type AutomationType = 'resource_enricher';

export type AutomationRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type AIProvider = 'openai' | 'anthropic' | 'glm' | 'deepseek';

// Resource Enricher specific config
export interface ResourceEnricherConfig {
  baserow: {
    databaseId: number;
    tableId: number;
    urlField: string;
    shortDescField: string;
    longDescField: string;
    enableImageFields?: boolean;  // Toggle for image updates
    pngField?: string;            // Field name for PNG screenshot
    webpField?: string;           // Field name for WebP screenshot
  };
  ai: {
    enabled: boolean;
    provider: AIProvider;
    model?: string;
    shortMaxLength: number;
    longMaxLength: number;
  };
  crawl: {
    enabled: boolean;
    timeout?: number;
  };
}

// Union type for all automation configs
export type AutomationConfig = ResourceEnricherConfig;

// Base automation interface
export interface Automation {
  id: string;
  name: string;
  description: string | null;
  type: AutomationType;
  enabled: boolean;
  config: AutomationConfig;
  createdAt: Date;
  updatedAt: Date;
}

// Automation with run count for list view
export interface AutomationSummary {
  id: string;
  name: string;
  description: string | null;
  type: AutomationType;
  enabled: boolean;
  runCount: number;
  lastRunAt: Date | null;
  lastRunStatus: AutomationRunStatus | null;
  createdAt: Date;
  updatedAt: Date;
}

// Run step result
export interface AutomationStepResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  duration: number;
  data?: unknown;
  error?: string;
}

// Automation run
export interface AutomationRun {
  id: string;
  automationId: string;
  status: AutomationRunStatus;
  trigger: BaserowWebhookPayload | ManualTrigger;
  steps: AutomationStepResult[];
  error: string | null;
  duration: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

// Trigger types
export interface BaserowWebhookPayload {
  type: 'webhook';
  event_type: string;
  table_id: number;
  row_id: number;
  row: Record<string, unknown>;
}

export interface ManualTrigger {
  type: 'manual';
  triggeredBy: string;
}

// API Input types
export interface CreateAutomationInput {
  name: string;
  description?: string;
  type: AutomationType;
  config: AutomationConfig;
}

export interface UpdateAutomationInput {
  name?: string;
  description?: string;
  enabled?: boolean;
  config?: AutomationConfig;
}

// Automation type metadata for UI
export const AUTOMATION_TYPES: Record<AutomationType, {
  label: string;
  description: string;
  icon: string;
}> = {
  resource_enricher: {
    label: 'Resources BaseRow Updater',
    description: 'Crawl URL and generate AI summaries for Baserow rows',
    icon: 'Sparkles',
  },
};

// AI Provider metadata for UI
export const AI_PROVIDERS: Record<AIProvider, {
  label: string;
  models: string[];
  defaultModel: string;
}> = {
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  anthropic: {
    label: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  glm: {
    label: 'GLM (Zhipu)',
    models: ['glm-4-flash', 'glm-4'],
    defaultModel: 'glm-4-flash',
  },
  deepseek: {
    label: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
};
