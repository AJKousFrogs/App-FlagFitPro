import type {
  PrescriptionIntent,
  NutritionTargets,
} from "../core/models/prescription.models";

/**
 * How hard the day fuels. Derived from the engine's INTENT only — the actual
 * gram targets are the engine's (single source, CLAUDE.md §4); this bucket just
 * picks the food-first framing and the accent for the week strip. Pure.
 */
export type FuelBucket = "game" | "load" | "steady";

export function fuelBucket(intent: PrescriptionIntent): FuelBucket {
  switch (intent) {
    case "competition":
      return "game";
    case "rest":
    case "recovery":
    case "mobility":
    case "travel":
      return "steady";
    // technical / sprint / strength / mixed / taper-prime
    default:
      return "load";
  }
}

/** Human label for the bucket — plain, non-clinical. */
export function fuelBucketLabel(bucket: FuelBucket): string {
  switch (bucket) {
    case "game":
      return "Game fuel";
    case "load":
      return "Training fuel";
    case "steady":
      return "Steady day";
  }
}

/**
 * Food-first ideas to hit the day's targets (Law #3 — portions and plates, never
 * g/kg or calories at the athlete). Deliberately generic, cheap, locally-buyable
 * food. Presentational content, NOT a calculation: the numeric targets always
 * come from `NutritionTargets` (the engine). Same inputs → same list.
 */
export function fuelIdeas(
  intent: PrescriptionIntent,
  targets: NutritionTargets,
): string[] {
  const bucket = fuelBucket(intent);
  const ideas: string[] = [];

  if (bucket === "game") {
    ideas.push(
      "Breakfast 3 h before kickoff: oats or toast with honey and a banana.",
      "Between games: a rice cake or half a sandwich plus fruit — little and often.",
      "Straight after the last game: a chicken-and-rice bowl or a recovery shake.",
    );
  } else if (bucket === "load") {
    ideas.push(
      "Put a fist of rice, pasta or potato on the plate at lunch and dinner.",
      "Protein at every meal: a palm of chicken, fish, eggs, skyr or beans.",
      "Pre-session snack: a banana with a spoon of peanut butter, or Greek yogurt.",
    );
  } else {
    ideas.push(
      "Lighter on the starch today — fill half the plate with vegetables.",
      "Keep the protein up: eggs, fish, skyr or beans keep the muscle you built.",
      "Good day for whole foods and a bit less snacking — you're not burning as much.",
    );
  }

  // Hydration line, framed as a habit not a number-chase.
  if (targets.hydrationL >= 3) {
    ideas.push(
      "Hot or a heavy day — sip through the day and add a pinch of salt to one drink.",
    );
  }
  return ideas;
}
