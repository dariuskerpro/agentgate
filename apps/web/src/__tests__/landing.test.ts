import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEndpointCount } from "../lib/api.js";

describe("fetchEndpointCount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns number from marketplace API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ total: 47, endpoints: [] }),
      })
    );

    const count = await fetchEndpointCount();
    expect(count).toBe(47);
  });

  it("returns 0 when API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const count = await fetchEndpointCount();
    expect(count).toBe(0);
  });

  it("returns 0 when API returns non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );

    const count = await fetchEndpointCount();
    expect(count).toBe(0);
  });
});

describe("Landing page components", () => {
  it("Hero component exports correctly", async () => {
    const mod = await import("../components/hero.js");
    expect(mod.Hero).toBeDefined();
    expect(typeof mod.Hero).toBe("function");
  });

  it("HowItWorks component exports correctly", async () => {
    const mod = await import("../components/how-it-works.js");
    expect(mod.HowItWorks).toBeDefined();
    expect(typeof mod.HowItWorks).toBe("function");
  });

  it("ForSellers component exports correctly", async () => {
    const mod = await import("../components/for-sellers.js");
    expect(mod.ForSellers).toBeDefined();
    expect(typeof mod.ForSellers).toBe("function");
  });

  it("ForAgents component exports correctly", async () => {
    const mod = await import("../components/for-agents.js");
    expect(mod.ForAgents).toBeDefined();
    expect(typeof mod.ForAgents).toBe("function");
  });

  it("Footer component exports correctly", async () => {
    const mod = await import("../components/footer.js");
    expect(mod.Footer).toBeDefined();
    expect(typeof mod.Footer).toBe("function");
  });
});
