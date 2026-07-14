// Server-side cohort resolution (2026-07-14, audit batch 4 — the backend half
// of the derived-cohort system; completes LOGIC §10's documented migration).
// The client derives its preset in EvidenceConfigService (derivePresetId);
// THIS module is the server-canonical mirror, drift-guarded by
// tests/unit/acwr-config-drift.test.js: the derivation rule and every
// threshold must equal the client presets exactly, or CI fails.

import { ageFromDob } from "./age.js";

/**
 * Cohort ACWR thresholds — server-canonical MIRROR of the client evidence
 * presets (evidence-presets.ts). Youth/masters/RTP only ever TIGHTEN vs the
 * adult baseline (the safe direction — a cohort may never loosen a guard).
 */
export const COHORT_ACWR_THRESHOLDS = Object.freeze({
  adult_flag_competitive_v1: Object.freeze({
    sweetSpotLow: 0.8,
    sweetSpotHigh: 1.3,
    dangerHigh: 1.5,
  }),
  youth_flag_v1: Object.freeze({
    sweetSpotLow: 0.8,
    sweetSpotHigh: 1.2,
    dangerHigh: 1.4,
  }),
  masters_flag_v1: Object.freeze({
    sweetSpotLow: 0.8,
    sweetSpotHigh: 1.2,
    dangerHigh: 1.4,
  }),
  return_to_play_v1: Object.freeze({
    sweetSpotLow: 0.7,
    sweetSpotHigh: 1.1,
    dangerHigh: 1.3,
  }),
});

export const DEFAULT_COHORT_ID = "adult_flag_competitive_v1";

/**
 * The derivation rule — MUST match the client's derivePresetId exactly
 * (drift-guarded): active RTP beats everything; then age bands; unknown age →
 * adult (the baseline — never a fabricated cohort).
 */
export function deriveCohortPresetId(ageYears, hasActiveRtp) {
  if (hasActiveRtp) {
    return "return_to_play_v1";
  }
  if (ageYears !== null && ageYears < 18) {
    return "youth_flag_v1";
  }
  if (ageYears !== null && ageYears >= 35) {
    return "masters_flag_v1";
  }
  return DEFAULT_COHORT_ID;
}

/**
 * Resolve an athlete's cohort from live data (users.date_of_birth + active
 * return_to_play_protocols). Non-fatal by design: any read failure → the
 * adult baseline, never a blocked readiness calculation.
 */
export async function resolveCohort(supabase, athleteId) {
  const fallback = {
    presetId: DEFAULT_COHORT_ID,
    thresholds: COHORT_ACWR_THRESHOLDS[DEFAULT_COHORT_ID],
  };
  try {
    const [userRow, rtpRows] = await Promise.all([
      supabase
        .from("users")
        .select("date_of_birth, birth_date")
        .eq("id", athleteId)
        .maybeSingle(),
      supabase
        .from("return_to_play_protocols")
        .select("id")
        .eq("user_id", athleteId)
        .eq("status", "active")
        .limit(1),
    ]);
    const dob = userRow?.data?.date_of_birth ?? userRow?.data?.birth_date;
    const age = ageFromDob(dob ?? null);
    const hasRtp = (rtpRows?.data ?? []).length > 0;
    const presetId = deriveCohortPresetId(age, hasRtp);
    return {
      presetId,
      thresholds: COHORT_ACWR_THRESHOLDS[presetId] ?? fallback.thresholds,
    };
  } catch {
    return fallback;
  }
}
