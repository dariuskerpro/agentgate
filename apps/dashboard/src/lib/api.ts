import type { Transaction, Stats, EndpointBreakdown, DayDataPoint } from "./types.js";

const MARKETPLACE_URL =
  process.env.AGENTGATE_MARKETPLACE_URL ?? "https://api.agentgate.ai";

/** Format a USDC amount as $X.XX */
export function formatUSDC(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Aggregate stats from a list of transactions */
export function aggregateStats(transactions: Transaction[]): Stats {
  const wallets = new Set<string>();
  let totalRevenue = 0;
  for (const tx of transactions) {
    totalRevenue += tx.amount_usdc;
    wallets.add(tx.buyer_wallet);
  }
  return {
    totalRevenue,
    transactionCount: transactions.length,
    uniqueWallets: wallets.size,
  };
}

/** Group transactions by endpoint_id with revenue sums */
export function groupByEndpoint(
  transactions: Transaction[]
): EndpointBreakdown[] {
  const map = new Map<string, EndpointBreakdown>();
  for (const tx of transactions) {
    const existing = map.get(tx.endpoint_id);
    if (existing) {
      existing.revenue += tx.amount_usdc;
      existing.transactionCount += 1;
    } else {
      map.set(tx.endpoint_id, {
        endpoint_id: tx.endpoint_id,
        revenue: tx.amount_usdc,
        transactionCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

/** Group transactions by date (YYYY-MM-DD) for chart data */
export function groupByDay(transactions: Transaction[]): DayDataPoint[] {
  const map = new Map<string, DayDataPoint>();
  for (const tx of transactions) {
    const date = tx.created_at.slice(0, 10); // YYYY-MM-DD
    const existing = map.get(date);
    if (existing) {
      existing.revenue += tx.amount_usdc;
      existing.transactionCount += 1;
    } else {
      map.set(date, {
        date,
        revenue: tx.amount_usdc,
        transactionCount: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** Fetch transactions from the marketplace API */
export async function fetchTransactions(
  apiKey: string
): Promise<Transaction[]> {
  const res = await fetch(`${MARKETPLACE_URL}/v1/events/transactions`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transactions ?? [];
}
