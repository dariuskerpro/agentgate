/**
 * Integration tests — real Drizzle repositories against PostgreSQL.
 * Skipped when DATABASE_URL is not set.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import { createDb, type Database } from "../db/index.js";
import { schema } from "../db/index.js";
import { DrizzleSellerRepository } from "../repositories/sellers.js";
import { DrizzleEndpointRepository } from "../repositories/endpoints.js";
import { DrizzleTransactionRepository } from "../repositories/transactions.js";
import { DrizzleHealthRepository } from "../repositories/health.js";
import { createDrizzleRepositories } from "../repositories/drizzle.js";
import type postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)("Integration: Drizzle Repositories", () => {
  let db: Database;
  let client: postgres.Sql;
  let sellers: DrizzleSellerRepository;
  let endpoints: DrizzleEndpointRepository;
  let transactions: DrizzleTransactionRepository;
  let health: DrizzleHealthRepository;

  beforeAll(async () => {
    const conn = createDb(DATABASE_URL!);
    db = conn.db;
    client = conn.client;

    // Push schema to DB (create tables if not exist)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sellers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address TEXT UNIQUE NOT NULL,
        display_name TEXT,
        api_key TEXT UNIQUE NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS endpoints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        seller_id UUID REFERENCES sellers(id),
        url TEXT NOT NULL,
        method TEXT DEFAULT 'GET',
        description TEXT,
        category TEXT NOT NULL,
        price_usdc NUMERIC(20,8) NOT NULL,
        input_schema JSONB,
        output_schema JSONB,
        network TEXT DEFAULT 'eip155:8453',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(url, method)
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        endpoint_id UUID REFERENCES endpoints(id),
        buyer_wallet TEXT NOT NULL,
        amount_usdc NUMERIC(20,8) NOT NULL,
        tx_hash TEXT,
        latency_ms INTEGER,
        status TEXT DEFAULT 'settled',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS endpoint_health (
        endpoint_id UUID REFERENCES endpoints(id) NOT NULL,
        checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        status_code INTEGER,
        latency_ms INTEGER,
        is_up BOOLEAN,
        PRIMARY KEY (endpoint_id, checked_at)
      )
    `);

    sellers = new DrizzleSellerRepository(db);
    endpoints = new DrizzleEndpointRepository(db);
    transactions = new DrizzleTransactionRepository(db);
    health = new DrizzleHealthRepository(db);
  });

  afterAll(async () => {
    // Clean up tables
    await db.execute(sql`TRUNCATE endpoint_health, transactions, endpoints, sellers CASCADE`);
    await client.end();
  });

  beforeEach(async () => {
    // Clean between tests
    await db.execute(sql`TRUNCATE endpoint_health, transactions, endpoints, sellers CASCADE`);
  });

  // ── Sellers ────────────────────────────────────────────────

  it("creates and finds a seller by API key", async () => {
    const seller = await sellers.create({
      wallet_address: "0xABC123",
      display_name: "Test Seller",
      api_key: "ag_test_key_1",
    });

    expect(seller.id).toBeDefined();
    expect(seller.wallet_address).toBe("0xABC123");
    expect(seller.display_name).toBe("Test Seller");
    expect(seller.api_key).toBe("ag_test_key_1");
    expect(seller.verified).toBe(false);

    const found = await sellers.findByApiKey("ag_test_key_1");
    expect(found).not.toBeNull();
    expect(found!.id).toBe(seller.id);
  });

  it("finds a seller by wallet address", async () => {
    await sellers.create({
      wallet_address: "0xDEF456",
      api_key: "ag_test_key_2",
    });

    const found = await sellers.findByWallet("0xDEF456");
    expect(found).not.toBeNull();
    expect(found!.wallet_address).toBe("0xDEF456");

    const notFound = await sellers.findByWallet("0xNONEXISTENT");
    expect(notFound).toBeNull();
  });

  // ── Endpoints ──────────────────────────────────────────────

  it("creates and finds endpoints", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER1",
      api_key: "ag_ep_test_1",
    });

    const ep = await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/data",
      method: "GET",
      description: "Test endpoint",
      category: "data",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });

    expect(ep.id).toBeDefined();
    expect(ep.active).toBe(true);

    const found = await endpoints.findById(ep.id);
    expect(found).not.toBeNull();
    expect(found!.url).toBe("https://api.example.com/data");
  });

  it("finds endpoints by seller", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER2",
      api_key: "ag_ep_test_2",
    });

    await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/a",
      method: "GET",
      description: "Endpoint A",
      category: "data",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });
    await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/b",
      method: "GET",
      description: "Endpoint B",
      category: "ai",
      price_usdc: "0.05",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });

    const found = await endpoints.findBySeller(seller.id);
    expect(found).toHaveLength(2);
  });

  it("updates and deactivates endpoints", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER3",
      api_key: "ag_ep_test_3",
    });

    const ep = await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/update",
      method: "POST",
      description: "To update",
      category: "data",
      price_usdc: "1.00",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });

    const updated = await endpoints.update(ep.id, {
      description: "Updated description",
      price_usdc: "2.50",
    });
    expect(updated).not.toBeNull();
    expect(updated!.description).toBe("Updated description");
    expect(updated!.price_usdc).toBe("2.50000000");

    const deactivated = await endpoints.deactivate(ep.id);
    expect(deactivated).not.toBeNull();
    expect(deactivated!.active).toBe(false);
  });

  it("discover returns active endpoints with filtering", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER4",
      api_key: "ag_discover_1",
    });

    await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/ai-1",
      method: "POST",
      description: "AI image generation",
      category: "ai",
      price_usdc: "0.10",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });
    await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/data-1",
      method: "GET",
      description: "Market data feed",
      category: "data",
      price_usdc: "0.02",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });
    // Inactive endpoint — should not appear
    await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/old",
      method: "GET",
      description: "Old endpoint",
      category: "ai",
      price_usdc: "0.50",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
      active: false,
    });

    // All active
    const all = await endpoints.discover({});
    expect(all.total).toBe(2);
    expect(all.endpoints).toHaveLength(2);

    // Filter by category
    const aiOnly = await endpoints.discover({ category: "ai" });
    expect(aiOnly.total).toBe(1);
    expect(aiOnly.endpoints[0].category).toBe("ai");

    // Search by text
    const search = await endpoints.discover({ q: "image" });
    expect(search.total).toBe(1);
    expect(search.endpoints[0].description).toContain("image");
  });

  it("getCategories returns correct counts", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER5",
      api_key: "ag_cat_1",
    });

    await endpoints.create({
      seller_id: seller.id,
      url: "https://a.com/1",
      method: "GET",
      description: null,
      category: "ai",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });
    await endpoints.create({
      seller_id: seller.id,
      url: "https://a.com/2",
      method: "GET",
      description: null,
      category: "ai",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });
    await endpoints.create({
      seller_id: seller.id,
      url: "https://a.com/3",
      method: "GET",
      description: null,
      category: "data",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });

    const categories = await endpoints.getCategories();
    expect(categories).toHaveLength(2);
    const ai = categories.find((c) => c.category === "ai");
    const data = categories.find((c) => c.category === "data");
    expect(ai!.count).toBe(2);
    expect(data!.count).toBe(1);
  });

  // ── Transactions ───────────────────────────────────────────

  it("creates a transaction", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER6",
      api_key: "ag_tx_1",
    });
    const ep = await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/tx-test",
      method: "GET",
      description: null,
      category: "data",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });

    const tx = await transactions.create({
      endpoint_id: ep.id,
      buyer_wallet: "0xBUYER1",
      amount_usdc: "0.01",
      tx_hash: "0xHASH123",
      latency_ms: 150,
    });

    expect(tx.id).toBeDefined();
    expect(tx.status).toBe("settled");
    expect(tx.buyer_wallet).toBe("0xBUYER1");
  });

  // ── Health ─────────────────────────────────────────────────

  it("records and retrieves health checks", async () => {
    const seller = await sellers.create({
      wallet_address: "0xSELLER7",
      api_key: "ag_health_1",
    });
    const ep = await endpoints.create({
      seller_id: seller.id,
      url: "https://api.example.com/health-test",
      method: "GET",
      description: null,
      category: "data",
      price_usdc: "0.01",
      input_schema: null,
      output_schema: null,
      network: "eip155:8453",
    });

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
    const tenMinAgo = new Date(now.getTime() - 10 * 60_000);

    await health.record({
      endpoint_id: ep.id,
      checked_at: tenMinAgo,
      status_code: 200,
      latency_ms: 100,
      is_up: true,
    });
    await health.record({
      endpoint_id: ep.id,
      checked_at: fiveMinAgo,
      status_code: 500,
      latency_ms: 2000,
      is_up: false,
    });
    await health.record({
      endpoint_id: ep.id,
      checked_at: now,
      status_code: 200,
      latency_ms: 80,
      is_up: true,
    });

    const all = await health.findByEndpoint(ep.id);
    expect(all).toHaveLength(3);
    // Ordered newest first
    expect(all[0].latency_ms).toBe(80);

    const recent = await health.findRecentByEndpoint(
      ep.id,
      new Date(now.getTime() - 6 * 60_000),
    );
    expect(recent).toHaveLength(2);
  });

  // ── Factory ────────────────────────────────────────────────

  it("createDrizzleRepositories returns all repos", () => {
    const repos = createDrizzleRepositories(db);
    expect(repos.sellers).toBeInstanceOf(DrizzleSellerRepository);
    expect(repos.endpoints).toBeInstanceOf(DrizzleEndpointRepository);
    expect(repos.transactions).toBeInstanceOf(DrizzleTransactionRepository);
  });
});
