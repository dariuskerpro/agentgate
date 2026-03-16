/**
 * Endpoint repository — real DB implementation (placeholder).
 * Will be wired to Drizzle ORM in production.
 */
export { MockEndpointRepository as EndpointRepository } from "./mock.js";
