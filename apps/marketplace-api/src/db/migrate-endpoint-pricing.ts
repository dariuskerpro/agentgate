/**
 * Migrate existing endpoints from flat to token-based pricing.
 * Usage: npx tsx src/db/migrate-endpoint-pricing.ts
 */
import { createDb } from "./index.js";
import { endpoints } from "./schema.js";
import { eq, like } from "drizzle-orm";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL required"); process.exit(1); }

const { db, client } = createDb(DATABASE_URL);

// Migration map: URL pattern → { pricing_mode, pricing_config }
const migrations: Array<{
  urlPattern: string;
  pricing_mode: string;
  pricing_config: Record<string, unknown>;
}> = [
  {
    urlPattern: "%/v1/code-review",
    pricing_mode: "provider_mapped",
    pricing_config: { provider: "anthropic", model: "claude-sonnet-4", markup_percent: 3, min_charge: 0.001 },
  },
  {
    urlPattern: "%/v1/transcript-to-prd",
    pricing_mode: "provider_mapped",
    pricing_config: { provider: "anthropic", model: "claude-sonnet-4", markup_percent: 3, min_charge: 0.001 },
  },
  {
    urlPattern: "%/v1/transcribe",
    pricing_mode: "provider_mapped",
    pricing_config: { provider: "openai", model: "whisper-1", markup_percent: 3, min_charge: 0.001 },
  },
  {
    urlPattern: "%/v1/scrape-enrich",
    pricing_mode: "provider_mapped",
    pricing_config: { provider: "openai", model: "gpt-4.1-mini", markup_percent: 3, min_charge: 0.001 },
  },
  {
    urlPattern: "%/v1/pdf-extract",
    pricing_mode: "provider_mapped",
    pricing_config: { provider: "google", model: "gemini-2.5-flash", markup_percent: 3, min_charge: 0.001 },
  },
];

console.log("🔄 Migrating endpoint pricing configs...\n");

for (const m of migrations) {
  const result = await db
    .update(endpoints)
    .set({ pricing_mode: m.pricing_mode, pricing_config: m.pricing_config })
    .where(like(endpoints.url, m.urlPattern))
    .returning({ id: endpoints.id, url: endpoints.url });

  if (result.length > 0) {
    console.log(`✅ ${m.urlPattern} → ${m.pricing_mode} (${result.length} endpoint(s))`);
  } else {
    console.log(`⏭️  ${m.urlPattern} — no matching endpoints`);
  }
}

// Verify: list all endpoints with their pricing
const all = await db.select({
  url: endpoints.url,
  pricing_mode: endpoints.pricing_mode,
  price_usdc: endpoints.price_usdc,
}).from(endpoints).where(eq(endpoints.active, true));

console.log("\n📊 Current endpoint pricing:");
for (const ep of all) {
  console.log(`  ${ep.pricing_mode.padEnd(16)} $${ep.price_usdc.padStart(8)} ${ep.url}`);
}

console.log(`\n✅ Done — ${all.length} active endpoints`);
await client.end();
