/**
 * Seller repository — real Drizzle ORM implementation.
 */
import { eq } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { schema } from "../db/index.js";
import type { Seller, SellerRepository } from "./types.js";

export class DrizzleSellerRepository implements SellerRepository {
  constructor(private db: Database) {}

  async findByApiKey(apiKey: string): Promise<Seller | null> {
    const rows = await this.db
      .select()
      .from(schema.sellers)
      .where(eq(schema.sellers.api_key, apiKey))
      .limit(1);
    return rows[0] ? this.toSeller(rows[0]) : null;
  }

  async findByWallet(wallet: string): Promise<Seller | null> {
    const rows = await this.db
      .select()
      .from(schema.sellers)
      .where(eq(schema.sellers.wallet_address, wallet))
      .limit(1);
    return rows[0] ? this.toSeller(rows[0]) : null;
  }

  async create(data: {
    wallet_address: string;
    display_name?: string;
    api_key: string;
  }): Promise<Seller> {
    const rows = await this.db
      .insert(schema.sellers)
      .values({
        wallet_address: data.wallet_address,
        display_name: data.display_name ?? null,
        api_key: data.api_key,
      })
      .returning();
    return this.toSeller(rows[0]);
  }

  private toSeller(row: typeof schema.sellers.$inferSelect): Seller {
    return {
      id: row.id,
      wallet_address: row.wallet_address,
      display_name: row.display_name,
      api_key: row.api_key,
      verified: row.verified ?? false,
      created_at: row.created_at ?? new Date(),
    };
  }
}
