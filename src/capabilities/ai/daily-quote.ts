import { callDeepSeek } from '../../utils/deepseek.js';
import { type CapabilityHandler } from '../registry.js';

export const dailyQuoteHandler: CapabilityHandler = async (input) => {
  const style = (input.style as string) || 'inspirational';
  const theme = (input.theme as string) || '';

  const validStyles: Record<string, string> = {
    inspirational: '励志鼓舞',
    love: '爱情浪漫',
    healing: '治愈温暖',
    wisdom: '哲理智慧',
  };

  const styleLabel = validStyles[style] || '励志鼓舞';
  const themeHint = theme ? `主题围绕"${theme}"。` : '';

  const systemPrompt = `你是一个名言金句创作大师。你善于用简洁有力的语言表达深刻的人生道理。
根据用户的风格要求，创作一句富有感染力的话（不超过100字）。
语言：中文。直接输出金句内容，不要加引号、不要加说明、不要加作者署名。`;

  const userMessage = `风格：${styleLabel}。${themeHint}请创作一句符合该风格的短句。`;

  const result = await callDeepSeek({
    systemPrompt,
    userMessage,
    maxTokens: 200,
    timeout: 15000,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    result: {
      content: result.content.trim(),
      style,
      theme: theme || undefined,
      tokens: result.tokens,
    },
  };
};
