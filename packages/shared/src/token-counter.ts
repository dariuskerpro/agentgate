/**
 * Fast text token estimate: chars / 4 (good enough for pricing).
 */
export function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate audio duration in minutes from file size in bytes.
 * Assumes ~128kbps encoding (16KB per second).
 */
export function estimateAudioMinutes(fileSizeBytes: number): number {
  const bytesPerSecond = 16_000;
  const seconds = fileSizeBytes / bytesPerSecond;
  return seconds / 60;
}

/**
 * Estimate PDF pages from file size in bytes.
 * ~50KB per page average.
 */
export function estimatePdfPages(fileSizeBytes: number): number {
  return Math.max(1, Math.round(fileSizeBytes / 50_000));
}

/**
 * Estimate tokens from PDF pages. ~500 tokens per page.
 */
export function estimatePdfTokens(fileSizeBytes: number): number {
  return estimatePdfPages(fileSizeBytes) * 500;
}
