/**
 * Validation helpers for CLI inputs
 */

const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Validate an Ethereum wallet address (0x + 40 hex chars = 42 total).
 */
export function validateWalletAddress(address: string): boolean {
  return WALLET_REGEX.test(address);
}

/**
 * Parse a route price string into a number.
 * Accepts "$0.001" or "0.001" formats.
 * Returns null for invalid or negative prices.
 */
export function parseRoutePrice(price: string): number | null {
  if (!price || price.trim() === '') return null;

  const cleaned = price.startsWith('$') ? price.slice(1) : price;
  const num = Number(cleaned);

  if (Number.isNaN(num) || num <= 0) return null;

  return num;
}
