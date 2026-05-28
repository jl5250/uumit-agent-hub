import { callDeepSeek } from '../../utils/deepseek.js';
import { type CapabilityHandler } from '../registry.js';

interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface Rss2JsonResponse {
  status: 'ok' | 'error';
  items: RssItem[];
}

const RSS_SOURCES: Record<string, string> = {
  '36氪': 'https://36kr.com/feed',
  'Solidot': 'https://www.solidot.org/feeds/all',
};

// 简单缓存
const CACHE = new Map<string, { content: string; ttl: number }>();

async function fetchRssItems(): Promise<RssItem[]> {
  const allItems: RssItem[] = [];

  for (const [source, url] of Object.entries(RSS_SOURCES)) {
    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      const data = (await res.json()) as Rss2JsonResponse;

      if (data.status === 'ok' && data.items) {
        const items = data.items.slice(0, 8).map((item) => ({
          ...item,
          description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) || '',
        }));
        allItems.push(...items);
      }
    } catch {
      // 单个源失败不影响其他源
    }
  }

  return allItems;
}

export const aiDailyHandler: CapabilityHandler = async (input) => {
  const date = (input.date as string) || new Date().toISOString().split('T')[0];

  // 检查缓存（1小时有效）
  const cacheKey = `ai-daily:${date}`;
  const cached = CACHE.get(cacheKey);
  if (cached && cached.ttl > Date.now()) {
    return cached.content as unknown as { success: boolean; result: Record<string, unknown> };
  }

  // 抓取 RSS
  const items = await fetchRssItems();

  if (items.length === 0) {
    return { success: false, error: '无法获取新闻源，请稍后重试' };
  }

  // 构建新闻文本给 AI
  const newsText = items
    .map((item, i) => `${i + 1}. 【${item.title}】${item.description}`)
    .join('\n\n');

  const systemPrompt = `你是一个 AI 新闻编辑。根据提供的新闻条目，筛选出最有价值的资讯。
请按以下格式输出：

🔥 今日要闻：用 2-3 句话概括最重要的 1-2 条新闻

📌 其他热点：剩下的新闻用 1 句话简要说明每条的核心信息

语言：中文。保持简洁，不要加额外评论。`;

  const result = await callDeepSeek({
    systemPrompt,
    userMessage: `以下是 ${date} 的新闻汇总：\n\n${newsText}`,
    maxTokens: 800,
    timeout: 30000,
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const response = {
    success: true as const,
    result: {
      date,
      summary: result.content.trim(),
      sources: Object.keys(RSS_SOURCES),
      news_count: items.length,
      tokens: result.tokens,
    },
  };

  // 写缓存
  CACHE.set(cacheKey, {
    content: JSON.stringify(response),
    ttl: Date.now() + 60 * 60 * 1000,
  });

  return response;
};
