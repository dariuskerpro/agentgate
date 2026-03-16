/**
 * Transaction repository — real Drizzle ORM implementation.
 */
import type { Database } from "../db/index.js";
import { schema } from "../db/index.js";
import type { Transaction, TransactionRepository } from "./types.js";

export class DrizzleTransactionRepository implements TransactionRepository {
  constructor(private db: Database) {}

  async create(
    data: Omit<Transaction, "id" | "created_at" | "status"> & {
      status?: string;
    },
  ): Promise<Transaction> {
    const rows = await this.db
      .insert(schema.transactions)
      .values({
        endpoint_id: data.endpoint_id,
        buyer_wallet: data.buyer_wallet,
        amount_usdc: data.amount_usdc,
        tx_hash: data.tx_hash,
        latency_ms: data.latency_ms,
        status: data.status ?? "settled",
      })
      .returning();
    return this.toTransaction(rows[0]);
  }

  private toTransaction(
    row: typeof schema.transactions.$inferSelect,
  ): Transaction {
    return {
      id: row.id,
      endpoint_id: row.endpoint_id!,
      buyer_wallet: row.buyer_wallet,
      amount_usdc: row.amount_usdc,
      tx_hash: row.tx_hash,
      latency_ms: row.latency_ms,
      status: row.status ?? "settled",
      created_at: row.created_at ?? new Date(),
    };
  }
}
