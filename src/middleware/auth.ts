import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * 校验 UUMit 回调请求中的 callback_secret
 * 防止伪造请求
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 从 body 或 header 中获取 callback_secret
  const callback_secret = req.body.callback_secret || req.headers['callback-secret'] as string;

  if (!callback_secret) {
    logger.warn({ transaction_id: req.body.transaction_id }, 'Missing callback_secret');
    return res.status(401).json({
      success: false,
      error: 'Missing callback_secret',
    });
  }

  if (callback_secret !== config.uumitCallbackSecret) {
    logger.warn({ transaction_id: req.body.transaction_id }, 'Invalid callback_secret');
    return res.status(403).json({
      success: false,
      error: 'Invalid callback_secret',
    });
  }

  next();
}
