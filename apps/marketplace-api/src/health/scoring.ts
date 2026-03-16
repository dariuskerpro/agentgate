/**
 * Uptime score computation and auto-deactivation logic.
 */
import type { HealthRepository } from "../repositories/health.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Compute uptime as a ratio (0.0 – 1.0) from all recorded health checks.
 */
export async function computeUptimeScore(
  endpointId: string,
  healthRepo: HealthRepository,
): Promise<number> {
  const checks = await healthRepo.findByEndpoint(endpointId);
  if (checks.length === 0) return 0;

  const upCount = checks.filter((c) => c.is_up === true).length;
  return upCount / checks.length;
}

/**
 * Returns true if the endpoint has been continuously down for > 24 hours.
 * "Continuously down" = every check in the last 24h is is_up: false,
 * AND there are checks spanning at least 24 hours.
 */
export async function shouldAutoDeactivate(
  endpointId: string,
  healthRepo: HealthRepository,
): Promise<boolean> {
  const checks = await healthRepo.findByEndpoint(endpointId);
  if (checks.length === 0) return false;

  // Checks are sorted newest-first by the repo
  // Find the most recent "up" check
  const lastUp = checks.find((c) => c.is_up === true);

  if (lastUp) {
    // If there's been any successful check, it's not continuously down
    // unless the last success was > 24h ago
    const timeSinceLastUp = Date.now() - lastUp.checked_at.getTime();
    return timeSinceLastUp > TWENTY_FOUR_HOURS_MS;
  }

  // No successful check ever — check if we have data spanning > 24h
  const oldest = checks[checks.length - 1];
  const newest = checks[0];
  const span = newest.checked_at.getTime() - oldest.checked_at.getTime();
  return span >= TWENTY_FOUR_HOURS_MS;
}
