/**
 * Athlete Event Models
 *
 * Athlete-entered schedule events (personal / domestic league / national-team
 * camps, tournaments, gamedays). Stored in `athlete_events`, served by
 * `/api/athlete-events`, and merged into the schedule snapshot so the
 * periodization engine tapers before and recovers after them.
 *
 * These are the athlete-owned counterpart to the shared competition spine
 * (see schedule.models.ts). The Schedule screen lets athletes manage these;
 * team competition events remain read-only.
 */

// Surface is a property of the event itself, not of who entered it — the
// canonical type lives on the schedule spine and is shared by both sources.
import type { PlayingSurface } from "./schedule.models";

export type { PlayingSurface };

/** Which level of the athlete's calendar an event belongs to. */
export type AthleteEventCategory = "personal" | "domestic" | "national";

/** Kind of event — drives default load expectations and copy. */
export type AthleteEventKind =
  | "gameday"
  | "tournament"
  | "camp"
  | "friendly"
  | "training"
  | "other";

/** How much the plan should peak for this event (taper/recovery depth). */
export type AthleteEventImportance = "regular" | "high" | "peak";

/**
 * Real competition tier for a national-team commitment (V2.4) — independent
 * of `category`. A Continental Championship (most players have one every
 * year), a World Championship (every ~2 years), and the Olympics (every 4)
 * all show up as `category: "national"`, but they deserve very different
 * taper/recovery depth. `null` = use the category-based default (see
 * ATHLETE_EVENT_LEVEL in schedule.js) — only meaningful when category is
 * "national".
 */
export type AthleteEventTier = "continental" | "world" | "olympic" | null;

export type AthleteEventStatus =
  | "scheduled"
  | "live"
  | "completed"
  | "cancelled"
  | "postponed";

export interface AthleteEvent {
  id: string;
  category: AthleteEventCategory;
  kind: AthleteEventKind;
  title: string;
  startsAt: string; // ISO timestamp
  endsAt: string | null;
  expectedGameCount: number;
  importance: AthleteEventImportance;
  tier: AthleteEventTier;
  location: string | null;
  venue: string | null;
  surface: PlayingSurface;
  notes: string | null;
  status: AthleteEventStatus;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating/updating an athlete event (PUT sends a subset). */
export interface AthleteEventInput {
  category: AthleteEventCategory;
  kind: AthleteEventKind;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  expectedGameCount?: number;
  importance?: AthleteEventImportance;
  tier?: AthleteEventTier;
  location?: string | null;
  venue?: string | null;
  surface?: PlayingSurface;
  notes?: string | null;
  status?: AthleteEventStatus;
}

export const ATHLETE_EVENT_CATEGORY_LABEL: Record<
  AthleteEventCategory,
  string
> = {
  personal: "Personal",
  domestic: "Domestic league",
  national: "National team",
};

export const ATHLETE_EVENT_KIND_LABEL: Record<AthleteEventKind, string> = {
  gameday: "Gameday",
  tournament: "Tournament",
  camp: "Camp",
  friendly: "Friendly",
  training: "Team training",
  other: "Other",
};

export const ATHLETE_EVENT_IMPORTANCE_LABEL: Record<
  AthleteEventImportance,
  string
> = {
  regular: "Regular",
  high: "High",
  peak: "Peak",
};

/** Non-null tier options only — the "not set" state is handled separately in the UI. */
export const ATHLETE_EVENT_TIER_LABEL: Record<
  Exclude<AthleteEventTier, null>,
  string
> = {
  continental: "Continental Championship",
  world: "World Championship",
  olympic: "Olympics",
};
