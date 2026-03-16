/**
 * Health check repository — stores and queries endpoint health records.
 */
import type { EndpointHealth } from "./types.js";

export interface HealthRepository {
  record(data: EndpointHealth): Promise<void>;
  findByEndpoint(endpointId: string): Promise<EndpointHealth[]>;
  findRecentByEndpoint(endpointId: string, since: Date): Promise<EndpointHealth[]>;
}

/**
 * In-memory mock for testing.
 */
export class MockHealthRepository implements HealthRepository {
  public records: EndpointHealth[] = [];

  async record(data: EndpointHealth): Promise<void> {
    this.records.push(data);
  }

  async findByEndpoint(endpointId: string): Promise<EndpointHealth[]> {
    return this.records
      .filter((r) => r.endpoint_id === endpointId)
      .sort((a, b) => b.checked_at.getTime() - a.checked_at.getTime());
  }

  async findRecentByEndpoint(endpointId: string, since: Date): Promise<EndpointHealth[]> {
    return this.records
      .filter((r) => r.endpoint_id === endpointId && r.checked_at >= since)
      .sort((a, b) => b.checked_at.getTime() - a.checked_at.getTime());
  }
}
