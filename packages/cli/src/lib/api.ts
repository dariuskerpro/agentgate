/**
 * Marketplace API client for seller registration and endpoint management
 */

const DEFAULT_BASE_URL = 'https://api.agentgate.ai';

export interface RegisterSellerResponse {
  id: string;
  apiKey: string;
  wallet: string;
}

export interface RegisterEndpointInput {
  url: string;
  method: string;
  description?: string;
  category: string;
  priceUsdc: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export class MarketplaceClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async registerSeller(wallet: string): Promise<RegisterSellerResponse> {
    const res = await fetch(`${this.baseUrl}/v1/sellers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet }),
    });

    if (!res.ok) {
      throw new Error(`Failed to register seller: ${res.statusText}`);
    }

    return res.json() as Promise<RegisterSellerResponse>;
  }

  async registerEndpoint(endpoint: RegisterEndpointInput): Promise<{ id: string }> {
    if (!this.apiKey) {
      throw new Error('API key required to register endpoints');
    }

    const res = await fetch(`${this.baseUrl}/v1/endpoints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(endpoint),
    });

    if (!res.ok) {
      throw new Error(`Failed to register endpoint: ${res.statusText}`);
    }

    return res.json() as Promise<{ id: string }>;
  }
}
