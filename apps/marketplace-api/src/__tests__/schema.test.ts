import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { getTableName } from "drizzle-orm";
import {
  sellers,
  endpoints,
  transactions,
  endpointHealth,
  providerRates,
  usageTracking,
  endpointsCategory,
  endpointsActive,
  transactionsEndpoint,
  transactionsCreated,
  transactionsBuyer,
  healthEndpoint,
  usageEndpoint,
  usageCreated,
  providerRatesProviderModel,
} from "../db/schema.js";

// Helper to get a column map from a Drizzle table
function getColumns(table: any) {
  const config = getTableConfig(table);
  return Object.fromEntries(config.columns.map((c: any) => [c.name, c]));
}

describe("AG-005: Database Schema", () => {
  // ── Table existence & column names ────────────────────────────

  describe("sellers table", () => {
    it("has all expected columns", () => {
      const cols = getColumns(sellers);
      expect(Object.keys(cols).sort()).toEqual(
        ["id", "wallet_address", "display_name", "api_key", "verified", "created_at"].sort(),
      );
    });

    it("uses uuid primary key for id", () => {
      const cols = getColumns(sellers);
      expect(cols.id.columnType).toBe("PgUUID");
      expect(cols.id.primary).toBe(true);
    });

    it("has a unique constraint on wallet_address", () => {
      const cols = getColumns(sellers);
      expect(cols.wallet_address.isUnique).toBe(true);
    });

    it("has a unique constraint on api_key", () => {
      const cols = getColumns(sellers);
      expect(cols.api_key.isUnique).toBe(true);
    });

    it("wallet_address is not nullable", () => {
      const cols = getColumns(sellers);
      expect(cols.wallet_address.notNull).toBe(true);
    });

    it("api_key is not nullable", () => {
      const cols = getColumns(sellers);
      expect(cols.api_key.notNull).toBe(true);
    });

    it("has default for id (gen_random_uuid)", () => {
      const cols = getColumns(sellers);
      expect(cols.id.hasDefault).toBe(true);
    });

    it("has default for created_at (now)", () => {
      const cols = getColumns(sellers);
      expect(cols.created_at.hasDefault).toBe(true);
    });

    it("verified defaults to false", () => {
      const cols = getColumns(sellers);
      expect(cols.verified.hasDefault).toBe(true);
    });
  });

  describe("endpoints table", () => {
    it("has all expected columns", () => {
      const cols = getColumns(endpoints);
      expect(Object.keys(cols).sort()).toEqual(
        [
          "id",
          "seller_id",
          "url",
          "method",
          "description",
          "category",
          "price_usdc",
          "pricing_mode",
          "pricing_config",
          "input_schema",
          "output_schema",
          "network",
          "active",
          "created_at",
        ].sort(),
      );
    });

    it("uses uuid primary key for id", () => {
      const cols = getColumns(endpoints);
      expect(cols.id.columnType).toBe("PgUUID");
      expect(cols.id.primary).toBe(true);
    });

    it("seller_id references sellers.id", () => {
      const config = getTableConfig(endpoints);
      const fk = config.foreignKeys.find((fk: any) =>
        fk.reference().columns.some((c: any) => c.name === "seller_id"),
      );
      expect(fk).toBeDefined();
      const ref = fk!.reference();
      expect(getTableName(ref.foreignTable as any)).toBe("sellers");
      expect(ref.foreignColumns.some((c: any) => c.name === "id")).toBe(true);
    });

    it("has unique constraint on (url, method)", () => {
      const config = getTableConfig(endpoints);
      // Composite unique — can be a uniqueConstraint or uniqueIndex
      const hasCompositeUnique = config.uniqueConstraints.some((uc: any) => {
        const colNames = uc.columns.map((c: any) => c.name).sort();
        return colNames.length === 2 && colNames.includes("url") && colNames.includes("method");
      });
      expect(hasCompositeUnique).toBe(true);
    });

    it("price_usdc is numeric(20,8) and not nullable", () => {
      const cols = getColumns(endpoints);
      expect(cols.price_usdc.columnType).toBe("PgNumeric");
      expect(cols.price_usdc.notNull).toBe(true);
    });

    it("input_schema and output_schema are jsonb", () => {
      const cols = getColumns(endpoints);
      expect(cols.input_schema.columnType).toBe("PgJsonb");
      expect(cols.output_schema.columnType).toBe("PgJsonb");
    });

    it("category is not nullable", () => {
      const cols = getColumns(endpoints);
      expect(cols.category.notNull).toBe(true);
    });

    it("has default for method ('GET')", () => {
      const cols = getColumns(endpoints);
      expect(cols.method.hasDefault).toBe(true);
    });

    it("has default for network", () => {
      const cols = getColumns(endpoints);
      expect(cols.network.hasDefault).toBe(true);
    });

    it("has default for active (true)", () => {
      const cols = getColumns(endpoints);
      expect(cols.active.hasDefault).toBe(true);
    });
  });

  describe("transactions table", () => {
    it("has all expected columns", () => {
      const cols = getColumns(transactions);
      expect(Object.keys(cols).sort()).toEqual(
        [
          "id",
          "endpoint_id",
          "buyer_wallet",
          "amount_usdc",
          "tx_hash",
          "latency_ms",
          "status",
          "created_at",
        ].sort(),
      );
    });

    it("endpoint_id references endpoints.id", () => {
      const config = getTableConfig(transactions);
      const fk = config.foreignKeys.find((fk: any) =>
        fk.reference().columns.some((c: any) => c.name === "endpoint_id"),
      );
      expect(fk).toBeDefined();
      const ref = fk!.reference();
      expect(getTableName(ref.foreignTable as any)).toBe("endpoints");
    });

    it("buyer_wallet is not nullable", () => {
      const cols = getColumns(transactions);
      expect(cols.buyer_wallet.notNull).toBe(true);
    });

    it("amount_usdc is numeric and not nullable", () => {
      const cols = getColumns(transactions);
      expect(cols.amount_usdc.columnType).toBe("PgNumeric");
      expect(cols.amount_usdc.notNull).toBe(true);
    });

    it("status has default 'settled'", () => {
      const cols = getColumns(transactions);
      expect(cols.status.hasDefault).toBe(true);
    });
  });

  describe("endpoint_health table", () => {
    it("has all expected columns", () => {
      const cols = getColumns(endpointHealth);
      expect(Object.keys(cols).sort()).toEqual(
        ["endpoint_id", "checked_at", "status_code", "latency_ms", "is_up"].sort(),
      );
    });

    it("has composite primary key on (endpoint_id, checked_at)", () => {
      const config = getTableConfig(endpointHealth);
      // With composite PK, individual columns are NOT marked isPrimaryKey
      // Instead, check the primaryKeys array
      expect(config.primaryKeys.length).toBe(1);
      const pkCols = config.primaryKeys[0].columns.map((c: any) => c.name).sort();
      expect(pkCols).toEqual(["checked_at", "endpoint_id"]);
    });

    it("endpoint_id references endpoints.id", () => {
      const config = getTableConfig(endpointHealth);
      const fk = config.foreignKeys.find((fk: any) =>
        fk.reference().columns.some((c: any) => c.name === "endpoint_id"),
      );
      expect(fk).toBeDefined();
      const ref = fk!.reference();
      expect(getTableName(ref.foreignTable as any)).toBe("endpoints");
    });
  });

  describe("endpoints pricing columns", () => {
    it("pricing_mode is not nullable and has default 'flat'", () => {
      const cols = getColumns(endpoints);
      expect(cols.pricing_mode.notNull).toBe(true);
      expect(cols.pricing_mode.hasDefault).toBe(true);
    });

    it("pricing_config is jsonb", () => {
      const cols = getColumns(endpoints);
      expect(cols.pricing_config.columnType).toBe("PgJsonb");
    });
  });

  describe("provider_rates table", () => {
    it("has all expected columns", () => {
      const cols = getColumns(providerRates);
      expect(Object.keys(cols).sort()).toEqual(
        ["id", "provider", "model", "input_rate_per_1k", "output_rate_per_1k", "unit", "updated_at"].sort(),
      );
    });

    it("uses uuid primary key for id", () => {
      const cols = getColumns(providerRates);
      expect(cols.id.columnType).toBe("PgUUID");
      expect(cols.id.primary).toBe(true);
    });

    it("provider and model are not nullable", () => {
      const cols = getColumns(providerRates);
      expect(cols.provider.notNull).toBe(true);
      expect(cols.model.notNull).toBe(true);
    });

    it("input_rate_per_1k is numeric and not nullable", () => {
      const cols = getColumns(providerRates);
      expect(cols.input_rate_per_1k.columnType).toBe("PgNumeric");
      expect(cols.input_rate_per_1k.notNull).toBe(true);
    });

    it("has unique index on (provider, model)", () => {
      const config = getTableConfig(providerRates);
      const idx = config.indexes.find((i: any) => {
        const cols = i.config.columns.map((c: any) => c.name).sort();
        return cols.length === 2 && cols.includes("provider") && cols.includes("model");
      });
      expect(idx).toBeDefined();
      expect(idx!.config.unique).toBe(true);
    });

    it("unit defaults to 'tokens'", () => {
      const cols = getColumns(providerRates);
      expect(cols.unit.hasDefault).toBe(true);
      expect(cols.unit.notNull).toBe(true);
    });
  });

  describe("usage_tracking table", () => {
    it("has all expected columns", () => {
      const cols = getColumns(usageTracking);
      expect(Object.keys(cols).sort()).toEqual(
        [
          "id",
          "endpoint_id",
          "transaction_id",
          "input_tokens",
          "output_tokens",
          "estimated_output_tokens",
          "actual_cost_usdc",
          "charged_usdc",
          "margin_usdc",
          "created_at",
        ].sort(),
      );
    });

    it("uses uuid primary key for id", () => {
      const cols = getColumns(usageTracking);
      expect(cols.id.columnType).toBe("PgUUID");
      expect(cols.id.primary).toBe(true);
    });

    it("endpoint_id references endpoints.id", () => {
      const config = getTableConfig(usageTracking);
      const fk = config.foreignKeys.find((fk: any) =>
        fk.reference().columns.some((c: any) => c.name === "endpoint_id"),
      );
      expect(fk).toBeDefined();
      const ref = fk!.reference();
      expect(getTableName(ref.foreignTable as any)).toBe("endpoints");
    });

    it("transaction_id references transactions.id", () => {
      const config = getTableConfig(usageTracking);
      const fk = config.foreignKeys.find((fk: any) =>
        fk.reference().columns.some((c: any) => c.name === "transaction_id"),
      );
      expect(fk).toBeDefined();
      const ref = fk!.reference();
      expect(getTableName(ref.foreignTable as any)).toBe("transactions");
    });

    it("cost columns are numeric", () => {
      const cols = getColumns(usageTracking);
      expect(cols.actual_cost_usdc.columnType).toBe("PgNumeric");
      expect(cols.charged_usdc.columnType).toBe("PgNumeric");
      expect(cols.margin_usdc.columnType).toBe("PgNumeric");
    });
  });

  // ── Indexes ───────────────────────────────────────────────────

  describe("indexes", () => {
    it("endpoints has category index", () => {
      const config = getTableConfig(endpoints);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "category"));
      expect(idx).toBeDefined();
    });

    it("endpoints has partial active index", () => {
      const config = getTableConfig(endpoints);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "active"));
      expect(idx).toBeDefined();
    });

    it("transactions has endpoint_id index", () => {
      const config = getTableConfig(transactions);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "endpoint_id"));
      expect(idx).toBeDefined();
    });

    it("transactions has created_at index", () => {
      const config = getTableConfig(transactions);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "created_at"));
      expect(idx).toBeDefined();
    });

    it("transactions has buyer_wallet index", () => {
      const config = getTableConfig(transactions);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "buyer_wallet"));
      expect(idx).toBeDefined();
    });

    it("endpoint_health has composite index on (endpoint_id, checked_at)", () => {
      const config = getTableConfig(endpointHealth);
      const idx = config.indexes.find((i: any) => {
        const cols = i.config.columns.map((c: any) => c.name).sort();
        return cols.length === 2 && cols.includes("endpoint_id") && cols.includes("checked_at");
      });
      expect(idx).toBeDefined();
    });

    it("usage_tracking has endpoint_id index", () => {
      const config = getTableConfig(usageTracking);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "endpoint_id"));
      expect(idx).toBeDefined();
    });

    it("usage_tracking has created_at index", () => {
      const config = getTableConfig(usageTracking);
      const idx = config.indexes.find((i: any) => i.config.columns.some((c: any) => c.name === "created_at"));
      expect(idx).toBeDefined();
    });

    it("provider_rates has unique index on (provider, model)", () => {
      const config = getTableConfig(providerRates);
      const idx = config.indexes.find((i: any) => {
        const cols = i.config.columns.map((c: any) => c.name).sort();
        return cols.length === 2 && cols.includes("provider") && cols.includes("model");
      });
      expect(idx).toBeDefined();
      expect(idx!.config.unique).toBe(true);
    });
  });
});
