import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { executeCapability } from '../capabilities/registry.js';
import { logger } from '../utils/logger.js';

const router = Router();

const callbackSchema = z.object({
  transaction_id: z.string().min(1),
  capability_id: z.string().min(1),
  caller_id: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  idempotency_key: z.string().optional(),
  callback_secret: z.string().min(1),
});

// UUMit 回调入口：POST /callback
router.post(
  '/callback',
  authMiddleware,
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const start = performance.now();

    logger.debug({ body: req.body, headers: req.headers }, 'Callback request received');

    const parsed = callbackSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn({ errors: parsed.error.flatten(), body: req.body }, 'Invalid callback request');
      return res.status(400).json({
        success: false,
        error: `Validation error: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
      });
    }

    const { transaction_id, capability_id, input = {} } = parsed.data;

    logger.info({ transaction_id, capability_id }, 'Processing callback');

    const result = await executeCapability(capability_id, input);

    const duration = ((performance.now() - start) / 1000).toFixed(3);
    logger.info(
      { transaction_id, capability_id, duration: `${duration}s`, success: result.success },
      'Callback completed',
    );

    res.json(result);
  },
);

export default router;
