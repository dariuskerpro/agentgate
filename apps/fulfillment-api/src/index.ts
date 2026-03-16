import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { handleCodeReview } from "./handlers/code-review.js";
import { handleTranscriptToPrd } from "./handlers/transcript-to-prd.js";

export const app = new Hono();

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Endpoints
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
