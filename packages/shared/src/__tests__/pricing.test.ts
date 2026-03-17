import { describe, it, expect } from 'vitest';
import {
  calculatePrice,
  formatPriceForX402,
  type FlatPricingConfig,
  type ProviderMappedPricingConfig,
  type CustomTokenPricingConfig,
  type ProviderRate,
} from '../pricing.js';

describe('calculatePrice', () => {
  describe('flat pricing', () => {
    const config: FlatPricingConfig = { pricing_mode: 'flat', price: 0.05 };

    it('returns the static price regardless of input', () => {
      expect(calculatePrice(config, {})).toBe(0.05);
      expect(calculatePrice(config, { input_tokens: 10000 })).toBe(0.05);
    });
  });

  describe('provider_mapped pricing', () => {
    const config: ProviderMappedPricingConfig = {
      pricing_mode: 'provider_mapped',
      provider: 'openai',
      model: 'gpt-4o',
      markup_percent: 20,
      min_charge: 0.001,
    };

    const tokenRate: ProviderRate = {
      provider: 'openai',
      model: 'gpt-4o',
      input_rate_per_1k: 0.005,
      output_rate_per_1k: 0.015,
      unit: 'tokens',
    };

    it('calculates token-based pricing with markup', () => {
      const price = calculatePrice(
        config,
        { input_tokens: 1000, max_output_tokens: 500 },
        tokenRate,
      );
      // input: (1000/1000) * 0.005 * 1.2 = 0.006
      // output: (500/1000) * 0.015 * 1.2 = 0.009
      // total: 0.015
      expect(price).toBeCloseTo(0.015, 10);
    });

    it('calculates audio/minutes pricing with markup', () => {
      const audioRate: ProviderRate = {
        provider: 'openai',
        model: 'whisper-1',
        input_rate_per_1k: 0.006, // per minute
        output_rate_per_1k: null,
        unit: 'minutes',
      };
      const price = calculatePrice(
        config,
        { input_minutes: 5 },
        audioRate,
      );
      // 5 * 0.006 * 1.2 = 0.036
      expect(price).toBeCloseTo(0.036, 10);
    });

    it('respects min_charge', () => {
      const price = calculatePrice(
        config,
        { input_tokens: 1, max_output_tokens: 0 },
        tokenRate,
      );
      // (1/1000) * 0.005 * 1.2 = 0.000006 → below min_charge 0.001
      expect(price).toBe(0.001);
    });

    it('throws without providerRate', () => {
      expect(() => calculatePrice(config, { input_tokens: 100 })).toThrow(
        'providerRate is required',
      );
    });

    it('handles zero tokens', () => {
      const price = calculatePrice(
        config,
        { input_tokens: 0, max_output_tokens: 0 },
        tokenRate,
      );
      // 0 → min_charge
      expect(price).toBe(0.001);
    });
  });

  describe('custom_token pricing', () => {
    const config: CustomTokenPricingConfig = {
      pricing_mode: 'custom_token',
      input_rate_per_1k: 0.01,
      output_rate_per_1k: 0.03,
      min_charge: 0.002,
    };

    it('calculates without markup', () => {
      const price = calculatePrice(config, {
        input_tokens: 2000,
        max_output_tokens: 1000,
      });
      // input: (2000/1000) * 0.01 = 0.02
      // output: (1000/1000) * 0.03 = 0.03
      // total: 0.05
      expect(price).toBeCloseTo(0.05, 10);
    });

    it('respects min_charge', () => {
      const price = calculatePrice(config, {
        input_tokens: 1,
        max_output_tokens: 0,
      });
      // (1/1000) * 0.01 = 0.00001 → below min_charge 0.002
      expect(price).toBe(0.002);
    });

    it('handles missing input fields as zero', () => {
      const price = calculatePrice(config, {});
      // 0 + 0 → min_charge
      expect(price).toBe(0.002);
    });

    it('handles very large inputs', () => {
      const price = calculatePrice(config, {
        input_tokens: 1_000_000,
        max_output_tokens: 500_000,
      });
      // input: 1000 * 0.01 = 10
      // output: 500 * 0.03 = 15
      // total: 25
      expect(price).toBe(25);
    });
  });
});

describe('formatPriceForX402', () => {
  it('formats price as dollar string', () => {
    expect(formatPriceForX402(0.00309)).toBe('$0.00309');
    expect(formatPriceForX402(0.05)).toBe('$0.05');
    expect(formatPriceForX402(1.5)).toBe('$1.5');
    expect(formatPriceForX402(0)).toBe('$0');
  });
});
