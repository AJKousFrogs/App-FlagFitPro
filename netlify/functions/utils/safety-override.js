/**
 * Safety Override Detection and Enforcement
 * Contract: Data Consent & Visibility Contract v1, Section 4
 */

import { supabaseAdmin } from "../supabase-client.js";

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
  if (painScore <= 3) {
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
