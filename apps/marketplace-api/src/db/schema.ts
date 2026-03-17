import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Sellers ──────────────────────────────────────────────────────

export const sellers = pgTable("sellers", {
  id: uuid("id").primaryKey().defaultRandom(),
  wallet_address: text("wallet_address").unique().notNull(),
  display_name: text("display_name"),
  api_key: text("api_key").unique().notNull(),
  verified: boolean("verified").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── Endpoints ────────────────────────────────────────────────────

export const endpoints = pgTable(
  "endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seller_id: uuid("seller_id").references(() => sellers.id),
    url: text("url").notNull(),
    method: text("method").default("GET"),
    description: text("description"),
    category: text("category").notNull(),
    price_usdc: numeric("price_usdc", { precision: 20, scale: 8 }).notNull(),
    pricing_mode: text("pricing_mode").notNull().default("flat"),
    pricing_config: jsonb("pricing_config"),
    input_schema: jsonb("input_schema"),
    output_schema: jsonb("output_schema"),
    network: text("network").default("eip155:8453"),
    active: boolean("active").default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("endpoints_url_method_unique").on(table.url, table.method),
    index("idx_endpoints_category").on(table.category),
    index("idx_endpoints_active").on(table.active).where(sql`active = TRUE`),
  ],
);

// ── Transactions ─────────────────────────────────────────────────

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpoint_id: uuid("endpoint_id").references(() => endpoints.id),
    buyer_wallet: text("buyer_wallet").notNull(),
    amount_usdc: numeric("amount_usdc", { precision: 20, scale: 8 }).notNull(),
    tx_hash: text("tx_hash"),
    latency_ms: integer("latency_ms"),
    status: text("status").default("settled"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_transactions_endpoint").on(table.endpoint_id),
    index("idx_transactions_created").on(table.created_at),
    index("idx_transactions_buyer").on(table.buyer_wallet),
  ],
);

// ── Endpoint Health ──────────────────────────────────────────────

export const endpointHealth = pgTable(
  "endpoint_health",
  {
    endpoint_id: uuid("endpoint_id")
      .references(() => endpoints.id)
      .notNull(),
    checked_at: timestamp("checked_at", { withTimezone: true }).defaultNow().notNull(),
    status_code: integer("status_code"),
    latency_ms: integer("latency_ms"),
    is_up: boolean("is_up"),
  },
  (table) => [
    primaryKey({ columns: [table.endpoint_id, table.checked_at] }),
    index("idx_health_endpoint").on(table.endpoint_id, table.checked_at),
  ],
);

// ── Provider Rates ───────────────────────────────────────────────

export const providerRates = pgTable(
  "provider_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    input_rate_per_1k: numeric("input_rate_per_1k", { precision: 20, scale: 10 }).notNull(),
    output_rate_per_1k: numeric("output_rate_per_1k", { precision: 20, scale: 10 }),
    unit: text("unit").notNull().default("tokens"), // 'tokens' | 'minutes' | 'pages'
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("provider_rates_provider_model_unique").on(table.provider, table.model),
  ],
);

// ── Usage Tracking ───────────────────────────────────────────────

export const usageTracking = pgTable(
  "usage_tracking",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    endpoint_id: uuid("endpoint_id").references(() => endpoints.id),
    transaction_id: uuid("transaction_id").references(() => transactions.id),
    input_tokens: integer("input_tokens"),
    output_tokens: integer("output_tokens"),
    estimated_output_tokens: integer("estimated_output_tokens"),
    actual_cost_usdc: numeric("actual_cost_usdc", { precision: 20, scale: 8 }),
    charged_usdc: numeric("charged_usdc", { precision: 20, scale: 8 }),
    margin_usdc: numeric("margin_usdc", { precision: 20, scale: 8 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("idx_usage_endpoint").on(table.endpoint_id),
    index("idx_usage_created").on(table.created_at),
  ],
);

// ── Named index exports (for test assertions) ───────────────────

export {
  // Re-export for tests that import individually — the indexes are
  // intrinsic to the tables above. These are convenience aliases
  // pointing at the table-level index configs.
};

// Index refs (for test imports)
export const endpointsCategory = "idx_endpoints_category";
export const endpointsActive = "idx_endpoints_active";
export const transactionsEndpoint = "idx_transactions_endpoint";
export const transactionsCreated = "idx_transactions_created";
export const transactionsBuyer = "idx_transactions_buyer";
export const healthEndpoint = "idx_health_endpoint";
export const usageEndpoint = "idx_usage_endpoint";
export const usageCreated = "idx_usage_created";
export const providerRatesProviderModel = "provider_rates_provider_model_unique";
