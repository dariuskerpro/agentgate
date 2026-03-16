// Placeholder — will be implemented in AG-002
export interface RouteConfig {
  price: string;
  description?: string;
  category?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface AgentGateConfig {
  wallet: string;
  marketplace?: { apiKey: string; baseUrl?: string };
  routes: Record<string, RouteConfig>;
  facilitator?: string;
  network?: string;
}

export function agentgate(_config: AgentGateConfig) {
  return (_req: unknown, _res: unknown, next: () => void) => {
    next();
  };
}
