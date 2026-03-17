import type { PricingConfig, ProviderRate } from '@agent-gate/shared';

// Provider rates — cached in memory, same as DB seed data
// In future, fetch from marketplace API or shared DB
export const PROVIDER_RATES: Record<string, ProviderRate> = {
  'anthropic/claude-sonnet-4': {
    provider: 'anthropic', model: 'claude-sonnet-4',
    input_rate_per_1k: 0.003, output_rate_per_1k: 0.015, unit: 'tokens',
  },
  'openai/whisper-1': {
    provider: 'openai', model: 'whisper-1',
    input_rate_per_1k: 0.006, output_rate_per_1k: null, unit: 'minutes',
  },
  'openai/gpt-4.1-mini': {
    provider: 'openai', model: 'gpt-4.1-mini',
    input_rate_per_1k: 0.0004, output_rate_per_1k: 0.0016, unit: 'tokens',
  },
  'google/gemini-2.5-flash': {
    provider: 'google', model: 'gemini-2.5-flash',
    input_rate_per_1k: 0.00015, output_rate_per_1k: 0.0035, unit: 'tokens',
  },
};

// Endpoint pricing configs
export const ENDPOINT_PRICING: Record<string, PricingConfig> = {
  // AI inference — provider_mapped
  '/v1/code-review': {
    pricing_mode: 'provider_mapped', provider: 'anthropic', model: 'claude-sonnet-4',
    markup_percent: 3, min_charge: 0.001,
  },
  '/v1/transcript-to-prd': {
    pricing_mode: 'provider_mapped', provider: 'anthropic', model: 'claude-sonnet-4',
    markup_percent: 3, min_charge: 0.001,
  },
  '/v1/transcribe': {
    pricing_mode: 'provider_mapped', provider: 'openai', model: 'whisper-1',
    markup_percent: 3, min_charge: 0.001,
  },
  '/v1/scrape-enrich': {
    pricing_mode: 'provider_mapped', provider: 'openai', model: 'gpt-4.1-mini',
    markup_percent: 3, min_charge: 0.001,
  },
  '/v1/pdf-extract': {
    pricing_mode: 'provider_mapped', provider: 'google', model: 'gemini-2.5-flash',
    markup_percent: 3, min_charge: 0.001,
  },
  // Utility — flat pricing
  '/v1/email-validate': { pricing_mode: 'flat', price: 0.0005 },
  '/v1/dns-lookup': { pricing_mode: 'flat', price: 0.0003 },
  '/v1/url-metadata': { pricing_mode: 'flat', price: 0.0005 },
  '/v1/phone-validate': { pricing_mode: 'flat', price: 0.0003 },
  '/v1/crypto-price': { pricing_mode: 'flat', price: 0.0001 },
  '/v1/ip-geolocate': { pricing_mode: 'flat', price: 0.0002 },
};
