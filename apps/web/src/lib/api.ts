const MARKETPLACE_URL =
  process.env.AGENTGATE_MARKETPLACE_URL ?? "https://api.text2ai.com";

/** Fetch the live count of active endpoints from the marketplace */
export async function fetchEndpointCount(): Promise<number> {
  try {
    const res = await fetch(`${MARKETPLACE_URL}/v1/discover?limit=0`);
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.total === "number" ? data.total : 0;
  } catch {
    return 0;
  }
}
