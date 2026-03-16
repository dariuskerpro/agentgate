/**
 * Node.js production server entrypoint.
 * Serves the Hono app via @hono/node-server with real Drizzle repositories.
 */
import "dotenv/config";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb } from "./db/index.js";
import { createDrizzleRepositories } from "./repositories/drizzle.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const PORT = Number(process.env.PORT) || 3000;

const { db, client } = createDb(DATABASE_URL);
const repos = createDrizzleRepositories(db);
const app = createApp(repos);

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`AgentGate Marketplace API listening on port ${info.port}`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received — shutting down...`);
  server.close();
  await client.end();
  console.log("Connections closed. Bye.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
