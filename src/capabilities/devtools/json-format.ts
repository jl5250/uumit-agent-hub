import { type CapabilityHandler } from '../registry.js';

export const jsonFormatHandler: CapabilityHandler = (input) => {
  const raw = (input.json as string) || '';
  const indent = typeof input.indent === 'number' ? input.indent : 2;

  if (!raw) {
    return { success: false, error: 'Missing required field: json' };
  }

  try {
    const parsed = JSON.parse(raw);
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
