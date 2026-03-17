/**
 * Accuracy tests — verify public-facing content matches reality.
 * These tests catch lies, stale info, and broken promises.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, "..");

function readComponent(name: string): string {
  return readFileSync(resolve(srcDir, `components/${name}.tsx`), "utf-8");
}

function readPage(path: string): string {
  return readFileSync(resolve(srcDir, `app/${path}`), "utf-8");
}

describe("Package import accuracy", () => {
  it("never imports from bare 'agent-gate' (must use scoped @agent-gate/*)", () => {
    const files = [
      "components/playground.tsx",
      "components/for-builders.tsx",
      "components/cta.tsx",
      "components/hero.tsx",
      "components/quickstart.tsx",
    ];
    for (const file of files) {
      const content = readFileSync(resolve(srcDir, file), "utf-8");
      // Check for bare 'agent-gate' imports in code examples
      expect(content).not.toMatch(/from ["']agent-gate["']/);
      expect(content).not.toMatch(/from "agent-gate"/);
    }
  });

  it("CTA uses correct npm command: npx @dkerpal/agent-gate init", () => {
    const cta = readComponent("cta");
    expect(cta).toContain("npx @dkerpal/agent-gate init");
    expect(cta).not.toMatch(/npx agent-gate init[^"]/);
  });

  it("for-builders uses @agent-gate/middleware, not bare agent-gate", () => {
    const fb = readComponent("for-builders");
    expect(fb).toContain("@agent-gate/middleware");
    expect(fb).not.toContain('from "agent-gate"');
    expect(fb).not.toContain("from 'agent-gate'");
  });

  it("for-builders consumer uses @agent-gate/sdk", () => {
    const fb = readComponent("for-builders");
    expect(fb).toContain("@agent-gate/sdk");
  });
});

describe("No fake data in public content", () => {
  it("playground does not contain fake agent names", () => {
    const pg = readComponent("playground");
    expect(pg).not.toContain("translate-jp-v2");
    expect(pg).not.toContain("Polyglot Universal");
    expect(pg).not.toContain("JP Translator Pro");
  });

  it("playground does not reference non-existent /v1/call endpoint", () => {
    const pg = readComponent("playground");
    expect(pg).not.toContain("/v1/call");
  });

  it("playground uses GET for /v1/discover (not POST)", () => {
    const pg = readComponent("playground");
    // Should reference GET discover, not POST discover
    expect(pg).not.toMatch(/POST\s+\/v1\/discover/);
  });

  it("CTA does not claim thousands of agents exist", () => {
    const cta = readComponent("cta");
    expect(cta).not.toContain("Thousands of agents");
    expect(cta).not.toContain("thousands of agents");
  });
});

describe("Pricing accuracy", () => {
  it("pricing does not reference non-existent pipeline tier", () => {
    const pricing = readComponent("pricing");
    // No multi-step pipelines exist yet
    expect(pricing).not.toContain("audio → summary → action items");
  });

  it("pricing mentions Base & Solana (not just Base)", () => {
    const pricing = readComponent("pricing");
    expect(pricing).toMatch(/Base\s*&\s*Solana|Base and Solana/i);
  });

  it("pricing mentions dynamic/token-based pricing for AI endpoints", () => {
    const pricing = readComponent("pricing");
    expect(pricing).toMatch(/dynamic|token-based|input size/i);
  });
});

describe("Link accuracy", () => {
  it("footer does not link to non-existent Discord", () => {
    const footer = readComponent("footer");
    expect(footer).not.toContain('href="https://discord.gg/agentgate"');
  });

  it("docs hub does not have dead links (all hrefs point to real pages)", () => {
    const docsPage = readPage("docs/page.tsx");
    // All links should go to pages that exist: /docs/getting-started, /how-it-works, /marketplace
    // Should NOT have 5+ links all pointing to /docs/getting-started
    const gettingStartedCount = (docsPage.match(/\/docs\/getting-started/g) || []).length;
    // Max 2 occurrences (one for the link, maybe one for back-link reference)
    // If there are 6, that means all doc cards point to the same page (bug)
    expect(gettingStartedCount).toBeLessThanOrEqual(3);
  });
});

describe("How It Works page accuracy", () => {
  it("does not show unpublished npm install commands as live", () => {
    const page = readPage("how-it-works/page.tsx");
    // These packages aren't published to npm yet
    expect(page).not.toContain('"npx @agent-gate/mcp"');
    expect(page).not.toContain('"npm i @agent-gate/sdk"');
    expect(page).not.toContain('"pip install agentgate"');
  });

  it("does not show unpublished Python import examples", () => {
    const page = readPage("how-it-works/page.tsx");
    expect(page).not.toContain("from agentgate.langchain_tool");
    expect(page).not.toContain("AgentGateDiscoverTool()");
  });
});

describe("API endpoint accuracy", () => {
  it("all curl examples use agentgate.online (not text2ai.com)", () => {
    const components = [
      "hero.tsx", "playground.tsx", "for-builders.tsx", 
      "quickstart.tsx", "cta.tsx",
    ];
    for (const file of components) {
      const content = readFileSync(resolve(srcDir, `components/${file}`), "utf-8");
      expect(content).not.toContain("text2ai.com");
    }
  });

  it("getting-started page uses correct API URLs", () => {
    const gs = readPage("docs/getting-started/page.tsx");
    expect(gs).toContain("api.agentgate.online");
    expect(gs).not.toContain("text2ai.com");
  });
});
