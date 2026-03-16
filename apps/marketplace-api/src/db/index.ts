import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

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
    const client = postgres(connectionString, {
      max: 10, // connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
    });

    const db = drizzle(client, { schema });

    return { db, client };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    throw new Error(`Failed to create database connection: ${message}`);
  }
}
