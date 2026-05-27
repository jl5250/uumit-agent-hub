import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  uumitCallbackSecret: process.env.UUMIT_CALLBACK_SECRET || '',
  agentCard: {
    name: process.env.AGENT_NAME || 'UUMit Agent Hub',
    description: process.env.AGENT_DESCRIPTION || '开发者工具集：UUID 生成、IP 查询、JSON 格式化等',
    url: process.env.AGENT_URL || '',
    protocol: ['a2a-json-rpc'],
  },
};
