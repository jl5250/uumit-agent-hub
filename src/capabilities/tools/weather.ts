import { type CapabilityHandler } from '../registry.js';

interface GeoResponse {
  results?: { name: string; latitude: number; longitude: number; country: string }[];
}

interface WeatherResponse {
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

// WMO Weather Code 到中文描述
const WMO_CODES: Record<number, string> = {
  0: '晴天', 1: '少云', 2: '多云', 3: '阴天',
  45: '雾', 48: '冻雾',
  51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨',
  71: '小雪', 73: '中雪', 75: '大雪',
  80: '小阵雨', 81: '中阵雨', 82: '大阵雨',
  95: '雷暴', 96: '雷暴+冰雹', 99: '强雷暴+冰雹',
};

const CACHE = new Map<string, { data: WeatherResponse; ttl: number }>();

export const weatherHandler: CapabilityHandler = async (input) => {
  const city = (input.city as string || '').trim();

  if (!city) {
    return { success: false, error: 'Missing required field: city' };
  }

  try {
    // 1. 地理编码：城市 → 经纬度
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=3&language=zh&format=json`,
      { signal: AbortSignal.timeout(8000) },
    );

    if (!geoRes.ok) {
      return { success: false, error: 'Geocoding service unavailable' };
    }

    const geoData = (await geoRes.json()) as GeoResponse;

    if (!geoData.results || geoData.results.length === 0) {
      return { success: false, error: `City not found: ${city}` };
    }

    const location = geoData.results[0];

    // 2. 查缓存（30分钟有效）
    const cacheKey = `${location.latitude.toFixed(2)}_${location.longitude.toFixed(2)}`;
    const cached = CACHE.get(cacheKey);
    if (cached && cached.ttl > Date.now()) {
      return formatWeatherResult(location, cached.data);
    }

    // 3. 获取天气数据
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&forecast_days=3`,
      { signal: AbortSignal.timeout(8000) },
    );

    if (!weatherRes.ok) {
      return { success: false, error: 'Weather service unavailable' };
    }

    const weatherData = (await weatherRes.json()) as WeatherResponse;

    // 缓存
    CACHE.set(cacheKey, { data: weatherData, ttl: Date.now() + 30 * 60 * 1000 });
    // 控制缓存大小
    if (CACHE.size > 100) {
      const keysToDelete = [...CACHE.keys()].slice(0, 20);
      keysToDelete.forEach((k) => CACHE.delete(k));
    }

    return formatWeatherResult(location, weatherData);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, error: 'Weather query timed out' };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Weather query failed: ${message}` };
  }
};

function formatWeatherResult(
  location: { name: string; country: string; latitude: number; longitude: number },
  data: WeatherResponse,
) {
  const current = data.current;
  const daily = data.daily;

  return {
    success: true,
    result: {
      city: location.name,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      current: current
        ? {
            temperature: current.temperature_2m,
            feels_like: current.apparent_temperature,
            condition: WMO_CODES[current.weather_code] || '未知',
            humidity: current.relative_humidity_2m,
            wind_speed: current.wind_speed_10m,
          }
        : undefined,
      forecast: daily
        ? daily.time.map((date, i) => ({
            date,
            max_temp: daily.temperature_2m_max[i],
            min_temp: daily.temperature_2m_min[i],
            condition: WMO_CODES[daily.weather_code[i]] || '未知',
            precipitation: daily.precipitation_sum[i],
          }))
        : [],
    },
  };
}
