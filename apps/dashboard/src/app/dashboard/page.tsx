import React from "react";
import { StatsCard } from "../../components/stats-card.js";
import { EndpointTable } from "../../components/endpoint-table.js";
import { RevenueChart } from "../../components/revenue-chart.js";
import { formatUSDC, aggregateStats, groupByEndpoint, groupByDay } from "../../lib/api.js";
import type { Transaction } from "../../lib/types.js";

// Stub data for development — will be fetched from API in production
const STUB_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    endpoint_id: "ep-weather",
    buyer_wallet: "0xAgent1",
    amount_usdc: 0.001,
    tx_hash: "0xabc",
    latency_ms: 120,
    status: "settled",
    created_at: "2026-03-14T10:00:00Z",
  },
  {
    id: "tx-2",
    endpoint_id: "ep-weather",
    buyer_wallet: "0xAgent2",
    amount_usdc: 0.001,
    tx_hash: "0xdef",
    latency_ms: 95,
    status: "settled",
    created_at: "2026-03-14T11:00:00Z",
  },
  {
    id: "tx-3",
    endpoint_id: "ep-scrape",
    buyer_wallet: "0xAgent1",
    amount_usdc: 0.005,
    tx_hash: "0xghi",
    latency_ms: 340,
    status: "settled",
    created_at: "2026-03-15T09:00:00Z",
  },
];

export default function DashboardPage() {
  const transactions = STUB_TRANSACTIONS;
  const stats = aggregateStats(transactions);
  const endpointBreakdown = groupByEndpoint(transactions);
  const chartData = groupByDay(transactions);

  return (
    <div>
      <h2>Analytics Overview</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        <StatsCard label="Total Revenue" value={formatUSDC(stats.totalRevenue)} />
        <StatsCard label="Transactions" value={String(stats.transactionCount)} />
        <StatsCard label="Unique Wallets" value={String(stats.uniqueWallets)} />
      </div>

      <h3>Per-Endpoint Breakdown</h3>
      <EndpointTable endpoints={endpointBreakdown} />

      <h3 style={{ marginTop: "2rem" }}>Revenue Over Time</h3>
      <RevenueChart data={chartData} />
    </div>
  );
}
