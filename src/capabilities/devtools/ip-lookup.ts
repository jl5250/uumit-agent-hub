import { type CapabilityHandler } from '../registry';

interface IpApiResponse {
  status: string;
  query: string;
  country?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  org?: string;
  as?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  zip?: string;
}

export const ipLookupHandler: CapabilityHandler = async (input) => {
  const ip = (input.ip as string) || '';

  if (!ip) {
    return { success: false, error: 'Missing required field: ip' };
  }

  const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,query,country,regionName,city,isp,org,as,lat,lon,timezone,zip`);
  const data = (await res.json()) as IpApiResponse;

  if (data.status !== 'success') {
    return { success: false, error: 'IP lookup failed: invalid IP address' };
  }

  return {
    success: true,
    result: {
      ip: data.query,
      country: data.country,
      region: data.regionName,
      city: data.city,
      isp: data.isp,
      org: data.org,
      as: data.as,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      zip: data.zip,
    },
  };
};
