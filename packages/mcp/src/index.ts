#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOL_DEFINITIONS, handleToolCall } from "./tools.js";

const server = new McpServer({
  name: "agentgate",
  version: "0.0.1",
});

// Register tools using the low-level server access
for (const tool of TOOL_DEFINITIONS) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.properties as Record<string, unknown>,
    async (args: Record<string, unknown>) => {
      try {
        return await handleToolCall(tool.name, args);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
