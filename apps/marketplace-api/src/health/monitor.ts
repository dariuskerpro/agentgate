/**
 * Core health monitoring orchestrator.
 */
import type { Endpoint } from "../repositories/types.js";
import type { EndpointRepository } from "../repositories/types.js";
import type { HealthRepository } from "../repositories/health.js";
import { probeEndpoint, type ProbeOptions } from "./probe.js";
import { computeUptimeScore, shouldAutoDeactivate } from "./scoring.js";

export interface HealthCheckResult {
  endpointId: string;
  isUp: boolean;
  statusCode: number;
  latencyMs: number;
  uptimeScore: number;
  deactivated: boolean;
}

export interface RunHealthCheckOptions {
  endpointRepo: EndpointRepository;
  healthRepo: HealthRepository;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Fetch all active endpoints from the repository.
 */
export async function fetchActiveEndpoints(
  endpointRepo: EndpointRepository,
): Promise<Endpoint[]> {
  const { endpoints } = await endpointRepo.discover({ limit: 10000 });
  return endpoints;
}

/**
 * Run a full health check cycle:
 * 1. Fetch active endpoints
 * 2. Probe each
 * 3. Record results
 * 4. Compute uptime scores
 * 5. Auto-deactivate if down > 24h
 */
export async function runHealthCheck(
  options: RunHealthCheckOptions,
): Promise<HealthCheckResult[]> {
  const { endpointRepo, healthRepo, fetchFn, timeoutMs } = options;
  const endpoints = await fetchActiveEndpoints(endpointRepo);
  const results: HealthCheckResult[] = [];

  for (const ep of endpoints) {
    const probe = await probeEndpoint(ep.url, { fetchFn, timeoutMs });

    await healthRepo.record({
      endpoint_id: ep.id,
      checked_at: new Date(),
      status_code: probe.statusCode,
      latency_ms: probe.latencyMs,
      is_up: probe.isUp,
    });

    const uptimeScore = await computeUptimeScore(ep.id, healthRepo);
    const shouldDeactivate = await shouldAutoDeactivate(ep.id, healthRepo);

    if (shouldDeactivate) {
      await endpointRepo.deactivate(ep.id);
    }

    results.push({
      endpointId: ep.id,
      isUp: probe.isUp,
      statusCode: probe.statusCode,
      latencyMs: probe.latencyMs,
      uptimeScore,
      deactivated: shouldDeactivate,
    });
  }

  return results;
}
