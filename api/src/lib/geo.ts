import geoip from 'geoip-lite';

export interface GeoData {
  city?: string;
  state?: string;
  country?: string;
}

export function lookupGeo(ip?: string): GeoData {
  if (!ip) return {};
  // Strip IPv6-mapped IPv4 prefix (::ffff:x.x.x.x)
  let resolved = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  // Take first IP if comma-separated (X-Forwarded-For chain)
  if (resolved.includes(',')) resolved = resolved.split(',')[0].trim();
  if (resolved === '127.0.0.1' || resolved === '::1' || resolved.startsWith('192.168.') || resolved.startsWith('10.') || resolved.startsWith('172.')) {
    return {};
  }
  const geo = geoip.lookup(resolved);
  if (!geo) return {};
  return {
    city: geo.city || undefined,
    state: geo.region || undefined,
    country: geo.country || undefined,
  };
}
