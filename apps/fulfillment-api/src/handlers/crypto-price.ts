import type { Context } from "hono";

const ALLOWED_CURRENCIES = ["usd", "eur", "gbp", "jpy", "btc", "eth"] as const;
type Currency = (typeof ALLOWED_CURRENCIES)[number];

const MAX_IDS = 10;
const FETCH_TIMEOUT_MS = 10_000;
const COINGECKO_BASE = "https://api.coingecko.com/api/v3/simple/price";

interface CryptoPriceInput {
  ids: string[];
  currency?: string;
}

interface CoinGeckoEntry {
  [currency: string]: number;
  last_updated_at: number;
}

interface PriceInfo {
  price: number;
  change_24h: number;
  change_24h_pct: number;
  market_cap: number;
  volume_24h: number;
  last_updated: string;
}

export async function handleCryptoPrice(c: Context) {
  let body: CryptoPriceInput;
  try {
    body = await c.req.json<CryptoPriceInput>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { ids, currency: rawCurrency } = body;

  // Validate ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return c.json({ error: "ids must be a non-empty array of coin IDs" }, 400);
  }
  if (ids.length > MAX_IDS) {
    return c.json({ error: `ids array exceeds maximum of ${MAX_IDS}` }, 400);
  }
  if (!ids.every((id) => typeof id === "string" && id.length > 0)) {
    return c.json({ error: "Each id must be a non-empty string" }, 400);
  }

  // Validate currency
  const currency = (rawCurrency ?? "usd").toLowerCase() as Currency;
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return c.json(
      { error: `Invalid currency. Allowed: ${ALLOWED_CURRENCIES.join(", ")}` },
      400,
    );
  }

  // Build CoinGecko URL
  const params = new URLSearchParams({
    ids: ids.join(","),
    vs_currencies: currency,
    include_market_cap: "true",
    include_24hr_vol: "true",
    include_24hr_change: "true",
    include_last_updated_at: "true",
  });

  const url = `${COINGECKO_BASE}?${params}`;

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "TimeoutError"
        ? "CoinGecko request timed out"
        : "Failed to reach CoinGecko API";
    return c.json({ error: message }, 502);
  }

  if (response.status === 429) {
    return c.json({ error: "Rate limited, try again" }, 503);
  }

  if (!response.ok) {
    return c.json(
      { error: `CoinGecko API error: ${response.status}` },
      502,
    );
  }

  let data: Record<string, CoinGeckoEntry>;
  try {
    data = (await response.json()) as Record<string, CoinGeckoEntry>;
  } catch {
    return c.json({ error: "Invalid response from CoinGecko" }, 502);
  }

  // Map to clean format — omit coins not found
  const prices: Record<string, PriceInfo> = {};
  for (const id of ids) {
    const entry = data[id];
    if (!entry || entry[currency] === undefined) continue;

    prices[id] = {
      price: entry[currency],
      change_24h: entry[`${currency}_24h_change`] ?? 0,
      change_24h_pct: entry[`${currency}_24h_change`]
        ? (entry[`${currency}_24h_change`] / 100)
        : 0,
      market_cap: entry[`${currency}_market_cap`] ?? 0,
      volume_24h: entry[`${currency}_24h_vol`] ?? 0,
      last_updated: entry.last_updated_at
        ? new Date(entry.last_updated_at * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  return c.json({
    prices,
    currency,
    fetched_at: new Date().toISOString(),
  });
}
