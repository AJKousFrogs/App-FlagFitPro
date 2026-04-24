import { getIsoDayOfWeek } from "./date-utils.js";

export async function generateReturnToPlayProtocol(
  supabase,
  userId,
  date,
  wellnessCheckin,
  headers,
) {
  console.log("[RTP] Generating return-to-play protocol for", date);

  const injuries = wellnessCheckin.soreness_areas || [];
  const painLevel = wellnessCheckin.pain_level || 2;

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

  const { data: protocol, error: protocolError } = await supabase
    .from("daily_protocols")
    .insert({
      user_id: userId,
      protocol_date: date,
      readiness_score: Math.max(30, 50 - painLevel * 10),
      acwr_value: 0.5,
      training_focus: `return_to_play_phase_${rtpPhase}`,
      ai_rationale: aiRationale,
      total_load_target_au: rtpPhase * 100,
    })
    .select()
    .single();

  if (protocolError) {
    console.error("[RTP] Error creating protocol:", protocolError);
    throw protocolError;
  }

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

  if (mobilityExercises?.length) {
    mobilityExercises.forEach((ex) => {
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
    const { data: rehabExercises } = await supabase
      .from("exercises")
      .select("*")
      .eq("category", "rehab")
      .eq("active", true)
      .order("difficulty_level")
      .limit(4);

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

    if (conditioningExercises?.length) {
      conditioningExercises.forEach((ex) => {
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
          load_contribution_au: Math.round((ex.load_contribution_au || 15) * 0.4),
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

  if (eveningMobility?.length) {
    eveningMobility.forEach((ex) => {
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
      console.error("[RTP] Error inserting exercises:", insertError);
      throw insertError;
    }
  }

  console.log(
    `[RTP] Generated Phase ${rtpPhase} protocol with ${protocolExercises.length} exercises`,
  );

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
