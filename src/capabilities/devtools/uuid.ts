import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';
import { type CapabilityHandler } from '../registry';

export const uuidHandler: CapabilityHandler = (input) => {
  const version = (input.version as string) || 'v4';

  switch (version) {
    case 'v4':
      return { success: true, result: { uuid: uuidv4() } };
    case 'v7':
      return { success: true, result: { uuid: uuidv7() } };
    default:
      return { success: false, error: `Unsupported UUID version: ${version}. Use v4 or v7.` };
  }
};
