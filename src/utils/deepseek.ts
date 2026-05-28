import { config } from '../config/index.js';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export interface DeepSeekOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  timeout?: number;
}

export async function callDeepSeek(options: DeepSeekOptions): Promise<{
  success: true; content: string; tokens: number
} | {
  success: false; error: string
}> {
  const { systemPrompt, userMessage, maxTokens = 1024, timeout = 30000 } = options;

  if (!config.deepseekApiKey) {
    return { success: false, error: 'DeepSeek API key not configured' };
  }

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `DeepSeek API error (${res.status}): ${errBody}` };
    }

    const data = (await res.json()) as DeepSeekResponse;
    const content = data.choices?.[0]?.message?.content || '';

    if (!content) {
      return { success: false, error: 'DeepSeek returned empty response' };
    }

    return { success: true, content, tokens: data.usage?.completion_tokens || 0 };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, error: 'AI service timed out' };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `AI service error: ${message}` };
  }
}
