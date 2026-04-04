/**
 * Realtime listen constants from @supabase/supabase-js, inlined so feature services
 * can use them with `import type` for Supabase types only — avoiding extra static
 * imports of `@supabase/supabase-js` that would duplicate or enlarge initial chunks.
 *
 * Keep in sync with: node -e "import('@supabase/supabase-js').then(m => ...)"
 */

export const REALTIME_LISTEN_TYPES = {
  BROADCAST: "broadcast",
  PRESENCE: "presence",
  POSTGRES_CHANGES: "postgres_changes",
  SYSTEM: "system",
} as const;

export const REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {
  ALL: "*",
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
