/**
 * Transaction repository — real DB implementation (placeholder).
 * Will be wired to Drizzle ORM in production.
 */
export { MockTransactionRepository as TransactionRepository } from "./mock.js";
