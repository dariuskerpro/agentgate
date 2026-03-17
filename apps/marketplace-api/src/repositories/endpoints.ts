/**
 * Endpoint repository — real Drizzle ORM implementation.
 */
import { eq, and, like, sql, count, desc, asc } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { schema } from "../db/index.js";
import type {
  Endpoint,
  CategoryCount,
  ProviderRate,
  DiscoverQuery,
  EndpointRepository,
} from "./types.js";

export class DrizzleEndpointRepository implements EndpointRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Endpoint | null> {
    const rows = await this.db
      .select()
      .from(schema.endpoints)
      .where(eq(schema.endpoints.id, id))
      .limit(1);
    return rows[0] ? this.toEndpoint(rows[0]) : null;
  }

  async findBySeller(sellerId: string): Promise<Endpoint[]> {
    const rows = await this.db
      .select()
      .from(schema.endpoints)
      .where(
        and(
          eq(schema.endpoints.seller_id, sellerId),
          eq(schema.endpoints.active, true),
        ),
      );
    return rows.map((r) => this.toEndpoint(r));
  }

  async create(
    data: Omit<Endpoint, "id" | "created_at" | "active"> & {
      active?: boolean;
    },
  ): Promise<Endpoint> {
    const rows = await this.db
      .insert(schema.endpoints)
      .values({
        seller_id: data.seller_id,
        url: data.url,
        method: data.method,
        description: data.description,
        category: data.category,
        price_usdc: data.price_usdc,
        pricing_mode: data.pricing_mode,
        pricing_config: data.pricing_config,
        input_schema: data.input_schema,
        output_schema: data.output_schema,
        network: data.network,
        active: data.active ?? true,
      })
      .returning();
    return this.toEndpoint(rows[0]);
  }

  async update(
    id: string,
    data: Partial<Omit<Endpoint, "id" | "created_at" | "seller_id">>,
  ): Promise<Endpoint | null> {
    // Filter out undefined values
    const values: Record<string, unknown> = {};
    if (data.url !== undefined) values.url = data.url;
    if (data.method !== undefined) values.method = data.method;
    if (data.description !== undefined) values.description = data.description;
    if (data.category !== undefined) values.category = data.category;
    if (data.price_usdc !== undefined) values.price_usdc = data.price_usdc;
    if (data.input_schema !== undefined)
      values.input_schema = data.input_schema;
    if (data.output_schema !== undefined)
      values.output_schema = data.output_schema;
    if (data.network !== undefined) values.network = data.network;
    if (data.active !== undefined) values.active = data.active;
    if (data.pricing_mode !== undefined)
      values.pricing_mode = data.pricing_mode;
    if (data.pricing_config !== undefined)
      values.pricing_config = data.pricing_config;

    if (Object.keys(values).length === 0) {
      return this.findById(id);
    }

    const rows = await this.db
      .update(schema.endpoints)
      .set(values)
      .where(eq(schema.endpoints.id, id))
      .returning();
    return rows[0] ? this.toEndpoint(rows[0]) : null;
  }

  async deactivate(id: string): Promise<Endpoint | null> {
    return this.update(id, { active: false });
  }

  async discover(
    query: DiscoverQuery,
  ): Promise<{ endpoints: Endpoint[]; total: number }> {
    const conditions = [eq(schema.endpoints.active, true)];

    if (query.category) {
      conditions.push(eq(schema.endpoints.category, query.category));
    }
    if (query.q) {
      conditions.push(
        sql`(${schema.endpoints.description} ILIKE ${`%${query.q}%`} OR ${schema.endpoints.url} ILIKE ${`%${query.q}%`})`,
      );
    }

    const where = and(...conditions);

    // Count total
    const countResult = await this.db
      .select({ value: count() })
      .from(schema.endpoints)
      .where(where);
    const total = countResult[0]?.value ?? 0;

    // Build ordered query
    let orderBy;
    if (query.sort === "price") {
      orderBy = asc(schema.endpoints.price_usdc);
    } else if (query.sort === "newest") {
      orderBy = desc(schema.endpoints.created_at);
    } else {
      orderBy = desc(schema.endpoints.created_at); // default: newest
    }

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const rows = await this.db
      .select()
      .from(schema.endpoints)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return {
      endpoints: rows.map((r) => this.toEndpoint(r)),
      total,
    };
  }

  async getCategories(): Promise<CategoryCount[]> {
    const rows = await this.db
      .select({
        category: schema.endpoints.category,
        count: count(),
      })
      .from(schema.endpoints)
      .where(eq(schema.endpoints.active, true))
      .groupBy(schema.endpoints.category);

    return rows.map((r) => ({
      category: r.category,
      count: r.count,
    }));
  }

  async getProviderRates(): Promise<ProviderRate[]> {
    const rows = await this.db
      .select()
      .from(schema.providerRates)
      .orderBy(schema.providerRates.provider);
    return rows.map((r) => ({
      id: r.id,
      provider: r.provider,
      model: r.model,
      input_rate_per_1k: r.input_rate_per_1k,
      output_rate_per_1k: r.output_rate_per_1k,
      unit: r.unit,
      updated_at: r.updated_at,
    }));
  }

  private toEndpoint(row: typeof schema.endpoints.$inferSelect): Endpoint {
    return {
      id: row.id,
      seller_id: row.seller_id!,
      url: row.url,
      method: row.method ?? "GET",
      description: row.description,
      category: row.category,
      price_usdc: row.price_usdc,
      pricing_mode: row.pricing_mode ?? "flat",
      pricing_config: row.pricing_config,
      input_schema: row.input_schema,
      output_schema: row.output_schema,
      network: row.network ?? "eip155:8453",
      active: row.active ?? true,
      created_at: row.created_at ?? new Date(),
    };
  }
}
