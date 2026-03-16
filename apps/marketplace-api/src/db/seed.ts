import { createDb } from "./index.js";
import { sellers, endpoints, transactions } from "./schema.js";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env or environment.");
  process.exit(1);
}

async function seed() {
  const { db, client } = createDb(DATABASE_URL!);

  console.log("🌱 Seeding database...");

  // ── Sellers ────────────────────────────────────────────────────
  const [seller1, seller2, seller3] = await db
    .insert(sellers)
    .values([
      {
        wallet_address: "0x1111111111111111111111111111111111111111",
        display_name: "WeatherCo",
        api_key: "ag_test_weather_001",
        verified: true,
      },
      {
        wallet_address: "0x2222222222222222222222222222222222222222",
        display_name: "DataScraper Pro",
        api_key: "ag_test_scraper_002",
        verified: true,
      },
      {
        wallet_address: "0x3333333333333333333333333333333333333333",
        display_name: "ML APIs Inc",
        api_key: "ag_test_mlapis_003",
        verified: false,
      },
    ])
    .returning();

  console.log(`✅ Created ${3} sellers`);

  // ── Endpoints ──────────────────────────────────────────────────
  const endpointData = [
    // seller1 — data category
    {
      seller_id: seller1.id,
      url: "https://api.weatherco.io/v1/current",
      method: "GET",
      description: "Real-time weather data for any city worldwide",
      category: "data",
      price_usdc: "0.001",
    },
    {
      seller_id: seller1.id,
      url: "https://api.weatherco.io/v1/forecast",
      method: "GET",
      description: "7-day weather forecast with hourly breakdown",
      category: "data",
      price_usdc: "0.003",
    },
    {
      seller_id: seller1.id,
      url: "https://api.weatherco.io/v1/historical",
      method: "POST",
      description: "Historical weather data for any location and date range",
      category: "data",
      price_usdc: "0.005",
    },
    // seller2 — compute category
    {
      seller_id: seller2.id,
      url: "https://scraper.pro/api/scrape",
      method: "POST",
      description: "Scrape and parse any URL into structured data",
      category: "compute",
      price_usdc: "0.005",
    },
    {
      seller_id: seller2.id,
      url: "https://scraper.pro/api/screenshot",
      method: "POST",
      description: "Full-page screenshot of any URL",
      category: "compute",
      price_usdc: "0.008",
    },
    {
      seller_id: seller2.id,
      url: "https://scraper.pro/api/pdf",
      method: "POST",
      description: "Convert any URL to PDF",
      category: "compute",
      price_usdc: "0.010",
    },
    // seller3 — ml category
    {
      seller_id: seller3.id,
      url: "https://ml-apis.io/v1/sentiment",
      method: "POST",
      description: "Sentiment analysis on text input",
      category: "ml",
      price_usdc: "0.002",
    },
    {
      seller_id: seller3.id,
      url: "https://ml-apis.io/v1/summarize",
      method: "POST",
      description: "Summarize long text into key points",
      category: "ml",
      price_usdc: "0.010",
    },
    {
      seller_id: seller3.id,
      url: "https://ml-apis.io/v1/translate",
      method: "POST",
      description: "Translate text between 50+ languages",
      category: "ml",
      price_usdc: "0.004",
    },
    {
      seller_id: seller3.id,
      url: "https://ml-apis.io/v1/embeddings",
      method: "POST",
      description: "Generate text embeddings for semantic search",
      category: "ml",
      price_usdc: "0.001",
    },
  ];

  const insertedEndpoints = await db
    .insert(endpoints)
    .values(endpointData)
    .returning();

  console.log(`✅ Created ${insertedEndpoints.length} endpoints`);

  // ── Transactions ───────────────────────────────────────────────
  const txData = insertedEndpoints.slice(0, 5).flatMap((ep) => [
    {
      endpoint_id: ep.id,
      buyer_wallet: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      amount_usdc: ep.price_usdc,
      tx_hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      latency_ms: Math.floor(Math.random() * 300) + 50,
      status: "settled",
    },
    {
      endpoint_id: ep.id,
      buyer_wallet: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      amount_usdc: ep.price_usdc,
      tx_hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
      latency_ms: Math.floor(Math.random() * 300) + 50,
      status: "settled",
    },
  ]);

  const insertedTx = await db
    .insert(transactions)
    .values(txData)
    .returning();

  console.log(`✅ Created ${insertedTx.length} transactions`);

  console.log("\n🎉 Seed complete!");
  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
