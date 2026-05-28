import { callDeepSeek } from '../../utils/deepseek.js';
import { type CapabilityHandler } from '../registry.js';

const TYPES: Record<string, { label: string; systemPrompt: string }> = {
  horoscope: {
    label: '星座运势',
    systemPrompt: `你是一个 AI 占星师。根据用户提供的星座，给出今日运势分析。
包括：整体运势（1-5星）、幸运数字、幸运颜色、事业/爱情/健康方面的提示。
语气温暖有趣，不要太严肃。语言：中文。输出格式简洁自然，不要用Markdown。`,
  },
  tarot: {
    label: '塔罗占卜',
    systemPrompt: `你是一个 AI 塔罗解读师。根据用户提出的问题，虚拟抽取三张塔罗牌（过去/现在/未来）。
解释每张牌的含义以及与问题的关联，最后给出综合建议。
语气神秘而温暖。语言：中文。输出格式简洁自然，不要用Markdown。`,
  },
  dream: {
    label: '梦境解析',
    systemPrompt: `你是一个 AI 解梦师。根据用户描述的梦境内容，给出心理学和文化角度的解析。
揭示梦境可能的象征意义，并提供一些思考方向。
语气温和有洞察力。语言：中文。输出格式简洁自然，不要用Markdown。`,
  },
};

export const fortuneHandler: CapabilityHandler = async (input) => {
  const type = (input.type as string) || 'horoscope';
  const query = (input.query as string) || '';

  const config = TYPES[type];
  if (!config) {
    return { success: false, error: `Unsupported type: ${type}. Use horoscope, tarot, or dream.` };
  }

  if (!query) {
    if (type === 'horoscope') return { success: false, error: '请填写星座名称，如：白羊座' };
    if (type === 'tarot') return { success: false, error: '请填写你想问的问题' };
    if (type === 'dream') return { success: false, error: '请描述你的梦境内容' };
  }

  const result = await callDeepSeek({
    systemPrompt: config.systemPrompt,
    userMessage: type === 'horoscope'
      ? `请为${query}做今日运势分析`
      : type === 'tarot'
        ? `我的问题是：${query}。请为我抽牌解读。`
        : `我梦到了：${query}。请帮我解析这个梦。`,
    maxTokens: 500,
    timeout: 20000,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    result: {
      type: config.label,
      query,
      content: result.content.trim(),
      tokens: result.tokens,
    },
  };
};
