/**
 * Shared types for @agentgate/middleware
 * Used by Express, Hono, and Next.js middleware implementations.
 */

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
