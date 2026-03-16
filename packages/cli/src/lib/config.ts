/**
 * Config generation for .agentgate.json
 */

import { randomBytes } from 'node:crypto';

export interface RouteConfig {
  price: string;
  description?: string;
  category?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AgentGateFileConfig {
  wallet: string;
  apiKey: string;
  routes: Record<string, RouteConfig>;
  network: string;
  facilitator: string;
}

export interface GenerateConfigInput {
  wallet: string;
  apiKey: string;
  routes: Record<string, RouteConfig>;
  network?: string;
  facilitator?: string;
}

const DEFAULT_NETWORK = 'eip155:8453';
const DEFAULT_FACILITATOR = 'https://api.cdp.coinbase.com/platform/v2/x402';

/**
 * Generate a unique API key prefixed with `ag_`.
 */
export function generateApiKey(): string {
  return `ag_${randomBytes(16).toString('hex')}`;
}

/**
 * Generate a complete .agentgate.json config object.
 */
export function generateConfig(input: GenerateConfigInput): AgentGateFileConfig {
  return {
    wallet: input.wallet,
    apiKey: input.apiKey,
    routes: input.routes,
    network: input.network ?? DEFAULT_NETWORK,
    facilitator: input.facilitator ?? DEFAULT_FACILITATOR,
  };
}
