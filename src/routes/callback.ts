import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { executeCapability } from '../capabilities/registry.js';
import { logger } from '../utils/logger.js';

const router = Router();

// UUMit 回调入口：POST /callback
// capability_id 优先从请求头读取（每个 UUMit 接口配置自定义请求头 capability-id）
router.post(
  '/callback',
  authMiddleware,
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const start = performance.now();
    const capabilityId = (req.headers['capability-id'] as string) || req.params.capabilityId || req.body.capability_id;

    if (!capabilityId) {
      logger.warn({ body: req.body, headers: req.headers }, 'Missing capability_id');
      return res.status(400).json({ success: false, error: 'Missing capability_id' });
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
