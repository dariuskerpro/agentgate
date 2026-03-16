/**
 * Shared utilities for @agent-gate/middleware
 * Used by Express, Hono, and Next.js middleware implementations.
 */

import type { AgentGateConfig, RouteConfig } from "./types.js";

// ── Price Parsing ──────────────────────────────────────────────────

/**
 * Parse a price string like "$0.001" or "0.001" into a numeric USDC amount.
 * Throws on invalid, empty, or negative values.
 */
export function parsePrice(input: string): number {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid price: must be a non-empty string");
  }

  const cleaned = input.startsWith("$") ? input.slice(1) : input;
  const value = Number(cleaned);

  if (Number.isNaN(value) || !Number.isFinite(value) || value < 0 || cleaned === "") {
    throw new Error(`Invalid price: "${input}" — must be a non-negative number`);
  }

  return value;
}

// ── Route Matching ─────────────────────────────────────────────────

/**
 * Match "METHOD /path" key against an incoming request.
 */
export function matchRoute(
  routeKey: string,
  method: string,
  path: string
): boolean {
  const parts = routeKey.split(" ");
  if (parts.length !== 2) return false;
  const [routeMethod, routePath] = parts;
  return (
    routeMethod.toUpperCase() === method.toUpperCase() &&
    routePath === path
  );
}

// ── Config Validation ──────────────────────────────────────────────

/**
 * Validate AgentGateConfig and pre-parse route prices.
 * Returns a Map of route keys to parsed config + numeric prices.
 * Throws on invalid config.
 */
export function validateAndParseConfig(
  config: AgentGateConfig
): Map<string, { config: RouteConfig; price: number }> {
  if (!config.wallet) {
    throw new Error(
      "AgentGate: wallet is required. Provide your wallet address to receive payments."
    );
  }

  if (!config.routes || Object.keys(config.routes).length === 0) {
    throw new Error(
      "AgentGate: routes is required and must contain at least one route configuration."
    );
  }

  const parsedRoutes = new Map<string, { config: RouteConfig; price: number }>();
  for (const [key, routeConfig] of Object.entries(config.routes)) {
    parsedRoutes.set(key, {
      config: routeConfig,
      price: parsePrice(routeConfig.price),
    });
  }

  return parsedRoutes;
}

// ── Analytics ──────────────────────────────────────────────────────

/**
 * Fire an async analytics event to the marketplace API.
 * Never throws — failures are silently caught to avoid blocking payments.
 */
export function fireAnalytics(
  config: AgentGateConfig,
  routeKey: string,
  price: number
): void {
  if (!config.marketplace?.apiKey || !config.marketplace?.baseUrl) {
    return;
  }

  const url = `${config.marketplace.baseUrl}/v1/events/transaction`;

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.marketplace.apiKey}`,
    },
    body: JSON.stringify({
      route: routeKey,
      wallet: config.wallet,
      price,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {
    // Silently swallow — analytics must never block payment flow
  });
}

// ── 402 Response Body ──────────────────────────────────────────────

/**
 * Build the standard 402 Payment Required response body.
 */
export function build402Body(
  config: AgentGateConfig,
  price: number
): Record<string, unknown> {
  return {
    error: "Payment Required",
    price,
    currency: "USDC",
    network: config.network || "eip155:8453",
    wallet: config.wallet,
    facilitator:
      config.facilitator ||
      "https://api.cdp.coinbase.com/platform/v2/x402",
  };
}
