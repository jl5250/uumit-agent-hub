import { type CapabilityHandler } from '../registry.js';

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  source?: string;
}

interface Rss2JsonItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

interface Rss2JsonResponse {
  status: 'ok' | 'error';
  items: Rss2JsonItem[];
  feed?: { title?: string };
}

const DEFAULT_SOURCES: Record<string, string> = {
  zhihu: 'https://www.zhihu.com/rss',
  solidot: 'https://www.solidot.org/feeds/all',
  '36kr': 'https://36kr.com/feed',
};

async function fetchRss(sourceUrl: string, sourceName: string): Promise<RssItem[]> {
  try {
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(sourceUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    const data = (await res.json()) as Rss2JsonResponse;

    if (data.status !== 'ok' || !data.items) return [];

    return data.items.slice(0, 10).map((item) => ({
      title: item.title,
      link: item.link,
      description: item.description?.replace(/<[^>]*>/g, '').slice(0, 150),
      pubDate: item.pubDate,
      source: sourceName,
    }));
  } catch {
    return [];
  }
}

export const hotNewsHandler: CapabilityHandler = async (input) => {
  const source = (input.source as string) || '';
  const category = (input.category as string) || '';

  let sourcesToFetch: [string, string][];

  if (source && DEFAULT_SOURCES[source]) {
    sourcesToFetch = [[source, DEFAULT_SOURCES[source]]];
  } else {
    sourcesToFetch = Object.entries(DEFAULT_SOURCES);
  }

  const results = await Promise.all(
    sourcesToFetch.map(([name, url]) => fetchRss(url, name)),
  );

  const allItems = results.flat();

  if (allItems.length === 0) {
    return { success: false, error: 'Failed to fetch news from any source' };
  }

  // Sort by date descending
  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return {
    success: true,
    result: {
      total: allItems.length,
      sources: Object.keys(DEFAULT_SOURCES),
      category: category || 'general',
      news: allItems.map((item, i) => ({
        id: i + 1,
        title: item.title,
        link: item.link,
        summary: item.description,
        source: item.source,
        published: item.pubDate,
      })),
    },
  };
};
