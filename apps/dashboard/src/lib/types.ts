/** Raw transaction record from marketplace API */
export interface Transaction {
  id: string;
  endpoint_id: string;
  buyer_wallet: string;
  amount_usdc: number;
  tx_hash: string;
  latency_ms: number;
  status: "settled" | "failed";
  created_at: string; // ISO 8601
}

/** Aggregated stats summary */
export interface Stats {
  totalRevenue: number;
  transactionCount: number;
  uniqueWallets: number;
}

/** Per-endpoint breakdown row */
export interface EndpointBreakdown {
  endpoint_id: string;
  revenue: number;
  transactionCount: number;
}

/** Chart data point (daily granularity) */
export interface DayDataPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  transactionCount: number;
}
