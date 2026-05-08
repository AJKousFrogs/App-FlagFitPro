/**
 * Hydration logging models.
 *
 * One row in `public.athlete_hydration_logs` per drink. Powers the
 * hydration progress UI on Today and tournament-nutrition, and is the
 * write target for push-notification acknowledgements and wearable syncs.
 *
 * The DB-side constraint set is mirrored here so the client knows what
 * the server will accept without round-tripping a 422.
 */

/**
 * Beverage categories the server accepts. Adding a new one requires a
 * migration that extends `athlete_hydration_logs_beverage_type_chk`.
 */
export type HydrationBeverageType =
  | "water"
  | "electrolyte"
  | "sports-drink"
  | "smoothie"
  | "protein-shake"
  | "coconut"
  | "other";

/**
 * Where the log entry came from. Drives analytics on push-notification
 * adherence and wearable-vs-manual reliability.
 */
export type HydrationSource =
  | "manual"
  | "push_notification"
  | "wearable"
  | "voice";

/**
 * Server row shape. `id` and timestamps are populated server-side; the
 * client constructs the insert body via {@link HydrationLogInput}.
 */
export interface HydrationLog {
  id: string;
  userId: string;
  loggedAt: string; // ISO timestamp
  amountMl: number;
  beverageType: HydrationBeverageType;
  note: string | null;
  source: HydrationSource;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Insert payload. `loggedAt` defaults to `now()` server-side when omitted —
 * the client only sets it when back-dating a forgotten log entry.
 */
export interface HydrationLogInput {
  amountMl: number;
  beverageType?: HydrationBeverageType;
  note?: string;
  source?: HydrationSource;
  loggedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Minimum and maximum the DB constraint accepts. Mirroring here lets the
 * client validate and surface a friendly error before a network round-trip.
 */
export const HYDRATION_AMOUNT_MIN_ML = 1;
export const HYDRATION_AMOUNT_MAX_ML = 5000;
