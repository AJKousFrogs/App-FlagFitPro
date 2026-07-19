/**
 * Daily wellness check-in — Signal Forms schema (2026-07-19).
 *
 * Second Signal Forms migration. HONEST SCOPE: unlike device-data (which moved
 * a real "never write an all-null row" rule out of a disabled button), these
 * six are always-valid range sliders — there is no submit gate to consolidate.
 * The wins here are narrower and worth stating so nobody over-reads them:
 *
 *   1. the min/max bounds live in ONE place. They used to be loose HTML `min`/
 *      `max` attributes on each <input type="range">, unconnected to anything;
 *      now they're `min()`/`max()` validators the directive PROJECTS back onto
 *      the inputs (the same NG8022 mechanism device-data hit). One source.
 *   2. six sibling signals collapse into one model, so prefill is one
 *      `model.set()` instead of six `.set()` calls.
 *
 * The soreness soft-gate (high soreness → prompt a body check) is business
 * logic in the component, NOT form validation, and stays there — it reads
 * `model().soreness`.
 */

import { schema, min, max } from "@angular/forms/signals";

export interface WellnessCheckinForm {
  sleepQuality: number; // 1–10
  sleepHours: number; // 0–12, half-hour steps
  soreness: number; // 1–10
  energy: number; // 1–10
  mood: number; // 1–10
  stress: number; // 1–10
}

/**
 * Defaults match the pre-migration slider seeds exactly — a mid-range start so
 * the athlete nudges from a neutral position rather than an implied "0 = bad".
 */
export function defaultWellnessCheckin(): WellnessCheckinForm {
  return {
    sleepQuality: 7,
    sleepHours: 7.5,
    soreness: 4,
    energy: 6,
    mood: 7,
    stress: 3,
  };
}

/** The [min, max] each field is bound to — one source, asserted in the spec. */
export const WELLNESS_FIELD_BOUNDS = {
  sleepQuality: [1, 10],
  sleepHours: [0, 12],
  soreness: [1, 10],
  energy: [1, 10],
  mood: [1, 10],
  stress: [1, 10],
} as const satisfies Record<
  keyof WellnessCheckinForm,
  readonly [number, number]
>;

export const wellnessCheckinSchema = schema<WellnessCheckinForm>((path) => {
  for (const key of Object.keys(
    WELLNESS_FIELD_BOUNDS,
  ) as (keyof WellnessCheckinForm)[]) {
    const [lo, hi] = WELLNESS_FIELD_BOUNDS[key];
    min(path[key], lo);
    max(path[key], hi);
  }
});
