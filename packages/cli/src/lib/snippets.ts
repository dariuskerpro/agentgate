/**
 * Code snippet generation for middleware integration
 */

import type { Framework } from './detect.js';

const SNIPPETS: Record<Framework, string> = {
  express: `import express from 'express';
import { agentgate } from '@agentgate/middleware/express';

const app = express();

// Reads config from .agentgate.json
app.use(agentgate());

// Your routes below...`,

  hono: `import { Hono } from 'hono';
import { agentgate } from '@agentgate/middleware/hono';

const app = new Hono();

// Reads config from .agentgate.json
app.use('/*', agentgate());

// Your routes below...`,

  next: `// app/api/your-route/route.ts
import { withAgentGate } from '@agentgate/middleware/next';

async function GET(request: Request) {
  return Response.json({ /* your data */ });
}

export default withAgentGate(GET, {
  wallet: process.env.AGENTGATE_WALLET!,
  price: '$0.001',
  description: 'Your endpoint description',
  category: 'data',
});`,
};

/**
 * Generate a middleware code snippet for the given framework.
 */
export function generateMiddlewareSnippet(framework: Framework): string {
  return SNIPPETS[framework];
}
