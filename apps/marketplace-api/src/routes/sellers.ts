/**
 * Seller management routes.
 */
import { Hono } from "hono";
import type { Repositories } from "../repositories/types.js";
import { apiKeyAuth, type AuthEnv } from "../middleware/auth.js";

export function sellerRoutes(repos: Repositories) {
  const app = new Hono<AuthEnv>();

  // POST /v1/sellers/register — public, no auth required
  app.post("/register", async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body || !body.wallet_address) {
      return c.json({ error: "wallet_address is required" }, 400);
    }

    const { wallet_address, display_name } = body;

    // Check for existing seller with this wallet
    const existing = await repos.sellers.findByWallet(wallet_address);
    if (existing) {
      return c.json({
        id: existing.id,
        wallet_address: existing.wallet_address,
        display_name: existing.display_name,
        api_key: existing.api_key,
        created_at: existing.created_at,
      }, 200);
    }

    // Generate API key: ag_ + 32 hex chars
    const apiKey = `ag_${crypto.randomUUID().replace(/-/g, "")}`;

    const seller = await repos.sellers.create({
      wallet_address,
      display_name,
      api_key: apiKey,
    });

    return c.json({
      id: seller.id,
      wallet_address: seller.wallet_address,
      display_name: seller.display_name,
      api_key: seller.api_key,
      created_at: seller.created_at,
    }, 201);
  });

  // GET /v1/sellers/me — requires auth
  app.get("/me", apiKeyAuth(repos), async (c) => {
    const seller = c.get("seller");
    return c.json({
      id: seller.id,
      wallet_address: seller.wallet_address,
      display_name: seller.display_name,
      verified: seller.verified,
    });
  });

  return app;
}
