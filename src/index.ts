import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { registerCapability } from './capabilities/registry.js';
import { uuidHandler } from './capabilities/devtools/uuid.js';
import { ipLookupHandler } from './capabilities/devtools/ip-lookup.js';
import callbackRoutes from './routes/callback.js';
import agentCardRoutes from './routes/agent-card.js';
import healthRoutes from './routes/health.js';

// 注册能力
registerCapability('uuid', '生成 UUID (v4 或 v7)', uuidHandler);
registerCapability('ip-lookup', '查询 IP 地址地理位置信息', ipLookupHandler);

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
