/**
 * Run token-pricing migration against live DB.
 * Usage: npx tsx src/db/run-migration.ts
 */
import { readFileSync } from "node:fs";
import { createDb } from "./index.js";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const { db, client } = createDb(DATABASE_URL);
const sql = readFileSync(new URL("../../drizzle/migration-token-pricing.sql", import.meta.url), "utf-8");

// Split into individual statements (skip empty)
const statements = sql.split(";").map(s => s.trim()).filter(Boolean);

console.log(`Running ${statements.length} migration statements...`);

for (const stmt of statements) {
  try {
    await client.unsafe(stmt);
    console.log(`✅ ${stmt.slice(0, 60)}...`);
  } catch (err: any) {
    // Ignore "already exists" errors for idempotency
    if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
      console.log(`⏭️  Skipped (already exists): ${stmt.slice(0, 60)}...`);
    } else {
      console.error(`❌ Failed: ${stmt.slice(0, 60)}...`);
      console.error(err.message);
      await client.end();
      process.exit(1);
    }
  }
}

console.log("\n✅ Migration complete");
await client.end();
