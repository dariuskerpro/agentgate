import { describe, it, expect } from 'vitest';
import { detectFramework } from '../lib/detect.js';
import { generateConfig, generateApiKey } from '../lib/config.js';
import { validateWalletAddress, parseRoutePrice } from '../lib/validate.js';
import { generateMiddlewareSnippet } from '../lib/snippets.js';

describe('detectFramework()', () => {
  it('detects Express from package.json dependencies', () => {
    const pkg = { dependencies: { express: '^4.18.0' } };
    expect(detectFramework(pkg)).toBe('express');
  });

  it('detects Next.js from package.json dependencies', () => {
    const pkg = { dependencies: { next: '^14.0.0' } };
    expect(detectFramework(pkg)).toBe('next');
  });

  it('detects Hono from package.json dependencies', () => {
    const pkg = { dependencies: { hono: '^4.0.0' } };
    expect(detectFramework(pkg)).toBe('hono');
  });

  it('returns null when no framework detected', () => {
    const pkg = { dependencies: { lodash: '^4.0.0' } };
    expect(detectFramework(pkg)).toBeNull();
  });
});

describe('generateApiKey()', () => {
  it('returns string matching ag_ + 32 hex chars pattern', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^ag_[0-9a-f]{32}$/);
  });

  it('generates unique keys on each call', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });
});

describe('generateConfig()', () => {
  const baseInput = {
    wallet: '0x1234567890abcdef1234567890abcdef12345678',
    apiKey: 'ag_abcdef1234567890abcdef1234567890',
    routes: {
      'GET /api/weather': { price: '$0.001', description: 'Weather data', category: 'data' },
    },
  };

  it('creates valid .agentgate.json structure with wallet, apiKey, routes', () => {
    const config = generateConfig(baseInput);
    expect(config).toHaveProperty('wallet', baseInput.wallet);
    expect(config).toHaveProperty('apiKey', baseInput.apiKey);
    expect(config).toHaveProperty('routes');
    expect(config.routes).toHaveProperty('GET /api/weather');
    expect(config.routes['GET /api/weather']).toHaveProperty('price', '$0.001');
  });

  it("includes network default of 'eip155:8453'", () => {
    const config = generateConfig(baseInput);
    expect(config.network).toBe('eip155:8453');
  });

  it('includes facilitator URL', () => {
    const config = generateConfig(baseInput);
    expect(config.facilitator).toBe('https://api.cdp.coinbase.com/platform/v2/x402');
  });
});

describe('validateWalletAddress()', () => {
  it('accepts valid 0x addresses (42 chars hex)', () => {
    expect(validateWalletAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    expect(validateWalletAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
  });

  it('rejects invalid addresses', () => {
    expect(validateWalletAddress('not-an-address')).toBe(false);
    expect(validateWalletAddress('0x123')).toBe(false);
    expect(validateWalletAddress('')).toBe(false);
    expect(validateWalletAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')).toBe(false);
  });
});

describe('parseRoutePrice()', () => {
  it("handles '$0.001' format", () => {
    expect(parseRoutePrice('$0.001')).toBe(0.001);
    expect(parseRoutePrice('$1.50')).toBe(1.5);
  });

  it("handles '0.001' format", () => {
    expect(parseRoutePrice('0.001')).toBe(0.001);
    expect(parseRoutePrice('5')).toBe(5);
  });

  it('returns null for invalid prices', () => {
    expect(parseRoutePrice('abc')).toBeNull();
    expect(parseRoutePrice('')).toBeNull();
    expect(parseRoutePrice('-1')).toBeNull();
  });
});

describe('generateMiddlewareSnippet()', () => {
  it('generates Express import/usage code', () => {
    const snippet = generateMiddlewareSnippet('express');
    expect(snippet).toContain("import { agentgate } from '@agentgate/middleware/express'");
    expect(snippet).toContain('app.use(agentgate())');
  });

  it('generates Hono import/usage code', () => {
    const snippet = generateMiddlewareSnippet('hono');
    expect(snippet).toContain("import { agentgate } from '@agentgate/middleware/hono'");
    expect(snippet).toContain("app.use('/*', agentgate())");
  });

  it('generates Next.js import/usage code', () => {
    const snippet = generateMiddlewareSnippet('next');
    expect(snippet).toContain("import { withAgentGate } from '@agentgate/middleware/next'");
    expect(snippet).toContain('withAgentGate');
  });
});
