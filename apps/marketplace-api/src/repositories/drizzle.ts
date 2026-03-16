/**
 * Factory function to create real Drizzle-backed repositories.
 */
import type { Database } from "../db/index.js";
import type { Repositories } from "./types.js";
import { DrizzleSellerRepository } from "./sellers.js";
import { DrizzleEndpointRepository } from "./endpoints.js";
import { DrizzleTransactionRepository } from "./transactions.js";

export function createDrizzleRepositories(db: Database): Repositories {
  return {
    sellers: new DrizzleSellerRepository(db),
    endpoints: new DrizzleEndpointRepository(db),
    transactions: new DrizzleTransactionRepository(db),
  };
}
