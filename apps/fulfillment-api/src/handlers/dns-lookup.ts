import type { Context } from "hono";
import { promises as dns } from "node:dns";

const ALLOWED_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"] as const;
type RecordType = (typeof ALLOWED_TYPES)[number];

const DEFAULT_TYPES: RecordType[] = ["A", "MX", "NS", "TXT"];
const LOOKUP_TIMEOUT_MS = 5_000;
const MAX_DOMAIN_LENGTH = 253;

interface DnsLookupInput {
  domain: string;
  types?: string[];
}

function isValidDomain(domain: unknown): domain is string {
  if (typeof domain !== "string") return false;
  if (domain.length === 0 || domain.length > MAX_DOMAIN_LENGTH) return false;
  if (/\s/.test(domain)) return false;
  if (!domain.includes(".")) return false;
  return true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("DNS lookup timed out")), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

async function resolveType(domain: string, type: RecordType): Promise<unknown[]> {
  try {
    switch (type) {
      case "A":
        return await withTimeout(dns.resolve4(domain), LOOKUP_TIMEOUT_MS);
      case "AAAA":
        return await withTimeout(dns.resolve6(domain), LOOKUP_TIMEOUT_MS);
      case "MX":
        return await withTimeout(dns.resolveMx(domain), LOOKUP_TIMEOUT_MS);
      case "NS":
        return await withTimeout(dns.resolveNs(domain), LOOKUP_TIMEOUT_MS);
      case "TXT":
        return await withTimeout(
          dns.resolveTxt(domain).then((records) => records.map((r) => r.join(""))),
          LOOKUP_TIMEOUT_MS,
        );
      case "CNAME":
        return await withTimeout(dns.resolveCname(domain), LOOKUP_TIMEOUT_MS);
      case "SOA": {
        const soa = await withTimeout(dns.resolveSoa(domain), LOOKUP_TIMEOUT_MS);
        return [soa];
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

export async function handleDnsLookup(c: Context) {
  const body = await c.req.json<DnsLookupInput>().catch(() => null);

  if (!body || !isValidDomain(body.domain)) {
    return c.json({ error: "Missing or invalid domain" }, 400);
  }

  const requestedTypes = body.types ?? DEFAULT_TYPES;

  // Validate all requested types
  const invalidTypes = requestedTypes.filter(
    (t) => !ALLOWED_TYPES.includes(t as RecordType),
  );
  if (invalidTypes.length > 0) {
    return c.json(
      { error: `Invalid record types: ${invalidTypes.join(", ")}. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      400,
    );
  }

  const types = requestedTypes as RecordType[];
  const results = await Promise.allSettled(
    types.map((type) => resolveType(body.domain, type)),
  );

  const records: Record<string, unknown[]> = {};
  types.forEach((type, i) => {
    const result = results[i];
    records[type] = result.status === "fulfilled" ? result.value : [];
  });

  return c.json({
    domain: body.domain,
    records,
    resolved_at: new Date().toISOString(),
  });
}
