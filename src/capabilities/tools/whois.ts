import { type CapabilityHandler } from '../registry.js';

interface RdapEntity {
  handle?: string;
  roles?: string[];
  vcardArray?: [string, unknown[][]];
}

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface RdapResponse {
  handle?: string;
  ldhName?: string;
  entities?: RdapEntity[];
  events?: RdapEvent[];
  nameservers?: { ldhName: string }[];
  port43?: string;
  status?: string[];
}

function getEntityName(entity: RdapEntity): string {
  try {
    const vcard = entity.vcardArray?.[1];
    if (!vcard) return entity.handle || 'Unknown';
    const fnEntry = vcard.find((item) => (item as [string, unknown])[0] === 'fn');
    return fnEntry ? String((fnEntry as [string, unknown, string])[2] || (fnEntry as [string, string])[1]) : entity.handle || 'Unknown';
  } catch {
    return entity.handle || 'Unknown';
  }
}

function getEventDate(events: RdapEvent[] | undefined, action: string): string | undefined {
  return events?.find((e) => e.eventAction === action)?.eventDate;
}

export const whoisHandler: CapabilityHandler = async (input) => {
  const domain = (input.domain as string) || '';

  if (!domain) {
    return { success: false, error: 'Missing required field: domain' };
  }

  // 简单的域名格式校验
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return { success: false, error: 'Invalid domain format' };
  }

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      return { success: false, error: `Domain not found: ${domain}` };
    }

    if (!res.ok) {
      return { success: false, error: `RDAP query failed with status ${res.status}` };
    }

    const data = (await res.json()) as RdapResponse;

    const registrar = data.entities
      ?.filter((e) => e.roles?.includes('registrar'))
      .map(getEntityName)
      .join(', ');

    const org = data.entities
      ?.filter((e) => e.roles?.includes('registrant'))
      .map(getEntityName)
      .join(', ');

    return {
      success: true,
      result: {
        domain: data.ldhName || domain,
        registrar: registrar || undefined,
        org: org || undefined,
        creation_date: getEventDate(data.events, 'registration') || undefined,
        expiry_date: getEventDate(data.events, 'expiration') || undefined,
        last_changed: getEventDate(data.events, 'last changed') || undefined,
        name_servers: data.nameservers?.map((ns) => ns.ldhName) || [],
        status: data.status || [],
        whois_server: data.port43 || undefined,
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, error: 'Whois query timed out' };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Whois query failed: ${message}` };
  }
};
