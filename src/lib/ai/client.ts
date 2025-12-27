import type { AIProvider, AIClient, SummarizeOptions, SummarizeResult, AIProviderConfig } from './types';

const SUMMARIZE_PROMPT = `Analyze the following webpage content and provide two summaries:

1. SHORT DESCRIPTION: A concise, engaging summary that captures the essence of the content in {shortMaxLength} characters or less. Focus on the main value proposition or key insight.

2. LONG DESCRIPTION: A more detailed summary in {longMaxLength} characters or less. Include key features, benefits, or important details that would help someone understand what this resource offers.

IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{"short": "your short description here", "long": "your long description here"}

Content to summarize:
{content}`;

/**
 * Parse AI response and extract JSON
 */
function parseAIResponse(response: string): SummarizeResult {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim();

  // Remove ```json ... ``` or ``` ... ``` blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Try to extract JSON object from response
  const jsonMatch = cleaned.match(/\{[\s\S]*?"short"[\s\S]*?"long"[\s\S]*?\}/);
  if (!jsonMatch) {
    console.error('AI response (no JSON found):', response.substring(0, 500));
    throw new Error('AI response did not contain valid JSON');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.short || !parsed.long) {
      throw new Error('Missing short or long description in response');
    }
    return {
      short: parsed.short.trim(),
      long: parsed.long.trim(),
    };
  } catch (e) {
    console.error('AI response (parse failed):', jsonMatch[0].substring(0, 500));
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Create the prompt with options
 */
function createPrompt(content: string, options: SummarizeOptions): string {
  // Truncate content if too long (keep under ~100k chars for safety)
  const truncatedContent = content.length > 100000
    ? content.substring(0, 100000) + '\n\n[Content truncated...]'
    : content;

  return SUMMARIZE_PROMPT
    .replace('{shortMaxLength}', options.shortMaxLength.toString())
    .replace('{longMaxLength}', options.longMaxLength.toString())
    .replace('{content}', truncatedContent);
}

/**
 * OpenAI implementation
 */
async function summarizeWithOpenAI(
  content: string,
  options: SummarizeOptions,
  config: AIProviderConfig
): Promise<SummarizeResult> {
  const model = config.model || 'gpt-4o-mini';
  const prompt = createPrompt(content, options);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes web content. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content;
  if (!aiResponse) {
    throw new Error('No response from OpenAI');
  }

  return parseAIResponse(aiResponse);
}

/**
 * Anthropic implementation
 */
async function summarizeWithAnthropic(
  content: string,
  options: SummarizeOptions,
  config: AIProviderConfig
): Promise<SummarizeResult> {
  const model = config.model || 'claude-3-5-sonnet-20241022';
  const prompt = createPrompt(content, options);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Anthropic API request failed');
  }

  const data = await response.json();
  const aiResponse = data.content?.[0]?.text;
  if (!aiResponse) {
    throw new Error('No response from Anthropic');
  }

  return parseAIResponse(aiResponse);
}

/**
 * GLM (Zhipu) implementation
 */
async function summarizeWithGLM(
  content: string,
  options: SummarizeOptions,
  config: AIProviderConfig
): Promise<SummarizeResult> {
  const model = config.model || 'glm-4-flash';
  const prompt = createPrompt(content, options);

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes web content. Always respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'GLM API request failed');
  }

  const data = await response.json();
  const aiResponse = data.choices?.[0]?.message?.content;
  if (!aiResponse) {
    throw new Error('No response from GLM');
  }

  return parseAIResponse(aiResponse);
}

/**
 * Create an AI client for the specified provider
 */
export function createAIClient(provider: AIProvider, apiKey: string, model?: string): AIClient {
  const config: AIProviderConfig = { apiKey, model };

  return {
    async summarize(content: string, options: SummarizeOptions): Promise<SummarizeResult> {
      switch (provider) {
        case 'openai':
          return summarizeWithOpenAI(content, options, config);
        case 'anthropic':
          return summarizeWithAnthropic(content, options, config);
        case 'glm':
          return summarizeWithGLM(content, options, config);
        default:
          throw new Error(`Unknown AI provider: ${provider}`);
      }
    },
  };
}
