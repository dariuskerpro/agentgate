import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { formatUSDC, aggregateStats, groupByEndpoint, groupByDay } from "../lib/api.js";
import { StatsCard } from "../components/stats-card.js";
import type { Transaction } from "../lib/types.js";

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    endpoint_id: "ep-1",
    buyer_wallet: "0xBuyer1",
    amount_usdc: 0.001,
    tx_hash: "0xhash",
    latency_ms: 100,
    status: "settled",
    created_at: "2026-03-14T10:00:00Z",
    ...overrides,
  };
}

// --- formatUSDC ---
describe("formatUSDC", () => {
  it("formats a positive number as $X.XX", () => {
    expect(formatUSDC(1.5)).toBe("$1.50");
    expect(formatUSDC(0.001)).toBe("$0.00");
    expect(formatUSDC(123.456)).toBe("$123.46");
  });

  it("formats zero as $0.00", () => {
    expect(formatUSDC(0)).toBe("$0.00");
  });
});

// --- aggregateStats ---
describe("aggregateStats", () => {
  it("computes total revenue, tx count, unique wallets", () => {
    const txs = [
      makeTx({ amount_usdc: 0.01, buyer_wallet: "0xA" }),
      makeTx({ amount_usdc: 0.02, buyer_wallet: "0xB" }),
      makeTx({ amount_usdc: 0.03, buyer_wallet: "0xA" }),
    ];
    const stats = aggregateStats(txs);
    expect(stats.totalRevenue).toBeCloseTo(0.06);
    expect(stats.transactionCount).toBe(3);
    expect(stats.uniqueWallets).toBe(2);
  });

  it("returns zeros for empty array", () => {
    const stats = aggregateStats([]);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.transactionCount).toBe(0);
    expect(stats.uniqueWallets).toBe(0);
  });
});

// --- groupByEndpoint ---
describe("groupByEndpoint", () => {
  it("groups transactions by endpoint_id with sums", () => {
    const txs = [
      makeTx({ endpoint_id: "ep-a", amount_usdc: 0.01 }),
      makeTx({ endpoint_id: "ep-a", amount_usdc: 0.02 }),
      makeTx({ endpoint_id: "ep-b", amount_usdc: 0.05 }),
    ];
    const result = groupByEndpoint(txs);
    expect(result).toHaveLength(2);
    const epA = result.find((r) => r.endpoint_id === "ep-a");
    const epB = result.find((r) => r.endpoint_id === "ep-b");
    expect(epA?.revenue).toBeCloseTo(0.03);
    expect(epA?.transactionCount).toBe(2);
    expect(epB?.revenue).toBeCloseTo(0.05);
    expect(epB?.transactionCount).toBe(1);
  });

  it("returns empty array for no transactions", () => {
    expect(groupByEndpoint([])).toEqual([]);
  });
});

// --- groupByDay ---
describe("groupByDay", () => {
  it("groups transactions by date for chart data", () => {
    const txs = [
      makeTx({ created_at: "2026-03-14T10:00:00Z", amount_usdc: 0.01 }),
      makeTx({ created_at: "2026-03-14T15:00:00Z", amount_usdc: 0.02 }),
      makeTx({ created_at: "2026-03-15T09:00:00Z", amount_usdc: 0.05 }),
    ];
    const result = groupByDay(txs);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-03-14");
    expect(result[0].revenue).toBeCloseTo(0.03);
    expect(result[0].transactionCount).toBe(2);
    expect(result[1].date).toBe("2026-03-15");
    expect(result[1].revenue).toBeCloseTo(0.05);
  });

  it("returns empty array for no transactions", () => {
    expect(groupByDay([])).toEqual([]);
  });

  it("returns results sorted by date", () => {
    const txs = [
      makeTx({ created_at: "2026-03-16T10:00:00Z" }),
      makeTx({ created_at: "2026-03-14T10:00:00Z" }),
      makeTx({ created_at: "2026-03-15T10:00:00Z" }),
    ];
    const result = groupByDay(txs);
    expect(result.map((r) => r.date)).toEqual([
      "2026-03-14",
      "2026-03-15",
      "2026-03-16",
    ]);
  });
});

// --- StatsCard component ---
describe("StatsCard", () => {
  it("renders label and value", () => {
    render(<StatsCard label="Total Revenue" value="$1.50" />);
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$1.50")).toBeInTheDocument();
  });
});
