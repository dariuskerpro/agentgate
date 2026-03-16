/**
 * @agentgate/middleware — Next.js App Router middleware
 *
 * Wraps Next.js route handlers with x402 payment protection.
 * Works with the App Router pattern: (request: Request) => Response.
 *
 * Usage:
 * ```ts
 * // app/api/weather/route.ts
 * import { withAgentGate } from '@agentgate/middleware/next';
 *
 * async function GET(request: Request) {
 *   return Response.json({ temp: 72 });
 * }
 *
 * export default withAgentGate(GET, {
 *   wallet: '0x...',
 *   price: '$0.001',
 *   description: 'Weather data',
 *   category: 'data',
 * });
 * ```
 */

import type { RouteConfig } from "./types.js";
import { parsePrice, fireAnalytics, build402Body } from "./utils.js";

export type { RouteConfig } from "./types.js";

// ── Next.js-specific config ────────────────────────────────────────

export interface WithAgentGateOptions extends RouteConfig {
  wallet: string;
  marketplace?: {
    apiKey: string;
    baseUrl?: string;
  };
  facilitator?: string;
  network?: string;
}

type RouteHandler = (request: Request) => Response | Promise<Response>;

/**
 * Wrap a Next.js App Router route handler with x402 payment protection.
 */
export function withAgentGate(
  handler: RouteHandler,
  options: WithAgentGateOptions
): RouteHandler {
  // Validate config at init time
  if (!options.wallet) {
    throw new Error(
      "AgentGate: wallet is required. Provide your wallet address to receive payments."
    );
  }

  const price = parsePrice(options.price);

  // Build a minimal AgentGateConfig for shared utils
  const configForAnalytics = {
    wallet: options.wallet,
    marketplace: options.marketplace,
    routes: {} as Record<string, RouteConfig>,
    facilitator: options.facilitator,
    network: options.network,
  };

  return async (request: Request): Promise<Response> => {
    // Check for x402 payment header
    const paymentHeader = request.headers.get("x-402-payment");

    if (!paymentHeader) {
      return Response.json(build402Body(configForAnalytics, price), {
        status: 402,
      });
    }

    // Payment present → fire analytics async and call handler
    const url = new URL(request.url);
    const routeKey = `${request.method} ${url.pathname}`;
    fireAnalytics(configForAnalytics, routeKey, price);

    return handler(request);
  };
}
