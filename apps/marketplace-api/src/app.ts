/**
 * Hono app assembly — mounts all route groups.
 */
import { Hono } from "hono";
import type { Repositories } from "./repositories/types.js";
import { sellerRoutes } from "./routes/sellers.js";
import { endpointRoutes } from "./routes/endpoints.js";
import { discoverRoutes } from "./routes/discover.js";
import { eventRoutes } from "./routes/events.js";

export function createApp(repos: Repositories) {
  const app = new Hono();

  // Global error handler — log errors in production
  app.onError((err, c) => {
    console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message, err.stack);
    return c.json({ error: "Internal Server Error", message: err.message }, 500);
  });

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  // DB health check
  app.get("/health/db", async (c) => {
    try {
      const result = await repos.endpoints.discover({ limit: 1, offset: 0 });
      return c.json({ status: "ok", db: "connected" });
    } catch (err: any) {
      const detail = {
        message: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
        severity: err.severity,
        routine: err.routine,
        // Show masked connection info for debugging
        db_url_length: process.env.DATABASE_URL?.length,
        db_url_start: process.env.DATABASE_URL?.substring(0, 30) + "...",
      };
      console.error("[DB HEALTH]", JSON.stringify(detail));
      return c.json({ status: "error", ...detail }, 500);
    }
  });

  // Mount route groups
  app.route("/v1/sellers", sellerRoutes(repos));
  app.route("/v1/endpoints", endpointRoutes(repos));
  app.route("/v1/discover", discoverRoutes(repos));
  app.route("/v1/events", eventRoutes(repos));

  return app;
}
