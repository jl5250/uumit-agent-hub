import { callDeepSeek } from '../../utils/deepseek.js';
import { type CapabilityHandler } from '../registry.js';

const LENGTHS: Record<string, string> = {
  short: '100字左右',
  medium: '300字左右',
  long: '500字左右',
};

export const heartWarmingHandler: CapabilityHandler = async (input) => {
  const theme = (input.theme as string) || '温暖';
  const length = (input.length as string) || 'short';

  const lengthHint = LENGTHS[length] || '100字左右';

  const systemPrompt = `你是一个暖心短篇故事作家。你擅长用简洁的文字讲述温暖人心的微型故事。
要求：故事情节完整，有转折和温暖的结局，能引发共鸣。
语言：中文。直接输出故事内容。标题用【】括起来放在第一行。`;

  const userMessage = `请创作一个以"${theme}"为主题的暖心故事，${lengthHint}。`;

  const result = await callDeepSeek({
    systemPrompt,
    userMessage,
    maxTokens: length === 'long' ? 800 : length === 'medium' ? 500 : 300,
    timeout: 25000,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const content = result.content.trim();
  const titleMatch = content.match(/^【(.+?)】/);
  const title = titleMatch ? titleMatch[1] : '';

  return {
    success: true,
    result: {
      title: title || undefined,
      content: title ? content.replace(/^【.+?】/, '').trim() : content,
      theme,
      length,
      tokens: result.tokens,
    },
  };
};
