/**
 * Seed provider_rates table with current model pricing.
 * Run standalone: npx tsx src/db/seed-provider-rates.ts
 * Idempotent — uses ON CONFLICT DO UPDATE.
 */
import { createDb } from "./index.js";
import { providerRates } from "./schema.js";
import { sql } from "drizzle-orm";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env or environment.");
  process.exit(1);
}

const rates = [
  { provider: "anthropic", model: "claude-sonnet-4", input_rate_per_1k: "0.003", output_rate_per_1k: "0.015", unit: "tokens" },
  { provider: "anthropic", model: "claude-opus-4", input_rate_per_1k: "0.015", output_rate_per_1k: "0.075", unit: "tokens" },
  { provider: "anthropic", model: "claude-haiku-3.5", input_rate_per_1k: "0.0008", output_rate_per_1k: "0.004", unit: "tokens" },
  { provider: "openai", model: "gpt-4.1", input_rate_per_1k: "0.002", output_rate_per_1k: "0.008", unit: "tokens" },
  { provider: "openai", model: "gpt-4.1-mini", input_rate_per_1k: "0.0004", output_rate_per_1k: "0.0016", unit: "tokens" },
  { provider: "openai", model: "gpt-4.1-nano", input_rate_per_1k: "0.0001", output_rate_per_1k: "0.0004", unit: "tokens" },
  { provider: "openai", model: "o4-mini", input_rate_per_1k: "0.0011", output_rate_per_1k: "0.0044", unit: "tokens" },
  { provider: "openai", model: "whisper-1", input_rate_per_1k: "0.006", output_rate_per_1k: null, unit: "minutes" },
  { provider: "google", model: "gemini-2.5-flash", input_rate_per_1k: "0.00015", output_rate_per_1k: "0.0035", unit: "tokens" },
  { provider: "google", model: "gemini-2.5-pro", input_rate_per_1k: "0.00125", output_rate_per_1k: "0.01", unit: "tokens" },
] as const;

async function seedProviderRates() {
  const { db, client } = createDb(DATABASE_URL!);

  console.log("🌱 Seeding provider_rates...");

  for (const rate of rates) {
    await db
      .insert(providerRates)
      .values(rate)
      .onConflictDoUpdate({
        target: [providerRates.provider, providerRates.model],
        set: {
          input_rate_per_1k: rate.input_rate_per_1k,
          output_rate_per_1k: rate.output_rate_per_1k,
          unit: rate.unit,
          updated_at: sql`now()`,
        },
      });
  }

  console.log(`✅ Upserted ${rates.length} provider rates`);
  await client.end();
}

seedProviderRates().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
