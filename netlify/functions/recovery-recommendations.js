import { supabaseAdmin } from "./supabase-client.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, LOAD_MANAGEMENT_ACCESS_ROLES } from "./utils/role-sets.js";
import { sharesStaffedTeam } from "./utils/team-scope.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";
import { computeAcwrAt } from "./utils/acwr.js";

const logger = createLogger({ service: "netlify.recovery-recommendations" });

/**
 * Recovery Modality Recommendation Engine
 * GET /api/recovery-recommendations?athleteId=X&date=YYYY-MM-DD
 *
 * Triggers personalized recovery modality recommendations based on:
 * 1. ACWR status (red-flag → ice bath A1, sleep A1 priority)
 * 2. Objective marker depression (CMJ >7% drop → foam rolling A2, massage B1)
 * 3. Injury phase (early RTP → sport psychology A1, late RTP → yoga A2)
 * 4. Biomarker status (low iron → supplementation A2)
 *
 * Design: docs/phase_2_schema_and_acwr_calculator.md §2c Recovery Engine
 */

async function verifyAthleteAccess(requestUserId, athleteId) {
  if (athleteId === requestUserId) {
    return { authorized: true };
  }

  const role = await getUserRole(requestUserId);
  if (!hasAnyRole(role, LOAD_MANAGEMENT_ACCESS_ROLES)) {
    return {
      authorized: false,
      message: "Not authorized to view recovery recommendations for another athlete",
    };
  }

  const { shared } = await sharesStaffedTeam(requestUserId, athleteId, {
    roles: LOAD_MANAGEMENT_ACCESS_ROLES,
  });
  if (!shared) {
    return {
      authorized: false,
      message: "Not authorized to access athletes outside your team",
    };
  }

  return { authorized: true };
}

/**
 * Trigger 1: ACWR-based recommendations
 * Red flag (ACWR > safe zone) → ice bath (A1), sleep optimization (A1)
 * Yellow flag (ACWR approaching limit) → compression boots (A2), massage (B1)
 * Underload (ACWR < 0.8) → no recovery recommendation (athlete undertrained)
 */
async function acwrBasedRecommendations(acwrStatus, acwrRatio) {
  const recommendations = [];

  if (acwrStatus === "red_flag") {
    // A1 evidence: ice bath immediately post-session
    recommendations.push({
      modality_name: "Ice Bath",
      evidence_grade: "A1",
      trigger_reason: "Red-flag ACWR stress",
      dosage: "10-15 min, 10-15°C, post-session",
      priority: "immediate",
    });

    // A1 evidence: sleep optimization
    recommendations.push({
      modality_name: "Sleep Optimization",
      evidence_grade: "A1",
      trigger_reason: "High training stress requires sleep recovery",
      dosage: "8-9 hours, consistent sleep schedule",
      priority: "immediate",
    });
  } else if (acwrStatus === "yellow_flag") {
    // A2 evidence: compression boots for ACWR spike
    recommendations.push({
      modality_name: "Compression Boots",
      evidence_grade: "A2",
      trigger_reason: "ACWR approaching upper threshold",
      dosage: "20-30 min, 60 mmHg, evening",
      priority: "high",
    });

    // B1 evidence: massage for congested schedule
    recommendations.push({
      modality_name: "Sports Massage",
      evidence_grade: "B1",
      trigger_reason: "Elevated training load increases soreness",
      dosage: "30-45 min, 2-3× per week",
      priority: "medium",
    });
  }

  return recommendations;
}

/**
 * Trigger 2: Objective marker depression
 * CMJ >7% drop from baseline → foam rolling (A2), massage (B1)
 * HRV >2 SD below baseline → sleep, yoga
 */
async function objectiveMarkerRecommendations(supabase, athleteId) {
  const recommendations = [];

  // Fetch latest CMJ and baseline
  const { data: cmjData } = await supabase
    .from("performance_metrics")
    .select("metric_value, recorded_at")
    .eq("user_id", athleteId)
    .eq("metric_type", "countermovement_jump_cm")
    .order("recorded_at", { ascending: false })
    .limit(2);

  if (cmjData && cmjData.length >= 2) {
    const latestCMJ = cmjData[0].metric_value;
    const baselineCMJ = cmjData[cmjData.length - 1].metric_value;

    if (baselineCMJ > 0) {
      const cmjDrop = ((baselineCMJ - latestCMJ) / baselineCMJ) * 100;

      if (cmjDrop > 7) {
        // A2 evidence: foam rolling for CNS fatigue
        recommendations.push({
          modality_name: "Foam Rolling",
          evidence_grade: "A2",
          trigger_reason: `CMJ drop ${cmjDrop.toFixed(1)}% (>7% threshold)`,
          dosage: "10-15 min, target lower body, daily",
          priority: "high",
        });

        // B1 evidence: massage for soreness
        recommendations.push({
          modality_name: "Sports Massage",
          evidence_grade: "B1",
          trigger_reason: "Neuromuscular fatigue (CMJ depression)",
          dosage: "30-45 min, 2×/week",
          priority: "medium",
        });
      }
    }
  }

  return recommendations;
}

/**
 * Trigger 3: Injury phase-based recommendations (Phase 1D Evidence-Based RTP)
 * Queries rtp_athlete_protocol_assignments for structured, criteria-based recovery phases
 * Early RTP (phase 1-2) → sport psychology (A1), proprioceptive training (A2)
 * Late RTP (phase 3-4) → yoga (A2), eccentric loading (A1)
 * Maintenance (phase 5) → eccentric loading (A1), annual assessment
 */
async function injuryPhaseRecommendations(supabase, athleteId) {
  const recommendations = [];

  // Fetch active RTP protocol assignments (Phase 1D evidence-based)
  const { data: assignments } = await supabase
    .from("rtp_athlete_protocol_assignments")
    .select(
      `
      id,
      current_phase,
      protocol_id,
      rtp_protocol_definitions (
        injury_type,
        display_name,
        evidence_grade
      )
    `
    )
    .eq("athlete_id", athleteId);

  if (assignments && assignments.length > 0) {
    for (const assignment of assignments) {
      const phase = assignment.current_phase || 1;
      const protocol = assignment.rtp_protocol_definitions || {};
      const injuryType = protocol.display_name || protocol.injury_type || "Unknown injury";

      if (phase <= 2) {
        // Early RTP (Phase 1-2): Psychological readiness + neuromuscular foundation
        recommendations.push({
          modality_name: "Sport Psychology",
          evidence_grade: "A1",
          trigger_reason: `Early RTP (${injuryType}, Phase ${phase})`,
          dosage: "Weekly sessions, confidence building, RTS clearance",
          priority: "immediate",
        });

        recommendations.push({
          modality_name: "Proprioceptive Training",
          evidence_grade: "A2",
          trigger_reason: "Neuromuscular control restoration post-injury",
          dosage: "10-15 min daily, balance/stability exercises",
          priority: "high",
        });

        // Pain management in early phases
        recommendations.push({
          modality_name: "Cryotherapy / Ice Bath",
          evidence_grade: "A2",
          trigger_reason: "Early RTP pain and swelling management",
          dosage: "10-15 min post-rehab session as needed",
          priority: "medium",
        });
      } else if (phase <= 4) {
        // Late RTP (Phase 3-4): Strength maintenance + sports-specific work
        recommendations.push({
          modality_name: "Eccentric Loading Protocol",
          evidence_grade: "A1",
          trigger_reason: `Late RTP strength maintenance (${injuryType}, Phase ${phase})`,
          dosage: "2-3×/week, injury-specific eccentric exercises",
          priority: "high",
        });

        recommendations.push({
          modality_name: "Yoga / Mobility",
          evidence_grade: "A2",
          trigger_reason: "ROM optimization and injury-specific mobility",
          dosage: "20-30 min, 3×/week, injury-focused sequences",
          priority: "medium",
        });

        // Sport-specific drills at Phase 4
        if (phase === 4) {
          recommendations.push({
            modality_name: "Sport-Specific Drills",
            evidence_grade: "A2",
            trigger_reason: "Advanced RTP progression to competition readiness",
            dosage: "Progressive intensity 50% → 75% → 90% full speed",
            priority: "high",
          });
        }
      } else if (phase === 5) {
        // Maintenance (Phase 5): Long-term injury prevention
        recommendations.push({
          modality_name: "Eccentric Loading Protocol",
          evidence_grade: "A1",
          trigger_reason: "Injury maintenance and re-injury prevention (Phase 5)",
          dosage: "1×/week indefinitely (annual strength testing)",
          priority: "medium",
        });

        recommendations.push({
          modality_name: "Annual Injury Assessment",
          evidence_grade: "A1",
          trigger_reason: "Phase 5 RTS maintenance protocol compliance",
          dosage: "Formal assessment 12 months post-RTS",
          priority: "low",
        });
      }
    }
  }

  return recommendations;
}

/**
 * Trigger 4: Biomarker-based recommendations
 * Low ferritin (<20 µg/L) → iron supplementation (A2), dietary counseling
 * Vitamin D deficiency (<20 ng/mL) → vitamin D3 (A2)
 * High cortisol (>10 nmol/L morning) → sleep, stress management
 */
async function biomarkerRecommendations(supabase, athleteId) {
  const recommendations = [];

  const { data: profile } = await supabase
    .from("individual_profiles")
    .select("ferritin_ugL, vitamin_d_status, cortisol_morning_nmolL")
    .eq("user_id", athleteId)
    .single();

  if (profile) {
    if (
      profile.ferritin_ugL !== null &&
      profile.ferritin_ugL < 20
    ) {
      recommendations.push({
        modality_name: "Iron Supplementation",
        evidence_grade: "A2",
        trigger_reason: `Low ferritin (${profile.ferritin_ugL} µg/L)`,
        dosage: "25-50 mg elemental iron daily with vitamin C",
        priority: "high",
      });

      recommendations.push({
        modality_name: "Nutritionist Consultation",
        evidence_grade: "B1",
        trigger_reason: "Iron-rich diet optimization",
        dosage: "1-2 sessions, dietary counseling",
        priority: "medium",
      });
    }

    if (
      profile.vitamin_d_status !== null &&
      profile.vitamin_d_status < 20
    ) {
      recommendations.push({
        modality_name: "Vitamin D3 Supplementation",
        evidence_grade: "A2",
        trigger_reason: `Vitamin D deficiency (${profile.vitamin_d_status} ng/mL)`,
        dosage: "2000-4000 IU daily, retest in 8 weeks",
        priority: "high",
      });
    }

    if (
      profile.cortisol_morning_nmolL !== null &&
      profile.cortisol_morning_nmolL > 10
    ) {
      recommendations.push({
        modality_name: "Sleep Optimization",
        evidence_grade: "A1",
        trigger_reason: `Elevated morning cortisol (${profile.cortisol_morning_nmolL} nmol/L)`,
        dosage: "Sleep hygiene + 8-9 hours",
        priority: "immediate",
      });

      recommendations.push({
        modality_name: "Stress Management",
        evidence_grade: "B1",
        trigger_reason: "Cortisol regulation",
        dosage: "Meditation, breathing, yoga 5-10 min daily",
        priority: "high",
      });
    }
  }

  return recommendations;
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "recovery-recommendations",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId, correlationId }) => {
      if (evt.httpMethod !== "GET") {
        return createErrorResponse("Method not allowed", 405, "method_not_allowed");
      }
      const requestLogger = logger.child(
        buildRequestLogContext(evt, {
          function_name: "recovery-recommendations",
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
        })
      );

      try {
        const { athleteId, date } = evt.queryStringParameters || {};

        if (!athleteId) {
          return createErrorResponse("athleteId is required", 400, "validation_error");
        }

        const access = await verifyAthleteAccess(userId, athleteId);
        if (!access.authorized) {
          return createErrorResponse(access.message, 403, "authorization_error");
        }

        const targetDate = date ? new Date(date) : new Date();
        if (Number.isNaN(targetDate.getTime())) {
          return createErrorResponse("date must be a valid date", 400, "validation_error");
        }

        const dateStr = targetDate.toISOString().slice(0, 10);

        // Fetch training sessions for ACWR calculation
        const startChronic = new Date(targetDate);
        startChronic.setDate(startChronic.getDate() - 20);

        const { data: sessions } = await supabaseAdmin
          .from("training_sessions")
          .select("session_date, duration_minutes, rpe, workload")
          .eq("user_id", athleteId)
          .gte("session_date", startChronic.toISOString().slice(0, 10))
          .lte("session_date", dateStr);

        // Calculate ACWR
        const loadsByDay = new Map();
        for (const s of sessions || []) {
          if (!s?.session_date) {
            continue;
          }
          const load = s.workload || (s.duration_minutes * s.rpe) / 10;
          if (load <= 0) {
            continue;
          }
          loadsByDay.set(s.session_date, (loadsByDay.get(s.session_date) || 0) + load);
        }

        const acwrResult = computeAcwrAt(loadsByDay, targetDate);
        const acwrStatus = acwrResult.acwr
          ? acwrResult.acwr > 1.3
            ? "red_flag"
            : acwrResult.acwr > 1.0
              ? "yellow_flag"
              : "safe"
          : "building_base";

        requestLogger.debug("recovery_rec_acwr_computed", {
          acwr: acwrResult.acwr,
          status: acwrStatus,
        });

        // Aggregate all recommendations
        const acwrRecs = await acwrBasedRecommendations(
          acwrStatus,
          acwrResult.acwr
        );
        const markerRecs = await objectiveMarkerRecommendations(
          supabaseAdmin,
          athleteId
        );
        const injuryRecs = await injuryPhaseRecommendations(
          supabaseAdmin,
          athleteId
        );
        const biomarkerRecs = await biomarkerRecommendations(
          supabaseAdmin,
          athleteId
        );

        // Deduplicate by modality name, keeping highest priority
        const allRecs = [acwrRecs, markerRecs, injuryRecs, biomarkerRecs].flat();
        const deduped = new Map();

        for (const rec of allRecs) {
          const key = rec.modality_name;
          if (
            !deduped.has(key) ||
            (deduped.has(key) &&
              ["immediate", "high", "medium", "low"].indexOf(rec.priority) <
                ["immediate", "high", "medium", "low"].indexOf(
                  deduped.get(key).priority
                ))
          ) {
            deduped.set(key, rec);
          }
        }

        const recommendations = Array.from(deduped.values()).sort((a, b) => {
          const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        requestLogger.info("recovery_recommendations_generated", {
          athlete_id: athleteId,
          date: dateStr,
          acwr_status: acwrStatus,
          recommendation_count: recommendations.length,
        });

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            success: true,
            date: dateStr,
            acwrStatus,
            recommendations,
            totalCount: recommendations.length,
            triggers: {
              acwrBased: acwrRecs.length,
              markerBased: markerRecs.length,
              injuryPhaseBased: injuryRecs.length,
              biomarkerBased: biomarkerRecs.length,
            },
          }),
        };
      } catch (error) {
        requestLogger.error("recovery_recommendations_failed", error);
        return createErrorResponse(
          "Failed to generate recovery recommendations",
          500,
          "server_error"
        );
      }
    },
  });
};

export { handler };
