import { supabaseAdmin } from "../utils/supabase-client.js";

/**
 * Consent Guard - Enforces Data Consent & Visibility Contract v1
 * Checks consent before returning data to coaches
 */

/**
 * Check if coach can view athlete's readiness score
 * Contract: Data Consent & Visibility Contract v1, Section 1.5
 */
async function canCoachViewReadiness(coachId, athleteId) {
  // Check consent setting
  const { data: consent, error } = await supabaseAdmin
    .from("athlete_consent_settings")
    .select("share_readiness_with_coach")
    .eq("athlete_id", athleteId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found
    return { allowed: false, reason: "CONSENT_CHECK_FAILED", error };
  }

  const hasConsent = consent?.share_readiness_with_coach === true;

  // Check safety override (ACWR danger zone)
  const { data: readiness } = await supabaseAdmin
    .from("readiness_scores")
    .select("acwr")
    .eq("athlete_id", athleteId)
    .order("day", { ascending: false })
    .limit(1)
    .single();

  const safetyOverride =
    readiness?.acwr && (readiness.acwr > 1.5 || readiness.acwr < 0.8);

  return {
    allowed: hasConsent || safetyOverride,
    reason: hasConsent
      ? "CONSENT_GRANTED"
      : safetyOverride
        ? "SAFETY_OVERRIDE"
        : "NO_CONSENT",
    safetyOverride,
  };
}

/**
 * Check if coach can view athlete's wellness answers
 * Contract: Data Consent & Visibility Contract v1, Section 1.6
 */
async function canCoachViewWellness(coachId, athleteId) {
  const { data: consent, error } = await supabaseAdmin
    .from("athlete_consent_settings")
    .select("share_wellness_answers_with_coach")
    .eq("athlete_id", athleteId)
    .single();

  if (error && error.code !== "PGRST116") {
    return { allowed: false, reason: "CONSENT_CHECK_FAILED", error };
  }

  const hasConsent = consent?.share_wellness_answers_with_coach === true;

  // Check safety override (pain >3/10, high stress)
  const { data: safetyCheck } = await supabaseAdmin.rpc(
    "has_active_safety_override",
    {
      p_athlete_id: athleteId,
      p_data_type: "pain",
    },
  );

  const safetyOverride = safetyCheck === true;

  return {
    allowed: hasConsent || safetyOverride,
    reason: hasConsent
      ? "CONSENT_GRANTED"
      : safetyOverride
        ? "SAFETY_OVERRIDE"
        : "NO_CONSENT",
    safetyOverride,
  };
}

/**
 * Filter wellness data based on consent
 * Returns compliance-only data if consent not granted
 */
function filterWellnessDataForCoach(wellnessData, hasConsent, safetyOverride) {
  if (hasConsent || safetyOverride) {
    return wellnessData; // Full data
  }

  // Compliance only: return check-in existence, not content
  return {
    check_in_completed: wellnessData ? true : false,
    check_in_date: wellnessData?.date || null,
    // Hide all wellness answers
    sleep_quality: null,
    energy_level: null,
    stress_level: null,
    muscle_soreness: null,
    mood: null,
    notes: null,
  };
}

/**
 * Filter readiness data based on consent
 */
function filterReadinessForCoach(readinessData, hasConsent, safetyOverride) {
  if (hasConsent || safetyOverride) {
    return readinessData; // Full data including score
  }

  // Compliance only: return check-in status, not score
  return {
    check_in_completed: readinessData ? true : false,
    check_in_date: readinessData?.day || null,
    // Hide readinessScore
    score: null,
    level: null,
    suggestion: null,
  };
}

export { canCoachViewReadiness,
  canCoachViewWellness,
  filterWellnessDataForCoach,
  filterReadinessForCoach, };
