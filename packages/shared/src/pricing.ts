export type PricingMode = 'flat' | 'provider_mapped' | 'custom_token';

export interface ProviderRate {
  provider: string;
  model: string;
  input_rate_per_1k: number;
  output_rate_per_1k: number | null;
  unit: 'tokens' | 'minutes' | 'pages';
}

export interface FlatPricingConfig {
  pricing_mode: 'flat';
  price: number;
}

export interface ProviderMappedPricingConfig {
  pricing_mode: 'provider_mapped';
  provider: string;
  model: string;
  markup_percent: number;
  min_charge: number;
}

export interface CustomTokenPricingConfig {
  pricing_mode: 'custom_token';
  input_rate_per_1k: number;
  output_rate_per_1k: number;
  min_charge: number;
}

export type PricingConfig =
  | FlatPricingConfig
  | ProviderMappedPricingConfig
  | CustomTokenPricingConfig;

export interface PricingInput {
  input_tokens?: number;
  input_minutes?: number;
  input_pages?: number;
  max_output_tokens?: number;
}

/**
 * Calculate price for a request.
 * For provider_mapped, requires the rate to be passed in (looked up from DB/cache externally).
 * Returns price in USD as a number.
 */
export function calculatePrice(
  config: PricingConfig,
  input: PricingInput,
  providerRate?: ProviderRate,
): number {
  switch (config.pricing_mode) {
    case 'flat':
      return config.price;

    case 'provider_mapped': {
      if (!providerRate) {
        throw new Error(
          'providerRate is required for provider_mapped pricing',
        );
      }
      const markup = 1 + config.markup_percent / 100;
      let price = 0;

      if (providerRate.unit === 'tokens') {
        const inputTokens = input.input_tokens ?? 0;
        const outputTokens = input.max_output_tokens ?? 0;
        const inputCost =
          (inputTokens / 1000) * providerRate.input_rate_per_1k * markup;
        const outputCost =
          (outputTokens / 1000) *
          (providerRate.output_rate_per_1k ?? 0) *
          markup;
        price = inputCost + outputCost;
      } else if (providerRate.unit === 'minutes') {
        const minutes = input.input_minutes ?? 0;
        price = minutes * providerRate.input_rate_per_1k * markup;
      } else if (providerRate.unit === 'pages') {
        const pages = input.input_pages ?? 0;
        price = pages * providerRate.input_rate_per_1k * markup;
      }

      return Math.max(price, config.min_charge);
    }

    case 'custom_token': {
      const inputTokens = input.input_tokens ?? 0;
      const outputTokens = input.max_output_tokens ?? 0;
      const inputCost =
        (inputTokens / 1000) * config.input_rate_per_1k;
      const outputCost =
        (outputTokens / 1000) * config.output_rate_per_1k;
      const price = inputCost + outputCost;
      return Math.max(price, config.min_charge);
    }

    default:
      throw new Error(
        `Unknown pricing mode: ${(config as PricingConfig).pricing_mode}`,
      );
  }
}

/**
 * Format a price number as a dollar string for x402 (e.g., "$0.0234").
 */
export function formatPriceForX402(price: number): string {
  return `$${price}`;
}
