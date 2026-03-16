import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { paymentMiddlewareFromConfig, type SchemeRegistration } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/facilitator";
import { handleCodeReview } from "./handlers/code-review.js";
import { handleTranscriptToPrd } from "./handlers/transcript-to-prd.js";

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

// x402 payment middleware — only on the paid routes
if (USE_PAYMENTS && (SELLER_WALLET || SELLER_WALLET_SOL)) {
  // Build payment options — accept both Base and Solana
  const acceptsOptions = [];

  if (SELLER_WALLET) {
    acceptsOptions.push({
      scheme: "exact",
      network: EVM_NETWORK,
      price: "$0.05",
      payTo: SELLER_WALLET,
    });
  }

  if (SELLER_WALLET_SOL) {
    acceptsOptions.push({
      scheme: "exact",
      network: SOL_NETWORK,
      price: "$0.05",
      payTo: SELLER_WALLET_SOL,
    });
  }

  const acceptsOptionsPrd = [];

  if (SELLER_WALLET) {
    acceptsOptionsPrd.push({
      scheme: "exact",
      network: EVM_NETWORK,
      price: "$0.035",
      payTo: SELLER_WALLET,
    });
  }

  if (SELLER_WALLET_SOL) {
    acceptsOptionsPrd.push({
      scheme: "exact",
      network: SOL_NETWORK,
      price: "$0.035",
      payTo: SELLER_WALLET_SOL,
    });
  }

  const routes = {
    "POST /v1/code-review": {
      accepts: acceptsOptions.length === 1 ? acceptsOptions[0] : acceptsOptions,
      description: "Full codebase review — security audit, performance, and architecture feedback",
    },
    "POST /v1/transcript-to-prd": {
      accepts: acceptsOptionsPrd.length === 1 ? acceptsOptionsPrd[0] : acceptsOptionsPrd,
      description:
        "Meeting transcript → structured PRD with user stories, acceptance criteria, and priorities",
    },
  };

  // Register scheme servers
  const schemes: SchemeRegistration[] = [];
  if (SELLER_WALLET) {
    schemes.push({ network: EVM_NETWORK, server: new ExactEvmScheme() });
  }
  // Note: SVM scheme server is handled by the facilitator, not locally

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
app.post("/v1/code-review", handleCodeReview);
app.post("/v1/transcript-to-prd", handleTranscriptToPrd);

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
