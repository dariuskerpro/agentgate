import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { paymentMiddlewareFromConfig, type SchemeRegistration } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { handleCodeReview } from "./handlers/code-review.js";
import { handleTranscriptToPrd } from "./handlers/transcript-to-prd.js";
import { handleEmailValidate } from "./handlers/email-validate.js";
import { handleDnsLookup } from "./handlers/dns-lookup.js";
import { handleUrlMetadata } from "./handlers/url-metadata.js";
import { handlePhoneValidate } from "./handlers/phone-validate.js";
import { handleCryptoPrice } from "./handlers/crypto-price.js";
import { handleIpGeolocate } from "./handlers/ip-geolocate.js";
import { handleScrapeEnrich } from "./handlers/scrape-enrich.js";
import { handleTranscribe } from "./handlers/transcribe.js";
import { handlePdfExtract } from "./handlers/pdf-extract.js";
import { ENDPOINT_PRICING } from "./lib/pricing-config.js";
import { getDynamicPrice } from "./lib/dynamic-pricing.js";

const SELLER_WALLET = process.env.SELLER_WALLET || "";
const SELLER_WALLET_SOL = process.env.SELLER_WALLET_SOL || "";
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";
const USE_PAYMENTS = process.env.DISABLE_PAYMENTS !== "true";

// Networks
const BASE_MAINNET = "eip155:8453" as `${string}:${string}`;
const BASE_SEPOLIA = "eip155:84532" as `${string}:${string}`;
const SOL_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as `${string}:${string}`;
const SOL_DEVNET = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as `${string}:${string}`;

// Pick networks based on env
const USE_TESTNET = process.env.USE_TESTNET === "true";
const EVM_NETWORK = USE_TESTNET ? BASE_SEPOLIA : BASE_MAINNET;
const SOL_NETWORK = USE_TESTNET ? SOL_DEVNET : SOL_MAINNET;

export const app = new Hono();

// Health check (always free)
app.get("/health", (c) =>
  c.json({
    status: "ok",
    payments: USE_PAYMENTS,
    networks: { evm: EVM_NETWORK, solana: SOL_NETWORK },
    facilitator: FACILITATOR_URL,
  }),
);

// Helper to build accepts array at a given price
function buildAccepts(price: string) {
  const opts = [];
  if (SELLER_WALLET) {
    opts.push({ scheme: "exact", network: EVM_NETWORK, price, payTo: SELLER_WALLET });
  }
  if (SELLER_WALLET_SOL) {
    opts.push({ scheme: "exact", network: SOL_NETWORK, price, payTo: SELLER_WALLET_SOL });
  }
  return opts.length === 1 ? opts[0] : opts;
}

// Build x402 route configs dynamically from pricing config
function buildRouteConfig() {
  const endpointDescriptions: Record<string, string> = {
    '/v1/code-review': 'Code review — security, performance, and architecture feedback (up to 100K chars)',
    '/v1/transcript-to-prd': 'Meeting transcript → structured PRD with user stories, acceptance criteria, and priorities',
    '/v1/email-validate': 'Email validation — format, MX records, disposable detection, typo suggestions',
    '/v1/dns-lookup': 'DNS lookup — A, AAAA, MX, NS, TXT, CNAME, SOA records for any domain',
    '/v1/url-metadata': 'URL metadata extraction — title, description, OG tags, Twitter cards, favicon',
    '/v1/phone-validate': 'Phone validation — format check, E.164 normalization, country detection',
    '/v1/crypto-price': 'Crypto price lookup — current price, 24h change, market cap, volume',
    '/v1/ip-geolocate': 'IP geolocation — country, city, ISP, coordinates, timezone',
    '/v1/transcribe': 'Audio transcription — speech-to-text with timestamps, segments, and language detection',
    '/v1/scrape-enrich': 'URL scraping and enrichment — fetch, extract, and optionally structure content with AI',
    '/v1/pdf-extract': 'PDF extraction — text, tables, and key-value pairs from PDF documents via Gemini',
  };

  const routes: Record<string, { accepts: any; description: string }> = {};

  for (const [path] of Object.entries(ENDPOINT_PRICING)) {
    const price = getDynamicPrice(path, {}); // default input for baseline price
    const method = 'POST';
    const routeKey = `${method} ${path}`;

    routes[routeKey] = {
      accepts: buildAccepts(price),
      description: endpointDescriptions[path] || path,
    };
  }

  return routes;
}

// x402 payment middleware — only on the paid routes
if (USE_PAYMENTS && (SELLER_WALLET || SELLER_WALLET_SOL)) {
  const routes = buildRouteConfig();

  // Register scheme servers for both chains
  const schemes: SchemeRegistration[] = [];
  if (SELLER_WALLET) {
    schemes.push({ network: EVM_NETWORK, server: new ExactEvmScheme() });
  }
  if (SELLER_WALLET_SOL) {
    schemes.push({ network: SOL_NETWORK, server: new ExactSvmScheme() });
  }

  // Use our self-hosted facilitator
  const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

  app.use(
    paymentMiddlewareFromConfig(
      routes,
      facilitatorClient,
      schemes,
      {
        appName: "AgentGate",
        testnet: USE_TESTNET,
      },
    ),
  );

  console.log(`x402 payments enabled`);
  console.log(`  Facilitator: ${FACILITATOR_URL}`);
  console.log(`  EVM wallet: ${SELLER_WALLET || "not set"} (${EVM_NETWORK})`);
  console.log(`  SOL wallet: ${SELLER_WALLET_SOL || "not set"} (${SOL_NETWORK})`);
} else {
  console.log("x402 payments DISABLED — endpoints are free");
}

// Endpoints (called only after payment verification when x402 is enabled)
// Premium (AI inference)
app.post("/v1/code-review", handleCodeReview);
app.post("/v1/transcript-to-prd", handleTranscriptToPrd);
// Utility (micropayment)
app.post("/v1/email-validate", handleEmailValidate);
app.post("/v1/dns-lookup", handleDnsLookup);
app.post("/v1/url-metadata", handleUrlMetadata);
app.post("/v1/phone-validate", handlePhoneValidate);
app.post("/v1/crypto-price", handleCryptoPrice);
app.post("/v1/ip-geolocate", handleIpGeolocate);
app.post("/v1/scrape-enrich", handleScrapeEnrich);
// New AI endpoints
app.post("/v1/transcribe", handleTranscribe);
app.post("/v1/pdf-extract", handlePdfExtract);

// 404 fallback
app.notFound((c) => c.json({ error: "Not found" }, 404));

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Start server only when run directly
if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT) || 3001;
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Fulfillment API listening on port ${port}`);
  });
}
