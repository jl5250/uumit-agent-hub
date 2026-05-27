import { logger } from '../utils/logger.js';

export interface CapabilityInput {
  [key: string]: unknown;
}

export interface CapabilityResult {
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export type CapabilityHandler = (input: CapabilityInput) => Promise<CapabilityResult> | CapabilityResult;

const registry = new Map<string, { handler: CapabilityHandler; description: string }>();

export function registerCapability(id: string, description: string, handler: CapabilityHandler) {
  registry.set(id, { handler, description });
  logger.info({ capability_id: id }, 'Capability registered');
}

export function getCapability(id: string) {
  return registry.get(id);
}

export function getAllCapabilities() {
  return Array.from(registry.entries()).map(([id, meta]) => ({
    id,
    description: meta.description,
  }));
}

export async function executeCapability(id: string, input: CapabilityInput): Promise<CapabilityResult> {
  const cap = registry.get(id);
  if (!cap) {
    return { success: false, error: `Unknown capability: ${id}` };
  }
  try {
    return await cap.handler(input);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ capability_id: id, error: message }, 'Capability execution failed');
    return { success: false, error: message };
  }
}
