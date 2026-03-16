/**
 * @agent-gate/middleware — Hono middleware
 *
 * Wraps x402 payment protection for Hono framework.
 * Works on Cloudflare Workers (no Node.js-specific APIs).
 *
 * Usage:
 * ```ts
 * import { Hono } from 'hono';
 * import { agentgate } from '@agent-gate/middleware/hono';
 *
 * const app = new Hono();
 * app.use('/api/*', agentgate({
 *   wallet: '0x...',
 *   routes: {
 *     'GET /api/weather': { price: '$0.001', description: 'Weather data' },
 *   },
 * }));
 * ```
 */

import type { AgentGateConfig } from "./types.js";
import {
  validateAndParseConfig,
  matchRoute,
  fireAnalytics,
  build402Body,
} from "./utils.js";

export type { AgentGateConfig, RouteConfig } from "./types.js";

// Hono middleware signature: (c: Context, next: Next) => Promise<void | Response>
// We type it loosely to avoid requiring hono as a dependency.

interface HonoContext {
  req: {
    method: string;
    path: string;
    header: (name: string) => string | undefined;
  };
  json: (data: unknown, status?: number) => Response;
}

type HonoNext = () => Promise<void>;

/**
 * Create a Hono middleware that applies x402 payment protection
 * to configured routes.
 */
export function agentgate(
  config: AgentGateConfig
): (c: HonoContext, next: HonoNext) => Promise<void | Response> {
  const parsedRoutes = validateAndParseConfig(config);

  return async (c: HonoContext, next: HonoNext): Promise<void | Response> => {
    // Find matching route
    let matchedKey: string | null = null;
    let matchedPrice: number | null = null;

    for (const [key, route] of parsedRoutes) {
      if (matchRoute(key, c.req.method, c.req.path)) {
        matchedKey = key;
        matchedPrice = route.price;
        break;
      }
    }

    // Unconfigured route → pass through
    if (!matchedKey || matchedPrice === null) {
      await next();
      return;
    }

    // Check for x402 payment header
    const paymentHeader = c.req.header("x-402-payment");

    if (!paymentHeader) {
      return c.json(build402Body(config, matchedPrice), 402);
    }

    // Payment present → allow through and fire analytics async
    fireAnalytics(config, matchedKey, matchedPrice);
    await next();
  };
}
