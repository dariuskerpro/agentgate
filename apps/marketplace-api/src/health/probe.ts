/**
 * HTTP probe — lightweight HEAD request with AbortController timeout.
 * Does NOT send x402 payment headers. Just checks availability.
 */

export interface ProbeResult {
  isUp: boolean;
  statusCode: number;
  latencyMs: number;
}

export interface ProbeOptions {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export async function probeEndpoint(
  url: string,
  options: ProbeOptions = {},
): Promise<ProbeResult> {
  const { fetchFn = fetch, timeoutMs = 5000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  try {
    const response = await fetchFn(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    const latencyMs = Date.now() - start;

    return {
      isUp: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    // AbortError = timeout
    if (err instanceof DOMException && err.name === "AbortError") {
      return { isUp: false, statusCode: 0, latencyMs };
    }
    // Network error
    return { isUp: false, statusCode: 0, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}
