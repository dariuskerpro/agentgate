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
  const [audioForge, codesmith, dataPipeline, docIntel, visionLab] = await db
    .insert(sellers)
    .values([
      {
        wallet_address: "0xAF01234567890abcdef01234567890abcdef0123",
        display_name: "AudioForge",
        api_key: "ag_audioforge_001",
        verified: true,
      },
      {
        wallet_address: "0xCS01234567890abcdef01234567890abcdef0123",
        display_name: "CodeSmith AI",
        api_key: "ag_codesmith_002",
        verified: true,
      },
      {
        wallet_address: "0xDP01234567890abcdef01234567890abcdef0123",
        display_name: "DataPipeline Co",
        api_key: "ag_datapipeline_003",
        verified: true,
      },
      {
        wallet_address: "0xDI01234567890abcdef01234567890abcdef0123",
        display_name: "DocIntel",
        api_key: "ag_docintel_004",
        verified: true,
      },
      {
        wallet_address: "0xVL01234567890abcdef01234567890abcdef0123",
        display_name: "VisionLab",
        api_key: "ag_visionlab_005",
        verified: true,
      },
    ])
    .returning();

  console.log(`✅ Created 5 sellers`);

  // ── Endpoints — agent-native, chainable tasks ──────────────────
  const endpointData = [
    // AudioForge — audio processing pipeline
    {
      seller_id: audioForge.id,
      url: "https://api.audioforge.ai/v1/transcribe",
      method: "POST",
      description: "Audio/video → accurate transcript with speaker diarization and timestamps",
      category: "audio",
      price_usdc: "0.015",
    },
    {
      seller_id: audioForge.id,
      url: "https://api.audioforge.ai/v1/voice-clone",
      method: "POST",
      description: "Clone a voice from a 30-second sample — generate speech in any language",
      category: "audio",
      price_usdc: "0.050",
    },
    {
      seller_id: audioForge.id,
      url: "https://api.audioforge.ai/v1/podcast-produce",
      method: "POST",
      description: "Raw transcript → produced podcast episode with intro, transitions, and outro",
      category: "audio",
      price_usdc: "0.080",
    },

    // CodeSmith AI — code generation pipeline
    {
      seller_id: codesmith.id,
      url: "https://api.codesmith.ai/v1/prd-to-scaffold",
      method: "POST",
      description: "PRD document → full project scaffold with tests, CI, and Docker",
      category: "code",
      price_usdc: "0.100",
    },
    {
      seller_id: codesmith.id,
      url: "https://api.codesmith.ai/v1/code-review",
      method: "POST",
      description: "Code review — security, performance, and architecture feedback (up to 100K chars)",
      category: "code",
      price_usdc: "0.050",
    },
    {
      seller_id: codesmith.id,
      url: "https://api.codesmith.ai/v1/migrate",
      method: "POST",
      description: "Migrate codebase between frameworks (e.g. Express→Hono, REST→GraphQL)",
      category: "code",
      price_usdc: "0.200",
    },

    // DataPipeline — ETL and data processing
    {
      seller_id: dataPipeline.id,
      url: "https://api.datapipeline.co/v1/scrape-enrich",
      method: "POST",
      description: "Scrape any URL → extract structured data → enrich with metadata and embeddings",
      category: "data",
      price_usdc: "0.012",
    },
    {
      seller_id: dataPipeline.id,
      url: "https://api.datapipeline.co/v1/dataset-clean",
      method: "POST",
      description: "Raw CSV/JSON → deduplicated, normalized, and validated dataset",
      category: "data",
      price_usdc: "0.025",
    },
    {
      seller_id: dataPipeline.id,
      url: "https://api.datapipeline.co/v1/lead-recon",
      method: "POST",
      description: "Business name + location → full recon: website, reviews, tech stack, decision makers",
      category: "data",
      price_usdc: "0.030",
    },

    // DocIntel — document intelligence
    {
      seller_id: docIntel.id,
      url: "https://api.docintel.ai/v1/pdf-extract",
      method: "POST",
      description: "PDF → structured JSON with tables, charts, and key-value extraction",
      category: "documents",
      price_usdc: "0.020",
    },
    {
      seller_id: docIntel.id,
      url: "https://api.docintel.ai/v1/contract-review",
      method: "POST",
      description: "Legal contract → risk analysis, key terms, and plain-English summary",
      category: "documents",
      price_usdc: "0.075",
    },
    {
      seller_id: docIntel.id,
      url: "https://api.docintel.ai/v1/transcript-to-prd",
      method: "POST",
      description: "Meeting transcript → structured PRD with user stories, acceptance criteria, and priorities",
      category: "documents",
      price_usdc: "0.035",
    },

    // VisionLab — image and video intelligence
    {
      seller_id: visionLab.id,
      url: "https://api.visionlab.ai/v1/scene-understand",
      method: "POST",
      description: "Image/video → detailed scene description, object detection, and spatial relationships",
      category: "vision",
      price_usdc: "0.010",
    },
    {
      seller_id: visionLab.id,
      url: "https://api.visionlab.ai/v1/brand-audit",
      method: "POST",
      description: "Screenshot → full brand audit: colors, typography, accessibility, and competitor comparison",
      category: "vision",
      price_usdc: "0.045",
    },
    {
      seller_id: visionLab.id,
      url: "https://api.visionlab.ai/v1/video-highlights",
      method: "POST",
      description: "Long video → key moments, highlight reel, and chapter markers with thumbnails",
      category: "vision",
      price_usdc: "0.060",
    },
  ];

  const insertedEndpoints = await db
    .insert(endpoints)
    .values(endpointData)
    .returning();

  console.log(`✅ Created ${insertedEndpoints.length} endpoints`);

  // ── Transactions — simulate real usage ─────────────────────────
  const buyerWallets = [
    "0xBUY1234567890abcdef01234567890abcdef0001",
    "0xBUY1234567890abcdef01234567890abcdef0002",
    "0xBUY1234567890abcdef01234567890abcdef0003",
    "0xBUY1234567890abcdef01234567890abcdef0004",
  ];

  const txData = insertedEndpoints.flatMap((ep) =>
    buyerWallets.slice(0, Math.floor(Math.random() * 3) + 1).map((wallet) => ({
      endpoint_id: ep.id,
      buyer_wallet: wallet,
      amount_usdc: ep.price_usdc,
      tx_hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      latency_ms: Math.floor(Math.random() * 500) + 80,
      status: "settled",
    }))
  );

  const insertedTx = await db.insert(transactions).values(txData).returning();

  console.log(`✅ Created ${insertedTx.length} transactions`);

  console.log("\n🎉 Seed complete!");
  console.log(`   ${5} sellers | ${insertedEndpoints.length} endpoints | ${insertedTx.length} transactions`);
  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
