/**
 * Endpoint CRUD routes (auth required).
 */
import { Hono } from "hono";
import type { Repositories } from "../repositories/types.js";
import { apiKeyAuth, type AuthEnv } from "../middleware/auth.js";

export function endpointRoutes(repos: Repositories) {
  const app = new Hono<AuthEnv>();

  // All endpoint management routes require auth
  app.use("/*", apiKeyAuth(repos));

  // POST /v1/endpoints — register a new endpoint
  app.post("/", async (c) => {
    const seller = c.get("seller");
    const body = await c.req.json().catch(() => null);

    if (!body || !body.url || !body.category || body.price_usdc === undefined) {
      return c.json(
        { error: "url, category, and price_usdc are required" },
        400,
      );
    }

    const ep = await repos.endpoints.create({
      seller_id: seller.id,
      url: body.url,
      method: body.method ?? "GET",
      description: body.description ?? null,
      category: body.category,
      price_usdc: String(body.price_usdc),
      pricing_mode: body.pricing_mode ?? "flat",
      pricing_config: body.pricing_config ?? null,
      input_schema: body.input_schema ?? null,
      output_schema: body.output_schema ?? null,
      network: body.network ?? "eip155:8453",
    });

    return c.json(ep, 201);
  });

  // GET /v1/endpoints/mine — list seller's own endpoints
  app.get("/mine", async (c) => {
    const seller = c.get("seller");
    const endpoints = await repos.endpoints.findBySeller(seller.id);
    return c.json({ endpoints });
  });

  // PUT /v1/endpoints/:id — update endpoint (owner only)
  app.put("/:id", async (c) => {
    const seller = c.get("seller");
    const id = c.req.param("id");

    const existing = await repos.endpoints.findById(id);
    if (!existing) {
      return c.json({ error: "Endpoint not found" }, 404);
    }
    if (existing.seller_id !== seller.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const body = await c.req.json().catch(() => ({}));
    const updated = await repos.endpoints.update(id, {
      url: body.url,
      method: body.method,
      description: body.description,
      category: body.category,
      price_usdc: body.price_usdc !== undefined ? String(body.price_usdc) : undefined,
      input_schema: body.input_schema,
      output_schema: body.output_schema,
      network: body.network,
      active: body.active,
    });

    return c.json(updated);
  });

  // DELETE /v1/endpoints/:id — soft delete (owner only)
  app.delete("/:id", async (c) => {
    const seller = c.get("seller");
    const id = c.req.param("id");

    const existing = await repos.endpoints.findById(id);
    if (!existing) {
      return c.json({ error: "Endpoint not found" }, 404);
    }
    if (existing.seller_id !== seller.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const deactivated = await repos.endpoints.deactivate(id);
    return c.json({ message: "Endpoint deactivated", endpoint: deactivated });
  });

  return app;
}
