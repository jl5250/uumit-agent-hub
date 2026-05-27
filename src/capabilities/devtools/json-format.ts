import { type CapabilityHandler } from '../registry.js';

export const jsonFormatHandler: CapabilityHandler = (input) => {
  const raw = input.json;
  const indent = typeof input.indent === 'number' ? input.indent : 2;

  if (raw === undefined || raw === null || raw === '') {
    return { success: false, error: 'Missing required field: json' };
  }

  try {
    // 兼容 UUMit 传对象或字符串两种格式
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      success: true,
      result: {
        formatted: JSON.stringify(parsed, null, indent),
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : undefined,
        length: Array.isArray(parsed) ? parsed.length : undefined,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON';
    return { success: false, error: `JSON parse error: ${message}` };
  }
};
