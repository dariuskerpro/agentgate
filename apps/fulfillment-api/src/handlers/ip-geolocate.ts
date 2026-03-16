import type { Context } from "hono";

function isValidIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d{1,3}$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function isValidIPv6(ip: string): boolean {
  return ip.includes(":");
}

function isPrivateIP(ip: string): boolean {
  if (ip.includes(":")) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    // fc00::/7 covers fc00:: and fd00::
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    return false;
  }

  const parts = ip.split(".").map(Number);
  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 127) return true;
  if (a === 0) return true;

  return false;
}

export async function handleIpGeolocate(c: Context) {
  let body: { ip?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const ip = body.ip;
  if (!ip || typeof ip !== "string") {
    return c.json({ error: "Missing required field: ip" }, 400);
  }

  const trimmed = ip.trim();
  const isV4 = isValidIPv4(trimmed);
  const isV6 = isValidIPv6(trimmed);

  if (!isV4 && !isV6) {
    return c.json({ error: "Invalid IP address format" }, 400);
  }

  if (isPrivateIP(trimmed)) {
    return c.json({ error: "Private/reserved IP addresses are not allowed" }, 400);
  }

  const url = `http://ip-api.com/json/${encodeURIComponent(trimmed)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return c.json({ error: "Upstream geolocation service timeout" }, 504);
  }

  if (response.status === 429) {
    return c.json({ error: "Rate limit exceeded, try again later" }, 503);
  }

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid response from geolocation service" }, 502);
  }

  if (data.status === "fail") {
    return c.json({ error: data.message || "Geolocation lookup failed" }, 422);
  }

  return c.json({
    ip: trimmed,
    country: data.countryCode,
    country_name: data.country,
    region: data.regionName,
    city: data.city,
    zip: data.zip,
    lat: data.lat,
    lon: data.lon,
    timezone: data.timezone,
    isp: data.isp,
    org: data.org,
    as: data.as,
    fetched_at: new Date().toISOString(),
  });
}
