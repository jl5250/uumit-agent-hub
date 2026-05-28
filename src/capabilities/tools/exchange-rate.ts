import { type CapabilityHandler } from '../registry.js';

interface ExchangeRateResponse {
  base_code: string;
  rates: Record<string, number>;
  time_last_update_unix: number;
  result?: string;
}

const SUPPORTED_CURRENCIES = [
  'USD', 'CNY', 'EUR', 'GBP', 'JPY', 'KRW', 'HKD', 'TWD',
  'AUD', 'CAD', 'SGD', 'CHF', 'THB', 'MYR', 'VND', 'INR',
  'RUB', 'BRL', 'MXN', 'AED', 'SAR', 'NZD', 'SEK', 'NOK',
];

export const exchangeRateHandler: CapabilityHandler = async (input) => {
  const from = ((input.from as string) || 'USD').toUpperCase();
  const to = ((input.to as string) || 'CNY').toUpperCase();

  if (!SUPPORTED_CURRENCIES.includes(from)) {
    return { success: false, error: `Unsupported currency: ${from}` };
  }
  if (!SUPPORTED_CURRENCIES.includes(to)) {
    return { success: false, error: `Unsupported currency: ${to}` };
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { success: false, error: `Exchange rate API failed with status ${res.status}` };
    }

    const data = (await res.json()) as ExchangeRateResponse;

    if (data.result !== 'success') {
      return { success: false, error: `Exchange rate query failed for ${from}` };
    }

    const rate = data.rates[to];
    if (rate === undefined) {
      return { success: false, error: `Currency ${to} not found in rates` };
    }

    return {
      success: true,
      result: {
        from,
        to,
        rate,
        // 反向汇率
        inverse_rate: to !== from ? parseFloat((1 / rate).toFixed(6)) : 1,
        updated: new Date(data.time_last_update_unix * 1000).toISOString(),
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, error: 'Exchange rate query timed out' };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Exchange rate query failed: ${message}` };
  }
};
