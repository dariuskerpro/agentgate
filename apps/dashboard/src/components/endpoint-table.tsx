import React from "react";
import type { EndpointBreakdown } from "../lib/types.js";
import { formatUSDC } from "../lib/api.js";

export interface EndpointTableProps {
  endpoints: EndpointBreakdown[];
}

export function EndpointTable({ endpoints }: EndpointTableProps) {
  if (endpoints.length === 0) {
    return <p>No endpoint data available.</p>;
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "0.5rem" }}>Endpoint</th>
          <th style={{ textAlign: "right", padding: "0.5rem" }}>Revenue</th>
          <th style={{ textAlign: "right", padding: "0.5rem" }}>Transactions</th>
        </tr>
      </thead>
      <tbody>
        {endpoints.map((ep) => (
          <tr key={ep.endpoint_id}>
            <td style={{ padding: "0.5rem" }}>{ep.endpoint_id}</td>
            <td style={{ textAlign: "right", padding: "0.5rem" }}>{formatUSDC(ep.revenue)}</td>
            <td style={{ textAlign: "right", padding: "0.5rem" }}>{ep.transactionCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
