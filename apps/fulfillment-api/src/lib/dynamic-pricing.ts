import {
  calculatePrice, formatPriceForX402,
  estimateTextTokens, estimateAudioMinutes, estimatePdfTokens,
} from '@agent-gate/shared';
import type { PricingInput, ProviderRate } from '@agent-gate/shared';
import { ENDPOINT_PRICING, PROVIDER_RATES } from './pricing-config.js';

const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

/**
 * Estimate input size from the request body for a given endpoint path.
 */
function estimateInput(path: string, body: Record<string, unknown>): PricingInput {
  switch (path) {
    case '/v1/code-review': {
      const code = body.code;
      let text = '';
      if (typeof code === 'string') text = code;
      else if (Array.isArray(code)) text = code.map((f: any) => f.content || '').join('');
      return {
        input_tokens: estimateTextTokens(text),
        max_output_tokens: (body.max_tokens as number) || DEFAULT_MAX_OUTPUT_TOKENS,
      };
    }
    case '/v1/transcript-to-prd': {
      const transcript = (body.transcript as string) || '';
      return {
        input_tokens: estimateTextTokens(transcript),
        max_output_tokens: (body.max_tokens as number) || DEFAULT_MAX_OUTPUT_TOKENS,
      };
    }
    case '/v1/scrape-enrich': {
      // Scrape+enrich: input is small (a URL), output is where the cost is
      return {
        input_tokens: 500,
        max_output_tokens: (body.max_tokens as number) || DEFAULT_MAX_OUTPUT_TOKENS,
      };
    }
    case '/v1/transcribe': {
      // Audio size comes from Content-Length header at request time
      // For body-based requests, estimate from base64 size
      const audioBase64 = (body.audio as string) || '';
      const audioBytes = audioBase64 ? Math.ceil(audioBase64.length * 0.75) : 60 * 16000; // default 1 min
      return { input_minutes: estimateAudioMinutes(audioBytes) };
    }
    case '/v1/pdf-extract': {
      const pdfBase64 = (body.pdf as string) || (body.file as string) || '';
      const pdfBytes = pdfBase64 ? Math.ceil(pdfBase64.length * 0.75) : 50000; // default 1 page
      return {
        input_tokens: estimatePdfTokens(pdfBytes),
        max_output_tokens: (body.max_tokens as number) || DEFAULT_MAX_OUTPUT_TOKENS,
      };
    }
    default:
      return {};
  }
}

/**
 * Get the dynamic price string for a given endpoint path and request body.
 * Returns formatted price string like "$0.0234" for x402.
 */
export function getDynamicPrice(path: string, body: Record<string, unknown> = {}): string {
  const config = ENDPOINT_PRICING[path];
  if (!config) return '$0.01'; // fallback

  if (config.pricing_mode === 'flat') {
    return formatPriceForX402(config.price);
  }

  const input = estimateInput(path, body);
  let providerRate: ProviderRate | undefined;

  if (config.pricing_mode === 'provider_mapped') {
    const key = `${config.provider}/${config.model}`;
    providerRate = PROVIDER_RATES[key];
    if (!providerRate) {
      console.warn(`No provider rate found for ${key}, falling back to min_charge`);
      return formatPriceForX402(config.min_charge);
    }
  }

  const price = calculatePrice(config, input, providerRate);
  return formatPriceForX402(price);
}
