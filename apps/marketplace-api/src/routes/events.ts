/**
 * Analytics ingestion routes (auth required).
 */
import { Hono } from "hono";
import type { Repositories } from "../repositories/types.js";
import { apiKeyAuth, type AuthEnv } from "../middleware/auth.js";

export function eventRoutes(repos: Repositories) {
  const app = new Hono<AuthEnv>();

  app.use("/*", apiKeyAuth(repos));

  // POST /v1/events/transaction — record a transaction event
  app.post("/transaction", async (c) => {
    const body = await c.req.json().catch(() => null);

    if (
      !body ||
      !body.endpoint_id ||
      !body.buyer_wallet ||
      body.amount_usdc === undefined
    ) {
      return c.json(
        { error: "endpoint_id, buyer_wallet, and amount_usdc are required" },
        400,
      );
    }

    const tx = await repos.transactions.create({
      endpoint_id: body.endpoint_id,
      buyer_wallet: body.buyer_wallet,
      amount_usdc: String(body.amount_usdc),
      tx_hash: body.tx_hash ?? null,
      latency_ms: body.latency_ms ?? null,
    });

    return c.json(tx, 201);
  });

  return app;
}
