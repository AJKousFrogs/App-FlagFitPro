/**
 * Safety Override Detection and Enforcement
 * Contract: Data Consent & Visibility Contract v1, Section 4
 */

import { supabaseAdmin } from "../utils/supabase-client.js";

/**
 * CANONICAL soreness pain-trigger threshold. Soreness STRICTLY GREATER THAN this
 * fires detect_pain_trigger (and the client's server-follow-up call). This is the
 * single source of truth — the client mirrors it in wellness.constants.ts
 * (SORENESS_PAIN_TRIGGER) and tests/unit/soreness-threshold-parity.test.js asserts
 * the two never drift, so a 4–5 soreness can't silently fall through on one side.
 */
export const PAIN_TRIGGER_THRESHOLD = 3;

/**
 * Check if safety override applies for athlete data
 */
async function checkSafetyOverride(athleteId, dataType = null) {
  const { data, error } = await supabaseAdmin.rpc(
    "has_active_safety_override",
    {
      p_athlete_id: athleteId,
      p_data_type: dataType,
    },
  );

  if (error) {
    return { hasOverride: false, error };
  }

  return { hasOverride: data === true };
}

/**
 * Detect and log pain trigger
 */
async function detectPainTrigger(
  athleteId,
  painScore,
  painLocation,
  painTrend = null,
) {
  if (painScore <= PAIN_TRIGGER_THRESHOLD) {
    return { triggered: false };
  }

  const { data, error } = await supabaseAdmin.rpc("detect_pain_trigger", {
    p_athlete_id: athleteId,
    p_pain_score: painScore,
    p_pain_location: painLocation,
    p_pain_trend: painTrend,
  });

  if (error) {
    return { triggered: false, error };
  }

  return { triggered: data !== null, overrideId: data };
}

/**
 * Detect and log ACWR danger zone
 */
async function detectACWRTrigger(athleteId) {
  const { data, error } = await supabaseAdmin.rpc("detect_acwr_trigger", {
    p_athlete_id: athleteId,
  });

  if (error) {
    return { triggered: false, error };
  }

  return { triggered: data !== null, overrideId: data };
}

export { checkSafetyOverride, detectPainTrigger, detectACWRTrigger };

export default {
  checkSafetyOverride,
  detectPainTrigger,
  detectACWRTrigger,
};
