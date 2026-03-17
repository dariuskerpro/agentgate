import { describe, it, expect } from 'vitest';
import { getDynamicPrice } from '../lib/dynamic-pricing.js';
import { ENDPOINT_PRICING } from '../lib/pricing-config.js';

describe('getDynamicPrice', () => {
  describe('flat pricing endpoints', () => {
    it('returns fixed price for email-validate', () => {
      expect(getDynamicPrice('/v1/email-validate')).toBe('$0.0005');
    });

    it('returns fixed price for dns-lookup', () => {
      expect(getDynamicPrice('/v1/dns-lookup')).toBe('$0.0003');
    });

    it('returns fixed price for crypto-price', () => {
      expect(getDynamicPrice('/v1/crypto-price')).toBe('$0.0001');
    });

    it('returns fixed price for ip-geolocate', () => {
      expect(getDynamicPrice('/v1/ip-geolocate')).toBe('$0.0002');
    });

    it('returns same price regardless of body for flat endpoints', () => {
      const price1 = getDynamicPrice('/v1/email-validate', {});
      const price2 = getDynamicPrice('/v1/email-validate', { email: 'test@example.com' });
      expect(price1).toBe(price2);
    });
  });

  describe('provider_mapped pricing endpoints', () => {
    it('calculates dynamic price for code-review based on input', () => {
      const shortCode = getDynamicPrice('/v1/code-review', { code: 'const x = 1;' });
      const longCode = getDynamicPrice('/v1/code-review', { code: 'x'.repeat(40000) });
      // Long code should cost more
      const shortPrice = parseFloat(shortCode.replace('$', ''));
      const longPrice = parseFloat(longCode.replace('$', ''));
      expect(longPrice).toBeGreaterThan(shortPrice);
    });

    it('calculates dynamic price for code-review with array input', () => {
      const price = getDynamicPrice('/v1/code-review', {
        code: [{ content: 'function foo() {}' }, { content: 'function bar() {}' }],
      });
      const numPrice = parseFloat(price.replace('$', ''));
      expect(numPrice).toBeGreaterThan(0);
    });

    it('calculates dynamic price for transcript-to-prd', () => {
      const shortTranscript = getDynamicPrice('/v1/transcript-to-prd', { transcript: 'Hello world' });
      const longTranscript = getDynamicPrice('/v1/transcript-to-prd', { transcript: 'word '.repeat(10000) });
      const shortPrice = parseFloat(shortTranscript.replace('$', ''));
      const longPrice = parseFloat(longTranscript.replace('$', ''));
      expect(longPrice).toBeGreaterThan(shortPrice);
    });

    it('calculates dynamic price for transcribe with different audio sizes', () => {
      // Small audio (~10 seconds of base64)
      const smallAudio = getDynamicPrice('/v1/transcribe', { audio: 'A'.repeat(1000) });
      // Large audio (~10 minutes of base64)
      const largeAudio = getDynamicPrice('/v1/transcribe', { audio: 'A'.repeat(10000000) });
      const smallPrice = parseFloat(smallAudio.replace('$', ''));
      const largePrice = parseFloat(largeAudio.replace('$', ''));
      expect(largePrice).toBeGreaterThan(smallPrice);
    });

    it('uses default audio size when no audio in body for transcribe', () => {
      const price = getDynamicPrice('/v1/transcribe', {});
      const numPrice = parseFloat(price.replace('$', ''));
      expect(numPrice).toBeGreaterThan(0);
    });

    it('calculates dynamic price for pdf-extract', () => {
      const price = getDynamicPrice('/v1/pdf-extract', { pdf: 'A'.repeat(100000) });
      const numPrice = parseFloat(price.replace('$', ''));
      expect(numPrice).toBeGreaterThan(0);
    });

    it('calculates dynamic price for scrape-enrich', () => {
      const price = getDynamicPrice('/v1/scrape-enrich', { url: 'https://example.com' });
      const numPrice = parseFloat(price.replace('$', ''));
      expect(numPrice).toBeGreaterThan(0);
    });
  });

  describe('unknown paths', () => {
    it('returns fallback price for unknown path', () => {
      expect(getDynamicPrice('/v1/unknown')).toBe('$0.01');
    });
  });

  describe('all configured endpoints', () => {
    it('every endpoint in ENDPOINT_PRICING returns a valid price', () => {
      for (const path of Object.keys(ENDPOINT_PRICING)) {
        const price = getDynamicPrice(path, {});
        expect(price).toMatch(/^\$[\d.]+$/);
        const numPrice = parseFloat(price.replace('$', ''));
        expect(numPrice).toBeGreaterThan(0);
      }
    });
  });
});
