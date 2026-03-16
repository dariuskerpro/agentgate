import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dns from "node:dns";
import * as schema from "./schema.js";

// Force IPv4 DNS resolution — Railway has IPv6 egress issues with some providers
dns.setDefaultResultOrder("ipv4first");

export { schema };
export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Create a Drizzle database instance from a connection string.
 * Handles connection errors gracefully by throwing a descriptive error.
 */
export function createDb(connectionString: string): {
  db: Database;
  client: postgres.Sql;
} {
  if (!connectionString) {
    throw new Error(
      "Database connection string is required. Set DATABASE_URL in your environment.",
    );
  }

  try {
    const isPgBouncer = connectionString.includes("pooler.supabase.com");
    const client = postgres(connectionString, {
      max: 10, // connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      // PgBouncer (Supabase pooler) doesn't support prepared statements
      ...(isPgBouncer && { prepare: false }),
    });

    const db = drizzle(client, { schema });

    return { db, client };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    throw new Error(`Failed to create database connection: ${message}`);
  }
}
