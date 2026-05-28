import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { registerCapability } from './capabilities/registry.js';
import { uuidHandler } from './capabilities/devtools/uuid.js';
import { ipLookupHandler } from './capabilities/devtools/ip-lookup.js';
import { jsonFormatHandler } from './capabilities/devtools/json-format.js';
import { qrcodeHandler } from './capabilities/devtools/qrcode.js';
import { hotNewsHandler } from './capabilities/tools/hot-news.js';
import { whoisHandler } from './capabilities/tools/whois.js';
import { exchangeRateHandler } from './capabilities/tools/exchange-rate.js';
import { weatherHandler } from './capabilities/tools/weather.js';
import { contentHandler } from './capabilities/ai/content.js';
import { dailyQuoteHandler } from './capabilities/ai/daily-quote.js';
import { fortuneHandler } from './capabilities/ai/fortune.js';
import { heartWarmingHandler } from './capabilities/ai/heart-warming.js';
import { aiDailyHandler } from './capabilities/ai/ai-daily.js';
import callbackRoutes from './routes/callback.js';
import agentCardRoutes from './routes/agent-card.js';
import healthRoutes from './routes/health.js';

// 注册开发者工具
registerCapability('uuid', '生成 UUID (v4 或 v7)', uuidHandler);
registerCapability('ip-lookup', '查询 IP 地址地理位置信息', ipLookupHandler);
registerCapability('json-format', '格式化与验证 JSON 字符串', jsonFormatHandler);
registerCapability('qrcode', '生成二维码 (支持 base64/svg/utf8 格式)', qrcodeHandler);

// 注册热点资讯
registerCapability('hot-news', '获取全网热点新闻资讯聚合', hotNewsHandler);

// 注册数据查询
registerCapability('whois', '查询域名 Whois 注册信息', whoisHandler);
registerCapability('exchange-rate', '查询实时汇率转换', exchangeRateHandler);
registerCapability('weather', '查询城市实时天气与未来预报', weatherHandler);

// 注册 AI 能力
registerCapability('content-creation', '使用 DeepSeek 生成文章/文案/创意内容', contentHandler);
registerCapability('daily-quote', 'AI 每日格言金句生成（励志/爱情/治愈/哲理）', dailyQuoteHandler);
registerCapability('fortune-teller', 'AI 占卜运势（星座/塔罗/解梦）', fortuneHandler);
registerCapability('heart-warming', 'AI 暖心短篇故事创作', heartWarmingHandler);
registerCapability('ai-daily', 'AI 每日资讯简报（聚合 RSS 并智能摘要）', aiDailyHandler);

const app = express();

app.use(cors());
app.use(express.json());

// 路由
app.use(callbackRoutes);
app.use(agentCardRoutes);
app.use(healthRoutes);

// 启动
app.listen(config.port, () => {
  logger.info({ port: config.port }, 'UUMit Agent Hub started');
  logger.info({ cardUrl: `http://localhost:${config.port}/.well-known/agent.json` }, 'Agent Card available');
});
