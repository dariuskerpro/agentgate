import React from "react";
import type { DayDataPoint } from "../lib/types.js";
import { formatUSDC } from "../lib/api.js";

export interface RevenueChartProps {
  data: DayDataPoint[];
}

/**
 * Placeholder chart — renders a simple bar list.
 * Will be replaced with Recharts in production.
 */
export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return <p>No revenue data to display.</p>;
  }
  const maxRevenue = Math.max(...data.map((d) => d.revenue));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {data.map((d) => (
        <div key={d.date} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", width: "5rem" }}>{d.date}</span>
          <div
            style={{
              height: "1rem",
              width: `${maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0}%`,
              backgroundColor: "#3b82f6",
              borderRadius: "0.25rem",
              minWidth: "2px",
            }}
          />
          <span style={{ fontSize: "0.75rem" }}>{formatUSDC(d.revenue)}</span>
        </div>
      ))}
    </div>
  );
}
