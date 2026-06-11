import geoip from 'geoip-lite';

export interface GeoData {
  city?: string;
  state?: string;
  country?: string;
}

export function lookupGeo(ip?: string): GeoData {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {};
  }
  const cleanIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;
  const geo = geoip.lookup(cleanIp);
  if (!geo) return {};
  return {
    city: geo.city || undefined,
    state: geo.region || undefined,
    country: geo.country || undefined,
  };
}
