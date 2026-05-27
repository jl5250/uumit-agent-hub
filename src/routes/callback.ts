import { Router, Request, Response } from 'express';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { executeCapability } from '../capabilities/registry.js';
import { logger } from '../utils/logger.js';

const router = Router();

// UUMit 回调入口：POST /callback
// UUMit 把所有接口参数（包含 capability-id）合并到 body 中转发
// API Key (Body 位置) 注入 callback_secret
router.post(
  '/callback',
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const start = performance.now();

    const capabilityId = (req.body['capability-id'] || req.body.capability_id) as string;
    if (!capabilityId) {
      logger.warn({ body: req.body }, 'Missing capability-id in body');
      return res.status(400).json({ success: false, error: 'Missing capability-id' });
    }

    logger.info({ capability_id: capabilityId, body: req.body }, 'Processing callback');

    const result = await executeCapability(capabilityId, req.body);

    const duration = ((performance.now() - start) / 1000).toFixed(3);
    logger.info(
      { capability_id: capabilityId, duration: `${duration}s`, success: result.success },
      'Callback completed',
    );

    res.json(result);
  },
);

export default router;
