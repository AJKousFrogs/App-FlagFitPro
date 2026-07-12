import { getIsoDayOfWeek } from "./date-utils.js";
import { injuriesPainLevel } from "./active-injuries.js";
import {
  isExerciseSafeForInjuries,
  keywordsForRegion,
} from "./daily-protocol-blocks.js";

import { createLogger } from "./structured-logger.js";
const logger = createLogger({ service: "netlify.daily-protocol-rtp" });

export async function generateReturnToPlayProtocol(
  supabase,
  userId,
  date,
  wellnessCheckin,
  headers,
  { activeInjuries = null, getProtocol = null } = {},
) {
  logger.info("rtp_protocol_generating", { date });

  // Size RTP off the injury authority (athlete_injuries: region + graded severity),
  // not the raw soreness_areas slider — soreness_areas is an INPUT, never the
  // trigger (SOT Law 5a / active-injuries.js). Fall back to the check-in only for
  // legacy callers that pass no structured injuries.
  const hasAuthority =
    Array.isArray(activeInjuries) && activeInjuries.length > 0;
  const injuries = hasAuthority
    ? activeInjuries.map((i) => i.injury_location).filter(Boolean)
    : wellnessCheckin?.soreness_areas || [];
  const painLevel = hasAuthority ? injuriesPainLevel(activeInjuries) : 2;
  // RTP's own rationale text promises "Focus on areas NOT injured" (below), but
  // the exercise pools were never actually filtered by injured region — an
  // athlete with a hamstring injury could be prescribed a Hamstring Stretch in
  // the mobility/conditioning/evening blocks. Mirrors isExerciseSafeForInjuries
  // from daily-protocol-blocks.js (already used for normal-day cool-down
  // filtering). Rehab exercises are deliberately excluded from this filter —
  // that block exists specifically to work the injured region under
  // progressive, coach-approved RTP loading.
  const injuredRegions = injuries
    .map((r) => String(r).toLowerCase())
    .filter(Boolean);

  let rtpPhase = 1;
  let phaseName = "Phase 1: Foundation & Pain Management";
  let aiRationale = `🏥 RETURN-TO-PLAY PROTOCOL - ${phaseName}\n\n`;

  aiRationale += `Active concerns: ${injuries.join(", ")}\n`;
  aiRationale += `Pain level: ${painLevel}/5\n\n`;

  if (painLevel >= 4) {
    aiRationale += `⚠️ HIGH PAIN LEVEL: Focus on pain-free movement only. No loading exercises. Consult physiotherapist if pain persists.\n\n`;
    rtpPhase = 1;
  } else if (painLevel === 3) {
    aiRationale += `⚠️ MODERATE PAIN: Light activity only. Avoid aggravating movements. Progress slowly.\n\n`;
    rtpPhase = 1;
  } else if (painLevel === 2) {
    aiRationale += `✓ MILD DISCOMFORT: Can begin light loading. Monitor response carefully.\n\n`;
    rtpPhase = 2;
    phaseName = "Phase 2: Light Loading & Strengthening";
  } else {
    aiRationale += `✓ MINIMAL/NO PAIN: Can progress to moderate loading. Continue building foundation.\n\n`;
    rtpPhase = 3;
    phaseName = "Phase 3: Progressive Loading & Conditioning";
  }

  aiRationale += `📋 TODAY'S FOCUS:\n`;
  if (rtpPhase === 1) {
    aiRationale += `- Gentle mobility and pain-free movement\n`;
    aiRationale += `- Focus on areas NOT injured\n`;
    aiRationale += `- Build base conditioning without aggravation\n`;
    aiRationale += `- Daily foam rolling and mobility work\n`;
  } else if (rtpPhase === 2) {
    aiRationale += `- Light resistance training (bodyweight only)\n`;
    aiRationale += `- Controlled movements in pain-free ranges\n`;
    aiRationale += `- Progressive mobility work\n`;
    aiRationale += `- Monitor for any pain increase\n`;
  } else {
    aiRationale += `- Moderate loading (20-30% of normal)\n`;
    aiRationale += `- Position-specific skill work at reduced intensity\n`;
    aiRationale += `- Build work capacity progressively\n`;
    aiRationale += `- Prepare for return to team practice\n`;
  }

  aiRationale += `\n⚕️ STOP if pain increases beyond 3/10 during any exercise.\n`;
  aiRationale += `✓ Update your wellness check-in daily to track progress.\n`;

  // ── Human-in-the-loop gate ────────────────────────────────────────────────
  // Every RTP protocol requires coach sign-off before the prescription is
  // delivered to the athlete. On first generation we create a pending approval
  // row and return a 202 Accepted so the app can show "Awaiting coach review."
  // On subsequent calls (athlete re-opens the app) we check the status: if still
  // pending → same 202; if approved → fall through to build and return the
  // prescription; if rejected → 200 with a coach-rejected message.
  const { data: rtpProtocol } = await supabase
    .from("return_to_play_protocols")
    .select("id, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rtpProtocol?.id) {
    const { data: existingApproval } = await supabase
      .from("rtp_prescription_approvals")
      .select("id, status")
      .eq("return_to_play_id", rtpProtocol.id)
      .eq("athlete_id", userId)
      .eq("rtp_phase", rtpPhase)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingApproval) {
      // First time this phase is generated — create pending gate
      await supabase.from("rtp_prescription_approvals").insert({
        return_to_play_id: rtpProtocol.id,
        athlete_id: userId,
        rtp_phase: rtpPhase,
        trigger: "rtp_phase_entry",
      });
      logger.info("rtp_approval_gate_created", { phase: rtpPhase });
      return {
        statusCode: 202,
        headers,
        body: JSON.stringify({
          success: true,
          pending_approval: true,
          rtp_phase: rtpPhase,
          phase_name: phaseName,
          message:
            "RTP prescription sent to coach for review. You will be notified when approved.",
        }),
      };
    }

    if (existingApproval.status === "pending") {
      return {
        statusCode: 202,
        headers,
        body: JSON.stringify({
          success: true,
          pending_approval: true,
          rtp_phase: rtpPhase,
          phase_name: phaseName,
          message: "Awaiting coach approval for your RTP prescription.",
        }),
      };
    }

    if (existingApproval.status === "rejected") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          rejected: true,
          rtp_phase: rtpPhase,
          phase_name: phaseName,
          message:
            "Your coach has reviewed and adjusted your RTP plan. Please contact your coach for the updated protocol.",
        }),
      };
    }
    // status === 'approved' → fall through to build and deliver the prescription
    logger.info("rtp_approval_gate_passed", {
      phase: rtpPhase,
      approvalId: existingApproval.id,
    });
  }

  // Upsert (not insert) so that tightness reported after the day's initial
  // protocol generation correctly overwrites the stale normal-day prescription.
  // Without upsert the INSERT fails on the unique (user_id, protocol_date)
  // constraint and the athlete sees yesterday's foam-roll plan all day.
  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .upsert(
      {
        user_id: userId,
        protocol_date: date,
        readiness_score: Math.max(30, 50 - painLevel * 10),
        // No fabrication (SOT Law 7): a hardcoded ACWR 0.5 in the most safety-
        // sensitive flow (return-to-play) falsely signalled 'under-training'. The
        // RTP loading is deliberately managed by phase here, not by a real ACWR —
        // so write null ('not computed for this protocol'), never an invented value.
        acwr_value: null,
        training_focus: `return_to_play_phase_${rtpPhase}`,
        ai_rationale: aiRationale,
        total_load_target_au: rtpPhase * 100,
      },
      { onConflict: "user_id,protocol_date" },
    )
    .select()
    .single();

  if (protocolError) {
    logger.error("rtp_protocol_create_failed", protocolError, {});
    throw protocolError;
  }

  // Delete stale exercises from any prior protocol for this day so the RTP
  // exercises don't stack on top of the normal-day prescription.
  await supabase
    .from("protocol_exercises")
    .delete()
    .eq("protocol_id", protocol.id);

  const protocolExercises = [];
  let sequenceOrder = 0;

  const rtpDayOfWeek = getIsoDayOfWeek(date);
  const rtpMobilitySlug = `morning-mobility-day-${rtpDayOfWeek === 0 ? 7 : rtpDayOfWeek}`;
  const { data: dayMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", rtpMobilitySlug)
    .eq("active", true)
    .maybeSingle();

  const { data: mobilityExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "mobility")
    .is("position_specific", null)
    .eq("active", true)
    .limit(4);

  if (dayMobility) {
    protocolExercises.push({
      exercise_id: dayMobility.id,
      exercise_name: dayMobility.name,
      block_type: "morning_mobility",
      block_order: 1,
      sequence_order: sequenceOrder++,
      prescribed_sets: 1,
      prescribed_reps: dayMobility.default_reps,
      prescribed_hold_seconds: dayMobility.default_hold_seconds,
      prescribed_duration_seconds: dayMobility.default_duration_seconds,
      rest_seconds: 30,
      notes: "RTP: Follow along with the gentle mobility video",
      load_contribution_au: 0,
    });
  }

  const safeMobilityExercises = (mobilityExercises || []).filter((ex) =>
    isExerciseSafeForInjuries(ex, injuredRegions),
  );

  if (safeMobilityExercises.length) {
    safeMobilityExercises.forEach((ex) => {
      protocolExercises.push({
        exercise_id: ex.id,
        exercise_name: ex.name,
        block_type: "morning_mobility",
        block_order: 1,
        sequence_order: sequenceOrder++,
        prescribed_sets: 1,
        prescribed_reps: ex.default_reps || 10,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        rest_seconds: 30,
        notes: "Pain-free range of motion only. Gentle movements.",
        load_contribution_au: Math.round((ex.load_contribution_au || 10) * 0.5),
      });
    });
  }

  if (rtpPhase >= 2) {
    // Pull a wider rehab pool, then prefer exercises that actually target the
    // injured region(s) — an Achilles report should surface calf/heel loading
    // work before generic rehab filler. Difficulty order is preserved within
    // each partition; generic exercises still top up to 4 when the region has
    // few (or no) matches, so the block never comes back thinner than before.
    const { data: rehabPool } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "rehab")
      .eq("active", true)
      .order("difficulty_level")
      .limit(16);

    const regionKeywords = [
      ...new Set(injuredRegions.flatMap((r) => keywordsForRegion(r))),
    ];
    const targetsInjuredRegion = (ex) => {
      const name = (ex.name || "").toLowerCase();
      const slug = (ex.slug || "").toLowerCase();
      return regionKeywords.some(
        (kw) => name.includes(kw) || slug.includes(kw),
      );
    };
    const targeted = (rehabPool || []).filter(targetsInjuredRegion);
    const generic = (rehabPool || []).filter((ex) => !targetsInjuredRegion(ex));
    const rehabExercises = [...targeted, ...generic].slice(0, 4);

    if (rehabExercises?.length) {
      rehabExercises.forEach((ex) => {
        const loadModifier = rtpPhase === 2 ? 0.3 : 0.5;
        protocolExercises.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "rehab_progression",
          block_order: 2,
          sequence_order: sequenceOrder++,
          prescribed_sets: rtpPhase === 2 ? 2 : 3,
          prescribed_reps: ex.default_reps || 10,
          prescribed_hold_seconds: ex.default_hold_seconds,
          rest_seconds: 90,
          notes: `RTP Phase ${rtpPhase}: ${loadModifier * 100}% intensity. Monitor pain closely.`,
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 20) * loadModifier,
          ),
        });
      });
    }

    const { data: conditioningExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "conditioning")
      .eq("subcategory", "low_impact")
      .eq("active", true)
      .limit(3);

    const safeConditioningExercises = (conditioningExercises || []).filter(
      (ex) => isExerciseSafeForInjuries(ex, injuredRegions),
    );

    if (safeConditioningExercises.length) {
      safeConditioningExercises.forEach((ex) => {
        protocolExercises.push({
          exercise_id: ex.id,
          exercise_name: ex.name,
          block_type: "conditioning",
          block_order: 3,
          sequence_order: sequenceOrder++,
          prescribed_sets: 2,
          prescribed_duration_seconds: rtpPhase === 2 ? 30 : 45,
          rest_seconds: 60,
          notes: "Low impact only. Stop if pain occurs.",
          load_contribution_au: Math.round(
            (ex.load_contribution_au || 15) * 0.4,
          ),
        });
      });
    }
  }

  const { data: eveningMobility } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", "recovery")
    .eq("active", true)
    .limit(4);

  const safeEveningMobility = (eveningMobility || []).filter((ex) =>
    isExerciseSafeForInjuries(ex, injuredRegions),
  );

  if (safeEveningMobility.length) {
    safeEveningMobility.forEach((ex) => {
      protocolExercises.push({
        exercise_id: ex.id,
        exercise_name: ex.name,
        block_type: "evening_mobility",
        block_order: 4,
        sequence_order: sequenceOrder++,
        prescribed_sets: 1,
        prescribed_reps: ex.default_reps || 8,
        prescribed_hold_seconds: ex.default_hold_seconds || 30,
        rest_seconds: 30,
        notes: "Gentle recovery work. Focus on relaxation.",
        load_contribution_au: Math.round((ex.load_contribution_au || 8) * 0.5),
      });
    });
  }

  if (protocolExercises.length > 0) {
    const { error: insertError } = await supabase
      .from("protocol_exercises")
      .insert(protocolExercises);

    if (insertError) {
      logger.error("rtp_exercises_insert_failed", insertError, {});
      throw insertError;
    }
  }

  logger.info("rtp_protocol_generated", {
    phase: rtpPhase,
    exerciseCount: protocolExercises.length,
  });

  // Return the SAME block-keyed shape as the normal generate path (via
  // getProtocol → transformProtocolResponse). The previous flat
  // `{...protocol, exercises}` payload had none of the block keys the client
  // renders, so an injured athlete's Training screen showed "No specific
  // exercises for today's plan" while the RTP session sat unrendered in the DB.
  if (getProtocol) {
    return await getProtocol(supabase, userId, { date }, headers);
  }

  // Legacy flat shape for callers that don't inject getProtocol.
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: {
        ...protocol,
        exercises: protocolExercises,
        is_return_to_play: true,
        rtp_phase: rtpPhase,
        phase_name: phaseName,
      },
    }),
  };
}
