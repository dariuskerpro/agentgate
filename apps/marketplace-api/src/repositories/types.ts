/**
 * Repository interfaces — abstract DB access for testability.
 */

export interface Seller {
  id: string;
  wallet_address: string;
  display_name: string | null;
  api_key: string;
  verified: boolean;
  created_at: Date;
}

export interface Endpoint {
  id: string;
  seller_id: string;
  url: string;
  method: string;
  description: string | null;
  category: string;
  price_usdc: string;
  input_schema: unknown | null;
  output_schema: unknown | null;
  network: string;
  active: boolean;
  created_at: Date;
}

export interface Transaction {
  id: string;
  endpoint_id: string;
  buyer_wallet: string;
  amount_usdc: string;
  tx_hash: string | null;
  latency_ms: number | null;
  status: string;
  created_at: Date;
}

export interface EndpointHealth {
  endpoint_id: string;
  checked_at: Date;
  status_code: number | null;
  latency_ms: number | null;
  is_up: boolean | null;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface DiscoverQuery {
  category?: string;
  q?: string;
  sort?: "quality" | "price" | "newest";
  limit?: number;
  offset?: number;
}

export interface SellerRepository {
  findByApiKey(apiKey: string): Promise<Seller | null>;
  findByWallet(wallet: string): Promise<Seller | null>;
  create(data: { wallet_address: string; display_name?: string; api_key: string }): Promise<Seller>;
}

export interface EndpointRepository {
  findById(id: string): Promise<Endpoint | null>;
  findBySeller(sellerId: string): Promise<Endpoint[]>;
  create(data: Omit<Endpoint, "id" | "created_at" | "active"> & { active?: boolean }): Promise<Endpoint>;
  update(id: string, data: Partial<Omit<Endpoint, "id" | "created_at" | "seller_id">>): Promise<Endpoint | null>;
  deactivate(id: string): Promise<Endpoint | null>;
  discover(query: DiscoverQuery): Promise<{ endpoints: Endpoint[]; total: number }>;
  getCategories(): Promise<CategoryCount[]>;
}

export interface TransactionRepository {
  create(data: Omit<Transaction, "id" | "created_at" | "status"> & { status?: string }): Promise<Transaction>;
}

export interface Repositories {
  sellers: SellerRepository;
  endpoints: EndpointRepository;
  transactions: TransactionRepository;
}
