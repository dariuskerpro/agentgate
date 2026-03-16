/**
 * Public discovery routes — no auth required.
 */
import { Hono } from "hono";
import type { Repositories } from "../repositories/types.js";

export function discoverRoutes(repos: Repositories) {
  const app = new Hono();

  // GET /v1/discover/categories — list categories with counts
  // Must be before /:id to avoid route conflict
  app.get("/categories", async (c) => {
    const categories = await repos.endpoints.getCategories();
    return c.json({ categories });
  });

  // GET /v1/discover — search/browse active endpoints
  app.get("/", async (c) => {
    const category = c.req.query("category");
    const q = c.req.query("q");
    const sort = c.req.query("sort") as "quality" | "price" | "newest" | undefined;
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 20;
    const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;

    const result = await repos.endpoints.discover({
      category,
      q,
      sort,
      limit,
      offset,
    });

    return c.json({
      endpoints: result.endpoints,
      total: result.total,
      limit,
      offset,
    });
  });

  // GET /v1/discover/:id — get endpoint details
  app.get("/:id", async (c) => {
    const id = c.req.param("id");
    const ep = await repos.endpoints.findById(id);
    if (!ep || !ep.active) {
      return c.json({ error: "Endpoint not found" }, 404);
    }
    return c.json(ep);
  });

  return app;
}
