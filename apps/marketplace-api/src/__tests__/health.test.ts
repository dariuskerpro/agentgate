import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Endpoint, EndpointHealth } from "../repositories/types.js";
import { MockHealthRepository } from "../repositories/health.js";
import { MockEndpointRepository } from "../repositories/mock.js";
import { fetchActiveEndpoints } from "../health/monitor.js";
import { probeEndpoint } from "../health/probe.js";
import { computeUptimeScore, shouldAutoDeactivate } from "../health/scoring.js";
import { runHealthCheck } from "../health/monitor.js";

// ── Helpers ──────────────────────────────────────────────────────

function makeEndpoint(overrides: Partial<Endpoint> = {}): Endpoint {
  return {
    id: crypto.randomUUID(),
    seller_id: crypto.randomUUID(),
    url: "https://api.example.com/data",
    method: "GET",
    description: "Test endpoint",
    category: "data",
    price_usdc: "0.001",
    input_schema: null,
    output_schema: null,
    network: "eip155:8453",
    active: true,
    created_at: new Date(),
    ...overrides,
  };
}

function makeHealthCheck(
  endpointId: string,
  overrides: Partial<EndpointHealth> = {},
): EndpointHealth {
  return {
    endpoint_id: endpointId,
    checked_at: new Date(),
    status_code: 200,
    latency_ms: 100,
    is_up: true,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe("AG-011: Endpoint Health Monitoring", () => {
  let endpointRepo: MockEndpointRepository;
  let healthRepo: MockHealthRepository;

  beforeEach(() => {
    endpointRepo = new MockEndpointRepository();
    healthRepo = new MockHealthRepository();
    vi.restoreAllMocks();
  });

  // ── 1. fetchActiveEndpoints ──────────────────────────────────

  describe("fetchActiveEndpoints()", () => {
    it("returns only active endpoints from repository", async () => {
      const active1 = makeEndpoint({ active: true });
      const active2 = makeEndpoint({ active: true });
      const inactive = makeEndpoint({ active: false });
      endpointRepo.endpoints.push(active1, active2, inactive);

      const result = await fetchActiveEndpoints(endpointRepo);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toContain(active1.id);
      expect(result.map((e) => e.id)).toContain(active2.id);
      expect(result.map((e) => e.id)).not.toContain(inactive.id);
    });
  });

  // ── 2-4. probeEndpoint ───────────────────────────────────────

  describe("probeEndpoint()", () => {
    it("successful probe returns isUp: true with status 200 and latencyMs", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

      const result = await probeEndpoint("https://api.example.com/data", {
        fetchFn: mockFetch,
        timeoutMs: 5000,
      });

      expect(result.isUp).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.latencyMs).toBeLessThan(5000);
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it("timeout returns isUp: false with statusCode 0 and latencyMs equal to timeout", async () => {
      const mockFetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 100);
        }),
      );

      const result = await probeEndpoint("https://slow.example.com", {
        fetchFn: mockFetch,
        timeoutMs: 100,
      });

      expect(result.isUp).toBe(false);
      expect(result.statusCode).toBe(0);
      expect(result.latencyMs).toBeGreaterThanOrEqual(90);
    });

    it("server error returns isUp: false with statusCode 500", async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));

      const result = await probeEndpoint("https://broken.example.com", {
        fetchFn: mockFetch,
        timeoutMs: 5000,
      });

      expect(result.isUp).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 5. recordHealthCheck ─────────────────────────────────────

  describe("recordHealthCheck()", () => {
    it("stores result in endpoint_health repository", async () => {
      const endpointId = crypto.randomUUID();
      const record: EndpointHealth = {
        endpoint_id: endpointId,
        checked_at: new Date(),
        status_code: 200,
        latency_ms: 142,
        is_up: true,
      };

      await healthRepo.record(record);

      expect(healthRepo.records).toHaveLength(1);
      expect(healthRepo.records[0].endpoint_id).toBe(endpointId);
      expect(healthRepo.records[0].status_code).toBe(200);
      expect(healthRepo.records[0].is_up).toBe(true);
    });
  });

  // ── 6-8. computeUptimeScore ──────────────────────────────────

  describe("computeUptimeScore()", () => {
    it("returns 100% when all checks are up", async () => {
      const endpointId = crypto.randomUUID();
      for (let i = 0; i < 10; i++) {
        healthRepo.records.push(
          makeHealthCheck(endpointId, { is_up: true }),
        );
      }

      const score = await computeUptimeScore(endpointId, healthRepo);
      expect(score).toBe(1.0);
    });

    it("returns 50% when half checks are up", async () => {
      const endpointId = crypto.randomUUID();
      for (let i = 0; i < 5; i++) {
        healthRepo.records.push(makeHealthCheck(endpointId, { is_up: true }));
      }
      for (let i = 0; i < 5; i++) {
        healthRepo.records.push(makeHealthCheck(endpointId, { is_up: false }));
      }

      const score = await computeUptimeScore(endpointId, healthRepo);
      expect(score).toBe(0.5);
    });

    it("returns 0% when all checks are down", async () => {
      const endpointId = crypto.randomUUID();
      for (let i = 0; i < 10; i++) {
        healthRepo.records.push(
          makeHealthCheck(endpointId, { is_up: false }),
        );
      }

      const score = await computeUptimeScore(endpointId, healthRepo);
      expect(score).toBe(0.0);
    });
  });

  // ── 9-10. shouldAutoDeactivate ───────────────────────────────

  describe("shouldAutoDeactivate()", () => {
    it("returns true when down > 24 hours continuously", async () => {
      const endpointId = crypto.randomUUID();
      const now = Date.now();
      // 25 hours of checks every 5 min = 300 checks, all down
      for (let i = 0; i < 300; i++) {
        healthRepo.records.push(
          makeHealthCheck(endpointId, {
            is_up: false,
            checked_at: new Date(now - i * 5 * 60 * 1000),
          }),
        );
      }

      const result = await shouldAutoDeactivate(endpointId, healthRepo);
      expect(result).toBe(true);
    });

    it("returns false when intermittently down", async () => {
      const endpointId = crypto.randomUUID();
      const now = Date.now();
      // 25 hours of checks, but one success 12 hours ago
      for (let i = 0; i < 300; i++) {
        const isUp = i === 144; // ~12 hours ago
        healthRepo.records.push(
          makeHealthCheck(endpointId, {
            is_up: isUp,
            checked_at: new Date(now - i * 5 * 60 * 1000),
          }),
        );
      }

      const result = await shouldAutoDeactivate(endpointId, healthRepo);
      expect(result).toBe(false);
    });
  });

  // ── 11-12. runHealthCheck ────────────────────────────────────

  describe("runHealthCheck()", () => {
    it("orchestrates: fetch endpoints → probe each → record → compute scores", async () => {
      const ep1 = makeEndpoint({ url: "https://api1.example.com" });
      const ep2 = makeEndpoint({ url: "https://api2.example.com" });
      endpointRepo.endpoints.push(ep1, ep2);

      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));

      const results = await runHealthCheck({
        endpointRepo,
        healthRepo,
        fetchFn: mockFetch,
        timeoutMs: 5000,
      });

      // Both endpoints probed
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Both results recorded
      expect(healthRepo.records).toHaveLength(2);
      // Returns scores for each endpoint
      expect(results).toHaveLength(2);
      expect(results[0].endpointId).toBe(ep1.id);
      expect(results[0].uptimeScore).toBe(1.0);
      expect(results[1].endpointId).toBe(ep2.id);
    });

    it("auto-deactivates endpoints down > 24h", async () => {
      const ep = makeEndpoint({ url: "https://dead.example.com" });
      endpointRepo.endpoints.push(ep);

      // Pre-populate 25 hours of down checks
      const now = Date.now();
      for (let i = 0; i < 300; i++) {
        healthRepo.records.push(
          makeHealthCheck(ep.id, {
            is_up: false,
            checked_at: new Date(now - i * 5 * 60 * 1000),
          }),
        );
      }

      const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));

      await runHealthCheck({
        endpointRepo,
        healthRepo,
        fetchFn: mockFetch,
        timeoutMs: 5000,
      });

      // Endpoint should be deactivated
      const updated = await endpointRepo.findById(ep.id);
      expect(updated?.active).toBe(false);
    });
  });
});
