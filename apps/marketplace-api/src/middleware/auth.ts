/**
 * API key auth middleware for Hono.
 * Checks Authorization: Bearer ag_xxxxx header and resolves the seller.
 */
import { createMiddleware } from "hono/factory";
import type { Repositories } from "../repositories/types.js";

export type AuthEnv = {
  Variables: {
    seller: { id: string; wallet_address: string; display_name: string | null; verified: boolean };
  };
};

export function apiKeyAuth(repos: Repositories) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Missing Authorization header" }, 401);
    }

    const match = authHeader.match(/^Bearer\s+(ag_\w+)$/);
    if (!match) {
      return c.json({ error: "Invalid API key format" }, 401);
    }

    const apiKey = match[1];
    const seller = await repos.sellers.findByApiKey(apiKey);
    if (!seller) {
      return c.json({ error: "Invalid API key" }, 401);
    }

    c.set("seller", {
      id: seller.id,
      wallet_address: seller.wallet_address,
      display_name: seller.display_name,
      verified: seller.verified,
    });

    await next();
  });
}
