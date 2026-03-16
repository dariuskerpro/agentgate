const API_BASE = process.env.AGENTGATE_API_URL || "https://api.agentgate.online";

export const TOOL_DEFINITIONS = [
  {
    name: "agentgate_discover",
    description:
      "Search AgentGate marketplace for endpoints by capability or category",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "Search query to find endpoints by capability",
        },
        category: {
          type: "string",
          description: "Filter endpoints by category",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
        },
      },
    },
  },
  {
    name: "agentgate_call",
    description:
      "Call an AgentGate endpoint with automatic x402 USDC payment",
    inputSchema: {
      type: "object" as const,
      properties: {
        endpoint: {
          type: "string",
          description: "The full URL of the AgentGate endpoint to call",
        },
        data: {
          type: "object",
          description: "Request payload to send to the endpoint",
        },
        network: {
          type: "string",
          enum: ["base", "solana"],
          description: "Payment network to use (default: base)",
        },
      },
      required: ["endpoint", "data"],
    },
  },
  {
    name: "agentgate_categories",
    description: "List all available endpoint categories on AgentGate",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
] as const;

export async function handleDiscover(args: {
  query?: string;
  category?: string;
  limit?: number;
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const url = new URL(`${API_BASE}/v1/discover`);
  if (args.query) url.searchParams.set("query", args.query);
  if (args.category) url.searchParams.set("category", args.category);
  if (args.limit) url.searchParams.set("limit", String(args.limit));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`AgentGate API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export async function handleCall(args: {
  endpoint: string;
  data: object;
  network?: "base" | "solana";
}): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const res = await fetch(args.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args.data),
  });

  if (res.status === 402) {
    const paymentDetails: Record<string, string> = {};
    for (const key of [
      "x-payment-address",
      "x-payment-amount",
      "x-payment-currency",
      "x-payment-network",
      "x-payment-required",
    ]) {
      const val = res.headers.get(key);
      if (val) paymentDetails[key] = val;
    }

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // body may not be JSON
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: 402,
              message:
                "Payment required. Configure a wallet to enable automatic x402 payments.",
              paymentHeaders: paymentDetails,
              body,
              network: args.network || "base",
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  if (!res.ok) {
    throw new Error(
      `Endpoint error: ${res.status} ${res.statusText}`,
    );
  }

  const data = await res.json();
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export async function handleCategories(): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const res = await fetch(`${API_BASE}/v1/discover/categories`);
  if (!res.ok) {
    throw new Error(`AgentGate API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  switch (name) {
    case "agentgate_discover":
      return handleDiscover(
        args as { query?: string; category?: string; limit?: number },
      );
    case "agentgate_call":
      return handleCall(
        args as { endpoint: string; data: object; network?: "base" | "solana" },
      );
    case "agentgate_categories":
      return handleCategories();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
