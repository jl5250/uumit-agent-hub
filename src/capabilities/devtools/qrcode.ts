import QRCode from 'qrcode';
import { type CapabilityHandler } from '../registry.js';

export const qrcodeHandler: CapabilityHandler = async (input) => {
  const text = (input.text as string) || '';
  const format = (input.format as string) || 'base64';

  if (!text) {
    return { success: false, error: 'Missing required field: text' };
  }

  try {
    switch (format) {
      case 'base64': {
        const dataUrl = await QRCode.toDataURL(text, { width: 300, margin: 2 });
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        return { success: true, result: { format: 'base64', data: base64, mime: 'image/png' } };
      }
      case 'svg': {
        const svg = await QRCode.toString(text, { type: 'svg', width: 300, margin: 2 });
        return { success: true, result: { format: 'svg', data: svg, mime: 'image/svg+xml' } };
      }
      case 'utf8': {
        const utf8 = await QRCode.toString(text, { type: 'utf8', width: 300, margin: 2 });
        return { success: true, result: { format: 'utf8', data: utf8 } };
      }
      default:
        return { success: false, error: `Unsupported format: ${format}. Use base64, svg, or utf8.` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'QR generation failed';
    return { success: false, error: `QR code error: ${message}` };
  }
};
