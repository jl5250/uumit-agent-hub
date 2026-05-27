import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 幂等去重中间件
 * 按 idempotency_key + transaction_id 去重，防止重复结算
 */
const processedKeys = new Set<string>();

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const { idempotency_key, transaction_id } = req.body;

  if (idempotency_key && transaction_id) {
    const key = `${idempotency_key}:${transaction_id}`;
    if (processedKeys.has(key)) {
      logger.info({ key }, 'Duplicate callback, returning cached result');
      // 实际生产环境需要返回之前的结果
      return res.status(200).json({
        success: true,
        result: { note: 'Already processed' },
      });
    }
    processedKeys.add(key);

    // 控制内存用量：保留最近 10000 条
    if (processedKeys.size > 10000) {
      const keysToDelete = [...processedKeys].slice(0, 1000);
      keysToDelete.forEach((k) => processedKeys.delete(k));
    }
  }

  next();
}
