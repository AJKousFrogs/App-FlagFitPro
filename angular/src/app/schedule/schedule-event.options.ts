/**
 * Schedule form option lists + label/class mapping.
 *
 * Pure and TestBed-free. Labels come from the canonical model constants
 * (ATHLETE_EVENT_*_LABEL) rather than being restated here, so the chips and the
 * list rows can never disagree about what a tier or kind is called.
 */
import {
  AthleteEvent,
  AthleteEventCategory,
  AthleteEventImportance,
  AthleteEventKind,
  AthleteEventTier,
  ATHLETE_EVENT_CATEGORY_LABEL,
  ATHLETE_EVENT_KIND_LABEL,
  ATHLETE_EVENT_TIER_LABEL,
} from "../core/models/athlete-event.models";

/** Importance suggested when a kind is picked; the athlete can still override. */
export const KIND_DEFAULT_IMPORTANCE: Record<
  AthleteEventKind,
  AthleteEventImportance
> = {
  gameday: "high",
  tournament: "peak",
  camp: "regular",
  friendly: "regular",
  training: "regular",
  other: "regular",
};

export const EVENT_CATEGORIES: { key: AthleteEventCategory; label: string }[] =
  [
    { key: "personal", label: "Personal" },
    { key: "domestic", label: "Domestic" },
    { key: "national", label: "National team" },
  ];

export const EVENT_KINDS: { key: AthleteEventKind; label: string }[] = [
  { key: "gameday", label: "Gameday" },
  { key: "tournament", label: "Tournament" },
  { key: "camp", label: "Camp" },
  { key: "friendly", label: "Friendly" },
  { key: "training", label: "Team training" },
  { key: "other", label: "Other" },
];

export const EVENT_IMPORTANCES: {
  key: AthleteEventImportance;
  label: string;
}[] = [
  { key: "regular", label: "Regular" },
  { key: "high", label: "High" },
  { key: "peak", label: "Peak" },
];

export const EVENT_TIERS: { key: AthleteEventTier; label: string }[] = [
  { key: null, label: "Camp / not applicable" },
  { key: "continental", label: ATHLETE_EVENT_TIER_LABEL.continental },
  { key: "world", label: ATHLETE_EVENT_TIER_LABEL.world },
  { key: "olympic", label: ATHLETE_EVENT_TIER_LABEL.olympic },
];

export function categoryLabel(c: AthleteEventCategory): string {
  return ATHLETE_EVENT_CATEGORY_LABEL[c];
}

export function kindLabel(k: AthleteEventKind): string {
  return ATHLETE_EVENT_KIND_LABEL[k];
}

/**
 * Prefer the specific tier ("World Championship") over the generic category
 * label ("National team") when one is set.
 */
export function tierLabel(ev: AthleteEvent): string {
  return ev.tier
    ? ATHLETE_EVENT_TIER_LABEL[ev.tier]
    : categoryLabel(ev.category);
}

/** Band colour for an event's importance. */
export function importanceClass(i: AthleteEventImportance): string {
  return i === "peak" ? "danger" : i === "high" ? "caution" : "info";
}
