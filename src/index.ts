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
import { contentHandler } from './capabilities/ai/content.js';
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

// 注册 AI 能力
registerCapability('content-creation', '使用 DeepSeek 生成文章/文案/创意内容', contentHandler);

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
