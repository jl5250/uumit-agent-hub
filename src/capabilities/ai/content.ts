import { config } from '../../config/index.js';
import { type CapabilityHandler } from '../registry.js';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

export const contentHandler: CapabilityHandler = async (input) => {
  const prompt = (input.prompt as string) || '';
  const type = (input.type as string) || 'general';
  const tone = (input.tone as string) || 'neutral';
  const maxTokens = typeof input.max_tokens === 'number' ? input.max_tokens : 1024;

  if (!prompt) {
    return { success: false, error: 'Missing required field: prompt' };
  }

  if (!config.deepseekApiKey) {
    return { success: false, error: 'DeepSeek API key not configured' };
  }

  const systemPrompt = `你是一个专业的AI内容创作助手。请根据用户的要求生成${type === 'general' ? '通用' : type}内容。
语气要求：${tone === 'neutral' ? '中立客观' : tone === 'professional' ? '专业正式' : '友好亲切'}。
请直接输出内容，不要添加额外说明。`;

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  try {
    const res = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => 'Unknown error');
      return { success: false, error: `DeepSeek API error (${res.status}): ${errBody}` };
    }

    const data = (await res.json()) as DeepSeekResponse;
    const content = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      result: {
        content,
        type,
        tone,
        tokens: data.usage?.completion_tokens || 0,
        model: 'deepseek-chat',
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Content generation failed: ${message}` };
  }
};
