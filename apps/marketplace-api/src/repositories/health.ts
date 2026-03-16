/**
 * Health check repository — stores and queries endpoint health records.
 */
import { eq, and, gte, desc } from "drizzle-orm";
import type { Database } from "../db/index.js";
import { schema } from "../db/index.js";
import type { EndpointHealth } from "./types.js";

export interface HealthRepository {
  record(data: EndpointHealth): Promise<void>;
  findByEndpoint(endpointId: string): Promise<EndpointHealth[]>;
  findRecentByEndpoint(
    endpointId: string,
    since: Date,
  ): Promise<EndpointHealth[]>;
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

  async findRecentByEndpoint(
    endpointId: string,
    since: Date,
  ): Promise<EndpointHealth[]> {
    return this.records
      .filter(
        (r) => r.endpoint_id === endpointId && r.checked_at >= since,
      )
      .sort((a, b) => b.checked_at.getTime() - a.checked_at.getTime());
  }
}

/**
 * Real Drizzle ORM implementation.
 */
export class DrizzleHealthRepository implements HealthRepository {
  constructor(private db: Database) {}

  async record(data: EndpointHealth): Promise<void> {
    await this.db.insert(schema.endpointHealth).values({
      endpoint_id: data.endpoint_id,
      checked_at: data.checked_at,
      status_code: data.status_code,
      latency_ms: data.latency_ms,
      is_up: data.is_up,
    });
  }

  async findByEndpoint(endpointId: string): Promise<EndpointHealth[]> {
    const rows = await this.db
      .select()
      .from(schema.endpointHealth)
      .where(eq(schema.endpointHealth.endpoint_id, endpointId))
      .orderBy(desc(schema.endpointHealth.checked_at));
    return rows.map((r) => this.toHealth(r));
  }

  async findRecentByEndpoint(
    endpointId: string,
    since: Date,
  ): Promise<EndpointHealth[]> {
    const rows = await this.db
      .select()
      .from(schema.endpointHealth)
      .where(
        and(
          eq(schema.endpointHealth.endpoint_id, endpointId),
          gte(schema.endpointHealth.checked_at, since),
        ),
      )
      .orderBy(desc(schema.endpointHealth.checked_at));
    return rows.map((r) => this.toHealth(r));
  }

  private toHealth(
    row: typeof schema.endpointHealth.$inferSelect,
  ): EndpointHealth {
    return {
      endpoint_id: row.endpoint_id,
      checked_at: row.checked_at,
      status_code: row.status_code,
      latency_ms: row.latency_ms,
      is_up: row.is_up,
    };
  }
}
