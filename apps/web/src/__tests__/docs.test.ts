import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = resolve(__dirname, "../content/docs");

const docFiles = [
  "getting-started.md",
  "middleware-reference.md",
  "discovery-api.md",
  "pricing-guide.md",
  "architecture.md",
  "faq.md",
];

describe("Documentation files (AG-013)", () => {
  for (const file of docFiles) {
    it(`${file} exists and is non-empty`, () => {
      const path = resolve(docsDir, file);
      const stat = statSync(path);
      expect(stat.size).toBeGreaterThan(0);
    });
  }

  it('getting-started.md contains "npx agentgate init"', () => {
    const content = readFileSync(resolve(docsDir, "getting-started.md"), "utf-8");
    expect(content).toContain("npx agentgate init");
  });

  it("discovery-api.md contains all endpoint paths", () => {
    const content = readFileSync(resolve(docsDir, "discovery-api.md"), "utf-8");
    const requiredPaths = [
      "/v1/discover",
      "/v1/discover/:id",
      "/v1/discover/categories",
      "/v1/sellers/register",
      "/v1/sellers/me",
      "/v1/endpoints",
      "/v1/endpoints/:id",
      "/v1/endpoints/mine",
      "/v1/events/transaction",
    ];
    for (const path of requiredPaths) {
      expect(content).toContain(path);
    }
  });
});
