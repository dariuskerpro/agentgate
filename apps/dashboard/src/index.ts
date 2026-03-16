// Dashboard app — main exports for library use & testing
export { formatUSDC, aggregateStats, groupByEndpoint, groupByDay } from "./lib/api.js";
export type { Transaction, Stats, EndpointBreakdown, DayDataPoint } from "./lib/types.js";
export { StatsCard } from "./components/stats-card.js";
export { EndpointTable } from "./components/endpoint-table.js";
export { RevenueChart } from "./components/revenue-chart.js";
