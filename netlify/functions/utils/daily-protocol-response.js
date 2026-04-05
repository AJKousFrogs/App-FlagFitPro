import { resolveYouTubeVideoMetadata } from "./youtube.js";
import { createLogger } from "./structured-logger.js";

const logger = createLogger({ service: "netlify.daily-protocol-response" });

export function buildAcwrPresentation(acwrValue, confidenceMetadata = null) {
  const trainingDaysLogged =
    confidenceMetadata?.acwr?.trainingDaysLogged ?? null;

  if (
    typeof acwrValue !== "number" ||
    !Number.isFinite(acwrValue) ||
    acwrValue <= 0
  ) {
    const baselineBuilding =
      typeof trainingDaysLogged === "number" &&
      trainingDaysLogged > 0 &&
      trainingDaysLogged < 21;

    return {
      value: null,
      level: "no-data",
      label: baselineBuilding ? "baseline building" : "no data",
      text: baselineBuilding
        ? `ACWR baseline building (${trainingDaysLogged}/21 logged)`
        : null,
    };
  }

  if (acwrValue < 0.8) {
    return {
      value: acwrValue,
      level: "under-training",
      label: "under target",
      text: `ACWR ${acwrValue.toFixed(2)} · under target`,
    };
  }

  if (acwrValue <= 1.3) {
    return {
      value: acwrValue,
      level: "sweet-spot",
      label: "sweet spot",
      text: `ACWR ${acwrValue.toFixed(2)} · sweet spot`,
    };
  }

  if (acwrValue <= 1.5) {
    return {
      value: acwrValue,
      level: "elevated-risk",
      label: "elevated",
      text: `ACWR ${acwrValue.toFixed(2)} · elevated`,
    };
  }

  return {
    value: acwrValue,
    level: "danger-zone",
    label: "high risk",
    text: `ACWR ${acwrValue.toFixed(2)} · high risk`,
  };
}

function toUtcDateOnly(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function formatUtcDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export async function computeReadinessDaysStale(
  supabase,
  userId,
  date,
  { hasCheckinToday = false, readinessScore = null } = {},
) {
  if (hasCheckinToday) {
    return 0;
  }

  const { data: lastCheckin, error } = await supabase
    .from("daily_wellness_checkin")
    .select("checkin_date")
    .eq("user_id", userId)
    .lte("checkin_date", date)
    .order("checkin_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    logger.warn("daily_protocol_readiness_staleness_failed", {
      user_id: userId,
      date,
      error: error.message,
    });
    return readinessScore !== null ? 0 : null;
  }

  if (!lastCheckin?.checkin_date) {
    return readinessScore !== null ? 0 : null;
  }

  const targetDate = toUtcDateOnly(date);
  const lastDate = toUtcDateOnly(lastCheckin.checkin_date);
  const diffDays = Math.floor(
    (targetDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(diffDays, 0);
}

export async function computeTrainingDaysLogged(
  supabase,
  userId,
  date,
  trainingSessionsTable,
  windowDays = 21,
) {
  const startDate = toUtcDateOnly(date);
  startDate.setUTCDate(startDate.getUTCDate() - (windowDays - 1));
  const windowStart = formatUtcDateOnly(startDate);

  const { data: sessions, error } = await supabase
    .from(trainingSessionsTable)
    .select("session_date, session_state")
    .eq("user_id", userId)
    .not("session_date", "is", null)
    .gte("session_date", windowStart)
    .lte("session_date", date);

  if (error) {
    logger.warn("daily_protocol_training_days_logged_failed", {
      user_id: userId,
      date,
      error: error.message,
    });
    return null;
  }

  const completedStates = new Set(["completed", "complete"]);
  const uniqueDays = new Set();

  for (const session of sessions || []) {
    const state = session.session_state?.toLowerCase?.();
    if (state && !completedStates.has(state)) {
      continue;
    }
    if (session.session_date) {
      uniqueDays.add(session.session_date);
    }
  }

  return uniqueDays.size;
}

export async function computeDynamicConfidenceMetadata(
  supabase,
  userId,
  date,
  protocol,
  { trainingSessionsTable },
) {
  const { data: todayWellness, error: wellnessError } = await supabase
    .from("daily_wellness_checkin")
    .select("id, calculated_readiness, created_at, checkin_date")
    .eq("user_id", userId)
    .eq("checkin_date", date)
    .maybeSingle();

  if (wellnessError && wellnessError.code !== "PGRST116") {
    logger.warn("daily_protocol_wellness_check_failed", {
      user_id: userId,
      date,
      error: wellnessError.message,
    });
  }

  const hasCheckinToday = !!todayWellness;
  const readinessScore =
    todayWellness?.calculated_readiness ?? protocol.readiness_score;

  const daysStale = await computeReadinessDaysStale(supabase, userId, date, {
    hasCheckinToday,
    readinessScore,
  });
  const trainingDaysLogged = await computeTrainingDaysLogged(
    supabase,
    userId,
    date,
    trainingSessionsTable,
  );

  let readinessConfidence = "none";
  if (hasCheckinToday) {
    readinessConfidence = "high";
  } else if (daysStale !== null && daysStale <= 2) {
    readinessConfidence = "stale";
  } else if (readinessScore !== null) {
    readinessConfidence = "stale";
  }

  const storedMeta = protocol.confidence_metadata || {};

  logger.debug("daily_protocol_dynamic_confidence_computed", {
    hasCheckinToday,
    readinessScore,
    daysStale,
    readinessConfidence,
  });

  const acwrHasData = protocol.acwr_value !== null;

  return {
    readiness: {
      hasData: hasCheckinToday || readinessScore !== null,
      source: hasCheckinToday
        ? "wellness_checkin"
        : readinessScore !== null
          ? "stored"
          : "none",
      daysStale,
      confidence: readinessConfidence,
      _readinessScore: readinessScore,
    },
    acwr: {
      hasData: storedMeta.acwr?.hasData ?? acwrHasData,
      source:
        storedMeta.acwr?.source ||
        (acwrHasData || trainingDaysLogged !== null
          ? "training_sessions"
          : "none"),
      trainingDaysLogged:
        trainingDaysLogged ?? storedMeta.acwr?.trainingDaysLogged ?? null,
      confidence:
        storedMeta.acwr?.confidence ||
        (acwrHasData ? "high" : "building_baseline"),
    },
    sessionResolution: storedMeta.sessionResolution || {
      success: true,
      status: "resolved",
      hasProgram: true,
      hasSessionTemplate: true,
    },
  };
}

export function transformProtocolResponse(
  protocol,
  exercises,
  coachName = null,
  teamActivity = null,
  sessionResolution = null,
  { blockTypes },
) {
  const blocks = {
    morning_mobility: [],
    foam_roll: [],
    warm_up: [],
    isometrics: [],
    plyometrics: [],
    strength: [],
    conditioning: [],
    skill_drills: [],
    main_session: [],
    cool_down: [],
    evening_recovery: [],
  };

  exercises.forEach((pe) => {
    if (blocks[pe.block_type]) {
      blocks[pe.block_type].push(transformExercise(pe));
    }
  });

  const createBlock = (type, title, icon) => {
    const blockExercises = blocks[type] || [];
    const completedCount = blockExercises.filter(
      (e) => e.status === "complete",
    ).length;

    return {
      type,
      title,
      icon,
      status: protocol[`${type}_status`] || "pending",
      exercises: blockExercises,
      completedCount,
      totalCount: blockExercises.length,
      progressPercent:
        blockExercises.length > 0
          ? Math.round((completedCount / blockExercises.length) * 100)
          : 0,
      completedAt: protocol[`${type}_completed_at`],
      estimatedDurationMinutes: blockTypes[type]?.estimatedMinutes,
    };
  };

  const blocksArray = [];
  if (blocks.morning_mobility.length > 0) {
    blocksArray.push({ type: "morning_mobility", title: "Morning Mobility" });
  }
  if (blocks.foam_roll.length > 0) {
    blocksArray.push({ type: "foam_roll", title: "Pre-Training: Foam Roll" });
  }
  if (blocks.warm_up.length > 0) {
    blocksArray.push({ type: "warm_up", title: "Warm-Up (25 min)" });
  }
  if (blocks.isometrics.length > 0) {
    blocksArray.push({ type: "isometrics", title: "Isometrics (15 min)" });
  }
  if (blocks.plyometrics.length > 0) {
    blocksArray.push({ type: "plyometrics", title: "Plyometrics (15 min)" });
  }
  if (blocks.strength.length > 0) {
    blocksArray.push({ type: "strength", title: "Strength (15 min)" });
  }
  if (blocks.conditioning.length > 0) {
    blocksArray.push({ type: "conditioning", title: "Conditioning (15 min)" });
  }
  if (blocks.skill_drills.length > 0) {
    blocksArray.push({ type: "skill_drills", title: "Skill Drills (15 min)" });
  }
  if (blocks.main_session.length > 0) {
    blocksArray.push({ type: "main_session", title: "Main Session" });
  }
  if (blocks.cool_down.length > 0) {
    blocksArray.push({ type: "cool_down", title: "Cool-Down (15 min)" });
  }
  if (blocks.evening_recovery.length > 0) {
    blocksArray.push({ type: "evening_recovery", title: "Evening Recovery" });
  }

  return {
    id: protocol.id,
    userId: protocol.user_id,
    protocol_date: protocol.protocol_date,
    readiness_score: protocol.readiness_score,
    acwr_value: protocol.acwr_value,
    acwr_presentation: buildAcwrPresentation(
      protocol.acwr_value,
      protocol.confidence_metadata,
    ),
    totalLoadTargetAu: protocol.total_load_target_au,
    aiRationale: protocol.ai_rationale,
    trainingFocus: protocol.training_focus,
    morningMobility: createBlock(
      "morning_mobility",
      "Morning Mobility",
      "pi-sun",
    ),
    foamRoll: createBlock(
      "foam_roll",
      "Pre-Training: Foam Roll",
      "pi-circle-fill",
    ),
    warmUp: createBlock("warm_up", "Warm-Up (25 min)", "pi-bolt"),
    isometrics: createBlock(
      "isometrics",
      "Isometrics (15 min)",
      "pi-pause-circle",
    ),
    plyometrics: createBlock(
      "plyometrics",
      "Plyometrics (15 min)",
      "pi-arrow-up",
    ),
    strength: createBlock("strength", "Strength (15 min)", "pi-heart"),
    conditioning: createBlock(
      "conditioning",
      "Conditioning (15 min)",
      "pi-directions-run",
    ),
    skillDrills: createBlock(
      "skill_drills",
      "Skill Drills (15 min)",
      "pi-bolt",
    ),
    mainSession: createBlock("main_session", "Main Session", "pi-play"),
    coolDown: createBlock("cool_down", "Cool-Down (15 min)", "pi-stop"),
    eveningRecovery: createBlock(
      "evening_recovery",
      "Evening Recovery",
      "pi-moon",
    ),
    blocks: blocksArray,
    overallProgress: protocol.overall_progress || 0,
    completedExercises: protocol.completed_exercises || 0,
    totalExercises: protocol.total_exercises || 0,
    actualDurationMinutes: protocol.actual_duration_minutes,
    actualRpe: protocol.actual_rpe,
    actualLoadAu: protocol.actual_load_au,
    sessionNotes: protocol.session_notes,
    generatedAt: protocol.generated_at,
    updatedAt: protocol.updated_at,
    coach_alert_active: protocol.coach_alert_active || false,
    coach_alert_message: protocol.coach_alert_message || null,
    coach_alert_requires_acknowledgment:
      protocol.coach_alert_requires_acknowledgment || false,
    coach_acknowledged: protocol.coach_acknowledged || false,
    modified_by_coach_id: protocol.modified_by_coach_id || null,
    modified_by_coach_name:
      coachName || protocol.modified_by_coach_name || null,
    modified_at: protocol.modified_at || null,
    coach_note: protocol.coach_note
      ? {
          content: protocol.coach_note,
          priority: protocol.coach_note_priority || "info",
          coachName: coachName || protocol.modified_by_coach_name || null,
          timestampLocal: protocol.modified_at || protocol.updated_at,
        }
      : null,
    teamActivity,
    sessionResolution,
    confidenceMetadata: protocol.confidence_metadata || null,
  };
}

export function transformExercise(protocolExercise) {
  const ex = protocolExercise.exercises;

  if (!ex) {
    const aiNote = protocolExercise.ai_note || "";
    const blockType = protocolExercise.block_type || "general";
    const exerciseName = `${blockType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Exercise ${protocolExercise.sequence_order || 1}`;

    const video = resolveYouTubeVideoMetadata({
      videoUrl: protocolExercise.video_url || null,
      thumbnailUrl: protocolExercise.thumbnail_url || null,
    });

    return {
      id: protocolExercise.id,
      exerciseId: protocolExercise.id,
      exercise: {
        id: protocolExercise.id,
        name: exerciseName,
        slug: exerciseName.toLowerCase().replace(/\s+/g, "-"),
        category: blockType,
        subcategory: null,
        videoUrl: video.videoUrl,
        videoId: video.videoId,
        videoDurationSeconds: protocolExercise.prescribed_duration_seconds,
        thumbnailUrl: video.thumbnailUrl,
        howText: aiNote,
        feelText: null,
        compensationText: null,
        defaultSets: protocolExercise.prescribed_sets || 1,
        defaultReps: protocolExercise.prescribed_reps,
        defaultHoldSeconds: protocolExercise.prescribed_hold_seconds,
        defaultDurationSeconds: protocolExercise.prescribed_duration_seconds,
        difficultyLevel: "intermediate",
        loadContributionAu: protocolExercise.load_contribution_au || 0,
        isHighIntensity: false,
      },
      blockType: protocolExercise.block_type,
      sequenceOrder: protocolExercise.sequence_order,
      prescribedSets: protocolExercise.prescribed_sets,
      prescribedReps: protocolExercise.prescribed_reps,
      prescribedHoldSeconds: protocolExercise.prescribed_hold_seconds,
      prescribedDurationSeconds: protocolExercise.prescribed_duration_seconds,
      prescribedWeightKg: protocolExercise.prescribed_weight_kg,
      yesterdaySets: protocolExercise.yesterday_sets,
      yesterdayReps: protocolExercise.yesterday_reps,
      yesterdayHoldSeconds: protocolExercise.yesterday_hold_seconds,
      progressionNote: protocolExercise.progression_note,
      aiNote: protocolExercise.ai_note,
      status: protocolExercise.status || "pending",
      completedAt: protocolExercise.completed_at,
      actualSets: protocolExercise.actual_sets,
      actualReps: protocolExercise.actual_reps,
      actualHoldSeconds: protocolExercise.actual_hold_seconds,
      loadContributionAu: protocolExercise.load_contribution_au,
    };
  }

  const video = resolveYouTubeVideoMetadata({
    videoId: ex.video_id,
    videoUrl: ex.video_url,
    thumbnailUrl: ex.thumbnail_url,
  });

  return {
    id: protocolExercise.id,
    exerciseId: ex.id,
    exercise: {
      id: ex.id,
      name: ex.name,
      slug: ex.slug,
      category: ex.category,
      subcategory: ex.subcategory,
      videoUrl: video.videoUrl,
      videoId: video.videoId,
      videoDurationSeconds: ex.video_duration_seconds,
      thumbnailUrl: video.thumbnailUrl,
      howText: ex.how_text,
      feelText: ex.feel_text,
      compensationText: ex.compensation_text,
      defaultSets: ex.default_sets,
      defaultReps: ex.default_reps,
      defaultHoldSeconds: ex.default_hold_seconds,
      defaultDurationSeconds: ex.default_duration_seconds,
      difficultyLevel: ex.difficulty_level,
      loadContributionAu: ex.load_contribution_au,
      isHighIntensity: ex.is_high_intensity,
    },
    blockType: protocolExercise.block_type,
    sequenceOrder: protocolExercise.sequence_order,
    prescribedSets: protocolExercise.prescribed_sets,
    prescribedReps: protocolExercise.prescribed_reps,
    prescribedHoldSeconds: protocolExercise.prescribed_hold_seconds,
    prescribedDurationSeconds: protocolExercise.prescribed_duration_seconds,
    prescribedWeightKg: protocolExercise.prescribed_weight_kg,
    yesterdaySets: protocolExercise.yesterday_sets,
    yesterdayReps: protocolExercise.yesterday_reps,
    yesterdayHoldSeconds: protocolExercise.yesterday_hold_seconds,
    progressionNote: protocolExercise.progression_note,
    aiNote: protocolExercise.ai_note,
    status: protocolExercise.status,
    completedAt: protocolExercise.completed_at,
    actualSets: protocolExercise.actual_sets,
    actualReps: protocolExercise.actual_reps,
    actualHoldSeconds: protocolExercise.actual_hold_seconds,
    loadContributionAu: protocolExercise.load_contribution_au,
  };
}
