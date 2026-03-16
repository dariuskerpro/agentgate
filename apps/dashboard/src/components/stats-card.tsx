import React from "react";

export interface StatsCardProps {
  label: string;
  value: string;
}

export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="stats-card" style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }}>
      <p className="stats-label" style={{ fontSize: "0.875rem", color: "#64748b" }}>
        {label}
      </p>
      <p className="stats-value" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
        {value}
      </p>
    </div>
  );
}
