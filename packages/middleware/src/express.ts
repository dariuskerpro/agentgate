/**
 * @agentgate/middleware — Express middleware
 *
 * Wraps x402 payment protection with AgentGate's value-add:
 * - Route-level USDC pricing
 * - Async analytics events to marketplace API
 * - Graceful degradation when marketplace is unreachable
 *
 * For now, x402 dependencies are mocked — real integration comes later.
 */

import type { Request, Response, NextFunction } from "express";

// ── Types ──────────────────────────────────────────────────────────

export interface RouteConfig {
  price: string;
  description?: string;
  category?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AgentGateConfig {
  wallet: string;
  marketplace?: {
    apiKey: string;
    baseUrl?: string;
  };
  routes: Record<string, RouteConfig>;
  facilitator?: string;
  network?: string;
}

// ── Price Parsing ──────────────────────────────────────────────────

/**
 * Parse a price string like "$0.001" or "0.001" into a numeric USDC amount.
 * Throws on invalid, empty, or negative values.
 */
export function parsePrice(input: string): number {
  if (!input || typeof input !== "string") {
    throw new Error("Invalid price: must be a non-empty string");
  }

  // Strip leading dollar sign
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
function matchRoute(
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

// ── Analytics ──────────────────────────────────────────────────────

/**
 * Fire an async analytics event to the marketplace API.
 * Never throws — failures are silently caught to avoid blocking payments.
 */
function fireAnalytics(
  config: AgentGateConfig,
  routeKey: string,
  price: number
): void {
  if (!config.marketplace?.apiKey || !config.marketplace?.baseUrl) {
    return;
  }

  const url = `${config.marketplace.baseUrl}/v1/events/transaction`;

  // Fire and forget — don't await, catch all errors
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

// ── Middleware ──────────────────────────────────────────────────────

/**
 * Create an Express middleware that applies x402 payment protection
 * to configured routes.
 *
 * Usage:
 * ```ts
 * app.use(agentgate({
 *   wallet: '0x...',
 *   routes: {
 *     'GET /api/weather': { price: '$0.001', description: 'Weather data' },
 *   },
 * }));
 * ```
 */
export function agentgate(config: AgentGateConfig) {
  // ── Validate config ──
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

  // Pre-parse prices at init time to fail fast on bad config
  const parsedRoutes = new Map<string, { config: RouteConfig; price: number }>();
  for (const [key, routeConfig] of Object.entries(config.routes)) {
    parsedRoutes.set(key, {
      config: routeConfig,
      price: parsePrice(routeConfig.price),
    });
  }

  // ── Return middleware function ──
  return (req: Request, res: Response, next: NextFunction): void => {
    // Find matching route
    let matchedKey: string | null = null;
    let matchedRoute: { config: RouteConfig; price: number } | null = null;

    for (const [key, route] of parsedRoutes) {
      if (matchRoute(key, req.method, req.path)) {
        matchedKey = key;
        matchedRoute = route;
        break;
      }
    }

    // Unconfigured route → pass through
    if (!matchedKey || !matchedRoute) {
      next();
      return;
    }

    // Check for x402 payment header
    // In production this would verify the payment via @x402/core
    // For now we just check for the header's presence
    const paymentHeader = req.headers["x-402-payment"];

    if (!paymentHeader) {
      // No payment → return 402 Payment Required
      res.status(402).json({
        error: "Payment Required",
        price: matchedRoute.price,
        currency: "USDC",
        network: config.network || "eip155:8453",
        wallet: config.wallet,
        facilitator: config.facilitator || "https://api.cdp.coinbase.com/platform/v2/x402",
      });
      return;
    }

    // Payment present → allow through and fire analytics async
    fireAnalytics(config, matchedKey, matchedRoute.price);
    next();
  };
}
