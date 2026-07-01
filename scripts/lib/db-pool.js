import { Pool } from "pg";

/** Shared pg Pool config for scripts/ one-off tooling (seeders, audits). */
export function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
}
