import { createLogger } from "./structured-logger.js";
import { getPrescriptionTemplate } from "./prescription-templates.js";
const logger = createLogger({ service: "netlify.daily-protocol-main-session" });

export async function generateMainSessionFallback({
  supabase,
  protocolExercises,
  context,
  trainingFocus,
  hasGymAccess,
  hasFieldAccess,
  isSprintSession,
  isGymTrainingDay,
  periodizationPhase,
  acwrForLogic,
}) {
  let sessionType = "strength";
  let sessionCategory = "strength";
  let mainSessionGenerated = false;

  if (isSprintSession) {
    sessionType = "sprint";
    sessionCategory = "sprint";
    mainSessionGenerated = await addSprintMainSession({
      supabase,
      protocolExercises,
      periodizationPhase,
      acwrForLogic,
    });
  } else if (hasGymAccess && isGymTrainingDay) {
    const mainSessionExercises = protocolExercises.filter(
      (exercise) => exercise.block_type === "main_session",
    );

    if (mainSessionExercises.length > 0) {
      sessionType = "gym";
      sessionCategory = "strength";
      mainSessionGenerated = true;
      logger.info("daily_protocol_gym_session_generated", {
        exerciseCount: mainSessionExercises.length,
      });
    } else {
      logger.warn("daily_protocol_gym_session_empty", {});
    }
  } else if (hasFieldAccess && !hasGymAccess) {
    sessionType = "flag";
    sessionCategory = "skill";
    mainSessionGenerated = await addFlagMainSession({
      supabase,
      protocolExercises,
    });
  }

  if (!mainSessionGenerated && trainingFocus !== "recovery") {
    mainSessionGenerated = await addFallbackMainSession({
      supabase,
      protocolExercises,
      context,
      hasGymAccess,
      hasFieldAccess,
      isSprintSession,
      isGymTrainingDay,
      trainingFocus,
      sessionType,
      sessionCategory,
    });
  }

  if (!mainSessionGenerated && trainingFocus === "recovery") {
    logger.info("daily_protocol_recovery_day", {});
  }

  return {
    mainSessionGenerated,
    sessionType,
    sessionCategory,
  };
}

async function addSprintMainSession({
  supabase,
  protocolExercises,
  periodizationPhase,
  acwrForLogic,
}) {
  const sprintPhaseMap = {
    foundation: "foundation",
    strength_accumulation: "strength_accumulation",
    power_development: "power_development",
    speed_development: "speed_development",
    competition_prep: "competition",
    in_season_maintenance: "competition",
    mid_season_reload: "mid_season_reload",
    peak: "peak",
    taper: "peak",
    active_recovery: "foundation",
    off_season_rest: "foundation",
  };

  const sprintPhase = sprintPhaseMap[periodizationPhase] || "foundation";
  let sprintProtocols = [];
  let useHillSprints = false;
  let useStairSprints = false;

  if (sprintPhase === "foundation") {
    sprintProtocols = ["short_acceleration", "deceleration_training"];
    useHillSprints = true;
  } else if (sprintPhase === "strength_accumulation") {
    sprintProtocols = [
      "short_acceleration",
      "resisted_acceleration",
      "deceleration_training",
    ];
    useHillSprints = true;
  } else if (sprintPhase === "power_development") {
    sprintProtocols = [
      "short_acceleration",
      "resisted_acceleration",
      "flying_sprints",
    ];
    useHillSprints = false;
  } else if (sprintPhase === "speed_development") {
    sprintProtocols = [
      "short_acceleration",
      "flying_sprints",
      "in_and_out_sprints",
      "repeated_sprint_ability",
    ];
    useHillSprints = false;
  } else if (sprintPhase === "competition") {
    sprintProtocols = ["short_acceleration", "deceleration_training"];
    useHillSprints = false;
  } else if (sprintPhase === "mid_season_reload") {
    sprintProtocols = [
      "short_acceleration",
      "resisted_acceleration",
      "flying_sprints",
      "speed_endurance",
    ];
    useHillSprints = true;
    if (acwrForLogic >= 0.8) {
      useStairSprints = true;
      sprintProtocols.push("stair_sprints");
    }
  } else if (sprintPhase === "peak") {
    sprintProtocols = ["short_acceleration", "flying_sprints"];
    useHillSprints = false;
  }

  const sprintExerciseQueries = [
    supabase
      .from("exercises")
      .select("*")
      .or("category.eq.sprint,category.eq.speed,category.eq.acceleration")
      .or("name.ilike.%acceleration%,name.ilike.%sprint%,name.ilike.%speed%")
      .eq("active", true)
      .limit(4),
  ];

  if (useHillSprints) {
    sprintExerciseQueries.push(
      supabase
        .from("exercises")
        .select("*")
        .or("name.ilike.%hill%,name.ilike.%uphill%,name.ilike.%incline%")
        .eq("active", true)
        .limit(2),
    );
  }

  if (useStairSprints && acwrForLogic >= 0.8) {
    sprintExerciseQueries.push(
      supabase
        .from("exercises")
        .select("*")
        .or("name.ilike.%stair%,name.ilike.%step%")
        .eq("active", true)
        .limit(2),
    );
  }

  if (sprintProtocols.includes("flying_sprints")) {
    sprintExerciseQueries.push(
      supabase
        .from("exercises")
        .select("*")
        .or(
          "name.ilike.%flying%,name.ilike.%max velocity%,name.ilike.%top speed%",
        )
        .eq("active", true)
        .limit(2),
    );
  }

  if (sprintProtocols.includes("deceleration_training")) {
    sprintExerciseQueries.push(
      supabase
        .from("exercises")
        .select("*")
        .or(
          "category.eq.deceleration,name.ilike.%deceleration%,name.ilike.%braking%,name.ilike.%stop%",
        )
        .eq("active", true)
        .limit(2),
    );
  }

  const sprintExerciseResults = await Promise.all(sprintExerciseQueries);
  const uniqueSprintExercises = Array.from(
    new Map(
      sprintExerciseResults
        .flatMap((result) => result.data || [])
        .map((exercise) => [exercise.id, exercise]),
    ).values(),
  );

  if (uniqueSprintExercises.length === 0) {
    return false;
  }

  const prioritized = uniqueSprintExercises.sort((a, b) => {
    const aName = (a.name || "").toLowerCase();
    const bName = (b.name || "").toLowerCase();
    const priority = [
      "acceleration",
      "sprint",
      "hill",
      "stair",
      "flying",
      "deceleration",
    ];
    const aIdx = priority.findIndex((item) => aName.includes(item));
    const bIdx = priority.findIndex((item) => bName.includes(item));

    if (aIdx !== -1 && bIdx !== -1) {
      return aIdx - bIdx;
    }
    if (aIdx !== -1) {
      return -1;
    }
    if (bIdx !== -1) {
      return 1;
    }
    return 0;
  });

  const exerciseCount =
    sprintPhase === "speed_development" || sprintPhase === "mid_season_reload"
      ? 6
      : 4;

  for (const [idx, exercise] of prioritized.slice(0, exerciseCount).entries()) {
    const config = await getSprintExerciseConfigFromDB(
      supabase,
      exercise,
      sprintPhase,
    );
    protocolExercises.push({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      block_type: "main_session",
      sequence_order: idx + 1,
      prescribed_sets: config.sets,
      prescribed_reps: config.reps,
      rest_seconds: config.restSeconds,
      prescribed_duration_seconds: exercise.default_duration_seconds,
      load_contribution_au: exercise.load_contribution_au || 15,
      ai_note: config.aiNote,
    });
  }

  logger.info("daily_protocol_sprint_session_generated", {
    sprintPhase,
    protocols: sprintProtocols,
    hillSprints: useHillSprints,
    stairSprints: useStairSprints,
  });

  return true;
}

async function addFlagMainSession({ supabase, protocolExercises }) {
  const { data: flagExercises } = await supabase
    .from("exercises")
    .select("*")
    .or("category.eq.skill,category.eq.agility,category.eq.conditioning")
    .eq("active", true)
    .limit(8);

  if (!flagExercises || flagExercises.length === 0) {
    return false;
  }

  flagExercises.slice(0, 6).forEach((exercise, idx) => {
    protocolExercises.push({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      block_type: "main_session",
      sequence_order: idx + 1,
      prescribed_sets: exercise.default_sets || 3,
      prescribed_reps: exercise.default_reps || 8,
      prescribed_duration_seconds: exercise.default_duration_seconds,
      load_contribution_au: exercise.load_contribution_au || 12,
      ai_note: "Flag Football Training - Skill and agility development",
    });
  });

  logger.info("daily_protocol_flag_session_generated", {});
  return true;
}

async function addFallbackMainSession({
  supabase,
  protocolExercises,
  context,
  hasGymAccess,
  hasFieldAccess,
  isSprintSession,
  isGymTrainingDay,
  trainingFocus,
  sessionType,
  sessionCategory,
}) {
  logger.warn("daily_protocol_main_session_fallback", {
    hasProgram: !!context.playerProgram,
    hasSessionTemplate: !!context.sessionTemplate,
    hasGymAccess,
    hasFieldAccess,
    isSprintSession,
    isGymTrainingDay,
    trainingFocus,
  });

  const { data: fallbackExercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("category", sessionCategory)
    .eq("active", true)
    .limit(6);

  if (!fallbackExercises || fallbackExercises.length === 0) {
    return false;
  }

  fallbackExercises.forEach((exercise, idx) => {
    protocolExercises.push({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      block_type: "main_session",
      sequence_order: idx + 1,
      prescribed_sets: exercise.default_sets || 3,
      prescribed_reps: exercise.default_reps || 8,
      prescribed_duration_seconds: exercise.default_duration_seconds,
      load_contribution_au: exercise.load_contribution_au || 10,
      ai_note: `Main Training Session - ${sessionType}`,
    });
  });

  logger.info("daily_protocol_fallback_session_generated", {});
  return true;
}

/**
 * Sprint exercise prescription — DB-first, hardcoded fallback.
 * Queries prescription_templates for the modality derived from the exercise
 * name, then falls back to the corrected hardcoded values (Phase-B audit).
 */
async function getSprintExerciseConfigFromDB(supabase, exercise, sprintPhase) {
  const name = (exercise.name || "").toLowerCase();

  // Map name keywords → modality slugs that exist in prescription_templates
  let modality = "sprint";
  if (name.includes("hill") || name.includes("uphill")) {
    modality = "uphill_sprint";
  } else if (name.includes("flying") || name.includes("max velocity")) {
    modality = "flying_sprint";
  } else if (name.includes("deceleration") || name.includes("braking")) {
    modality = "deceleration";
  }

  const tpl = await getPrescriptionTemplate(supabase, {
    modality,
    periodizationPhase: sprintPhase,
  }).catch(() => null);

  if (tpl) {
    return {
      sets: tpl.prescribed_sets,
      reps: tpl.prescribed_reps,
      restSeconds: tpl.rest_seconds,
      aiNote: `${exercise.name} — ${tpl.methodology_citation}`,
    };
  }

  // Fallback: corrected hardcoded values (audit findings P0 #5-8)
  if (modality === "uphill_sprint") {
    return {
      sets: 3,
      reps: 4,
      restSeconds: 90,
      aiNote:
        "Hill Sprints - Develops horizontal force and acceleration (Paradisis & Cooke 2006)",
    };
  }
  if (name.includes("stair") || name.includes("step")) {
    return {
      sets: 3,
      reps: 4,
      restSeconds: 90,
      aiNote:
        "Stair Sprints - ADVANCED: Explosive hip flexor power. Only for well-conditioned athletes (ACWR >= 0.8)",
    };
  }
  if (modality === "flying_sprint") {
    return {
      sets: 2,
      reps: 3,
      restSeconds: 180,
      aiNote:
        "Flying Sprints - Maximum velocity development. Full recovery required (Morin 2015)",
    };
  }
  if (modality === "deceleration") {
    return {
      sets: 3,
      reps: 4,
      restSeconds: 90,
      aiNote:
        "Deceleration Training - CRITICAL for flag football. ≥90s recovery (Komi 2000)",
    };
  }
  return {
    sets: 3,
    reps: 4,
    restSeconds: 90,
    aiNote: `Acceleration Sprints - ${sprintPhase} phase. Focus on first 10m burst (most critical for flag football)`,
  };
}
