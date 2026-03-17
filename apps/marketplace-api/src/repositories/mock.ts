/**
 * In-memory mock repositories for testing.
 */
import type {
  Seller,
  Endpoint,
  Transaction,
  CategoryCount,
  ProviderRate,
  DiscoverQuery,
  SellerRepository,
  EndpointRepository,
  TransactionRepository,
  Repositories,
} from "./types.js";

function uuid(): string {
  return crypto.randomUUID();
}

export class MockSellerRepository implements SellerRepository {
  public sellers: Seller[] = [];

  async findByApiKey(apiKey: string): Promise<Seller | null> {
    return this.sellers.find((s) => s.api_key === apiKey) ?? null;
  }

  async findByWallet(wallet: string): Promise<Seller | null> {
    return this.sellers.find((s) => s.wallet_address === wallet) ?? null;
  }

  async create(data: { wallet_address: string; display_name?: string; api_key: string }): Promise<Seller> {
    const seller: Seller = {
      id: uuid(),
      wallet_address: data.wallet_address,
      display_name: data.display_name ?? null,
      api_key: data.api_key,
      verified: false,
      created_at: new Date(),
    };
    this.sellers.push(seller);
    return seller;
  }
}

export class MockEndpointRepository implements EndpointRepository {
  public endpoints: Endpoint[] = [];
  public providerRates: ProviderRate[] = [];

  async findById(id: string): Promise<Endpoint | null> {
    return this.endpoints.find((e) => e.id === id) ?? null;
  }

  async findBySeller(sellerId: string): Promise<Endpoint[]> {
    return this.endpoints.filter((e) => e.seller_id === sellerId && e.active);
  }

  async create(data: Omit<Endpoint, "id" | "created_at" | "active" | "pricing_mode" | "pricing_config"> & { active?: boolean; pricing_mode?: string; pricing_config?: unknown | null }): Promise<Endpoint> {
    const ep: Endpoint = {
      id: uuid(),
      ...data,
      pricing_mode: data.pricing_mode ?? "flat",
      pricing_config: data.pricing_config ?? null,
      active: data.active ?? true,
      created_at: new Date(),
    };
    this.endpoints.push(ep);
    return ep;
  }

  async update(id: string, data: Partial<Omit<Endpoint, "id" | "created_at" | "seller_id">>): Promise<Endpoint | null> {
    const idx = this.endpoints.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.endpoints[idx] = { ...this.endpoints[idx], ...data };
    return this.endpoints[idx];
  }

  async deactivate(id: string): Promise<Endpoint | null> {
    return this.update(id, { active: false });
  }

  async discover(query: DiscoverQuery): Promise<{ endpoints: Endpoint[]; total: number }> {
    let results = this.endpoints.filter((e) => e.active);

    if (query.category) {
      results = results.filter((e) => e.category === query.category);
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      results = results.filter(
        (e) =>
          (e.description?.toLowerCase().includes(q)) ||
          e.url.toLowerCase().includes(q),
      );
    }

    // Sort
    if (query.sort === "price") {
      results.sort((a, b) => Number(a.price_usdc) - Number(b.price_usdc));
    } else if (query.sort === "newest") {
      results.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
    // "quality" = default order for now

    const total = results.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;
    results = results.slice(offset, offset + limit);

    return { endpoints: results, total };
  }

  async getCategories(): Promise<CategoryCount[]> {
    const counts = new Map<string, number>();
    for (const ep of this.endpoints) {
      if (!ep.active) continue;
      counts.set(ep.category, (counts.get(ep.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }

  async getProviderRates(): Promise<ProviderRate[]> {
    return [...this.providerRates].sort((a, b) => a.provider.localeCompare(b.provider));
  }
}

export class MockTransactionRepository implements TransactionRepository {
  public transactions: Transaction[] = [];

  async create(
    data: Omit<Transaction, "id" | "created_at" | "status"> & { status?: string },
  ): Promise<Transaction> {
    const tx: Transaction = {
      id: uuid(),
      ...data,
      status: data.status ?? "settled",
      created_at: new Date(),
    };
    this.transactions.push(tx);
    return tx;
  }
}

export function createMockRepositories(): Repositories & {
  sellers: MockSellerRepository;
  endpoints: MockEndpointRepository;
  transactions: MockTransactionRepository;
} {
  return {
    sellers: new MockSellerRepository(),
    endpoints: new MockEndpointRepository(),
    transactions: new MockTransactionRepository(),
  };
}
