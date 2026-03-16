import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { paymentMiddlewareFromConfig } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { handleCodeReview } from "./handlers/code-review.js";
import { handleTranscriptToPrd } from "./handlers/transcript-to-prd.js";

const SELLER_WALLET = process.env.SELLER_WALLET || "";
const NETWORK = (process.env.NETWORK || "eip155:84532") as `${string}:${string}`; // Base Sepolia testnet (mainnet not yet supported by facilitator)
const USE_PAYMENTS = process.env.DISABLE_PAYMENTS !== "true";

export const app = new Hono();

// Health check (always free)
app.get("/health", (c) => c.json({ status: "ok" }));

// x402 payment middleware — only on the paid routes
if (USE_PAYMENTS && SELLER_WALLET) {
  const routes = {
    "POST /v1/code-review": {
      accepts: {
        scheme: "exact",
        network: NETWORK,
        price: "$0.05",
        payTo: SELLER_WALLET,
      },
      description: "Full codebase review — security audit, performance, and architecture feedback",
    },
    "POST /v1/transcript-to-prd": {
      accepts: {
        scheme: "exact",
        network: NETWORK,
        price: "$0.035",
        payTo: SELLER_WALLET,
      },
      description:
        "Meeting transcript → structured PRD with user stories, acceptance criteria, and priorities",
    },
  };

  app.use(
    paymentMiddlewareFromConfig(
      routes,
      undefined, // use default facilitator (https://x402.org/facilitator)
      [{ network: NETWORK, server: new ExactEvmScheme() }],
      {
        appName: "AgentGate",
        testnet: NETWORK.includes("84532"),
      },
    ),
  );

  console.log(`x402 payments enabled — wallet: ${SELLER_WALLET}, network: ${NETWORK}`);
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
