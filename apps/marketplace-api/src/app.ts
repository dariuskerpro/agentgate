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

  // Global error handler
  app.onError((err, c) => {
    console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
    return c.json({ error: "Internal Server Error" }, 500);
  });

  // Health check
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Mount route groups
  app.route("/v1/sellers", sellerRoutes(repos));
  app.route("/v1/endpoints", endpointRoutes(repos));
  app.route("/v1/discover", discoverRoutes(repos));
  app.route("/v1/events", eventRoutes(repos));

  return app;
}
