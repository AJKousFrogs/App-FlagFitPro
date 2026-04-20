import { parseIsoDateString } from "./date-utils.js";
import { getCurrentPeriodizationPhase } from "./daily-protocol-training-logic.js";

const PERIODIZATION_PHASE_NAMES = {
  off_season_rest: "Active Recovery",
  foundation: "Foundation Building",
  strength_accumulation: "Strength Accumulation",
  power_development: "Power Development",
  speed_development: "Speed & Explosive",
  competition_prep: "Competition Prep",
  in_season_maintenance: "In-Season Maintenance",
  mid_season_reload: "Mid-Season Reload",
  peak: "Championship Peak",
  taper: "Taper",
  active_recovery: "Active Recovery",
};

const TRAINING_SESSIONS_TABLE = "training_sessions";

const BASELINE_FOCUS_BY_DAY = {
  0: "recovery",
  1: "strength",
  2: "skill",
  3: "strength",
  4: "conditioning",
  5: "skill",
  6: "speed",
};

export async function buildProtocolDecisionContext({
  supabase,
  userId,
  date,
  context,
  computeReadinessDaysStale,
  computeTrainingDaysLogged,
}) {
  const readinessScore = context.readiness?.score || null;
  const acwrValue = context.readiness?.acwr || null;
  const readinessHasCheckin = context.readiness?.hasCheckin === true;

  const readinessDaysStale = await computeReadinessDaysStale(
    supabase,
    userId,
    date,
    {
      hasCheckinToday: readinessHasCheckin,
      readinessScore,
    },
  );
  const trainingDaysLogged = await computeTrainingDaysLogged(
    supabase,
    userId,
    date,
    TRAINING_SESSIONS_TABLE,
  );

  const confidenceMetadata = {
    readiness: {
      hasData: readinessScore !== null,
      source: readinessHasCheckin ? "wellness_checkin" : "none",
      daysStale: readinessDaysStale,
      confidence: readinessScore !== null ? "high" : "none",
    },
    acwr: {
      hasData: acwrValue !== null,
      source:
        acwrValue !== null || trainingDaysLogged !== null
          ? "training_sessions"
          : "none",
      trainingDaysLogged,
      confidence: acwrValue !== null ? "high" : "building_baseline",
    },
    sessionResolution: {
      success: context.sessionResolution?.success || false,
      status: context.sessionResolution?.status || "unknown",
      hasProgram: !!context.playerProgram,
      hasSessionTemplate: !!context.sessionTemplate,
      baselineProgram:
        context.sessionResolution?.status === "baseline_program",
      originalStatus: context.sessionResolution?.metadata?.originalStatus || null,
      reason: context.sessionResolution?.reason || null,
    },
  };

  const readinessForLogic = readinessScore !== null ? readinessScore : 70;
  const acwrForLogic = acwrValue !== null ? acwrValue : 1.0;

  const isPracticeDay =
    context.sessionResolution?.override?.type === "flag_practice";
  const isFilmRoomDay =
    context.sessionResolution?.override?.type === "film_room";
  const isBaselineProgram =
    context.sessionResolution?.status === "baseline_program";

  let trainingFocus = "strength";
  let aiRationale = "";

  if (isPracticeDay && context.teamActivity?.activity) {
    const practiceTime =
      context.teamActivity.activity.startTimeLocal || "18:00";
    aiRationale = `🏈 Flag practice day (${practiceTime}). `;

    if (context.isQB || context.isCenter) {
      aiRationale += context.isQB
        ? "QB: Practice scheduled. Arm care is light activation only - no heavy throwing before practice."
        : "Center: Practice scheduled. Arm/wrist care is light activation only - snapping/throwing prep before practice.";
      trainingFocus = "practice_day_qb";
    } else {
      aiRationale +=
        "Training adjusted to complement practice. Lower body work OK, rest before practice.";
      trainingFocus = "practice_day";
    }
  } else if (
    readinessForLogic < 50 ||
    acwrForLogic > context.acwrTargetRange.max
  ) {
    trainingFocus = "recovery";
    aiRationale =
      "⚠️ Readiness is low or ACWR is high. Today focuses on recovery and mobility.";
  } else if (readinessForLogic < 70) {
    trainingFocus = "skill";
    aiRationale =
      "Moderate readiness. Technical work recommended over high intensity.";
  } else if (context.sessionTemplate) {
    trainingFocus =
      context.sessionTemplate.session_type?.toLowerCase() || "strength";
    aiRationale = `📋 ${context.sessionTemplate.session_name}: ${context.sessionTemplate.description || "Structured training from your program."}`;
  } else if (isBaselineProgram) {
    trainingFocus = resolveBaselineTrainingFocus(
      context.dayOfWeek,
      readinessForLogic,
      acwrForLogic,
      context.acwrTargetRange,
    );
    aiRationale =
      "Baseline flag football plan active. Training starts from safe daily defaults and becomes more personalized as workouts, readiness, team practices, and competitions are logged.";
  } else {
    aiRationale = "Good readiness! Today is great for training.";
  }

  let taperLoadMultiplier = 1.0;
  if (context.taperContext?.isInTaper) {
    const taper = context.taperContext;
    taperLoadMultiplier = taper.loadMultiplier;

    if (taper.daysUntil <= 2) {
      trainingFocus = "taper_final";
    } else if (taper.daysUntil <= 7) {
      trainingFocus = "taper_week";
    } else {
      trainingFocus = "taper_early";
    }

    const taperEmoji = taper.tournament.isPeakEvent ? "🏆" : "🎯";
    aiRationale = `${taperEmoji} TAPER for ${taper.tournament.name} (${taper.daysUntil} days). ${taper.recommendation} ${aiRationale}`;
  }

  if (context.ageModifier && context.ageModifier.recovery_modifier > 1.1) {
    aiRationale += ` 👴 Age-adjusted recovery: ${Math.round((context.ageModifier.recovery_modifier - 1) * 100)}% more rest recommended (ACWR target: ${context.acwrTargetRange.min}-${context.acwrTargetRange.max.toFixed(2)}).`;
  }

  if (context.currentPhase) {
    aiRationale += ` 📅 Phase: ${context.currentPhase.name}.`;
  }

  const periodizationPhase = getCurrentPeriodizationPhase(
    parseIsoDateString(date),
  );
  aiRationale += ` 📊 Periodization: ${PERIODIZATION_PHASE_NAMES[periodizationPhase] || periodizationPhase}.`;

  if (acwrForLogic > 1.3) {
    aiRationale += ` ⚠️ ACWR elevated (${acwrForLogic.toFixed(2)}) - load auto-adjusted for safety.`;
  }

  const baseLoadTarget = Math.round(readinessForLogic * 15);
  let adjustedLoadTarget = Math.round(
    baseLoadTarget / (context.ageModifier?.recovery_modifier || 1),
  );

  if (taperLoadMultiplier < 1) {
    adjustedLoadTarget = Math.round(adjustedLoadTarget * taperLoadMultiplier);
  }

  return {
    readinessScore,
    acwrValue,
    confidenceMetadata,
    readinessForLogic,
    acwrForLogic,
    trainingFocus,
    aiRationale,
    adjustedLoadTarget,
    isPracticeDay,
    isFilmRoomDay,
    periodizationPhase,
  };
}

function resolveBaselineTrainingFocus(
  dayOfWeek,
  readinessForLogic,
  acwrForLogic,
  acwrTargetRange,
) {
  if (readinessForLogic < 55 || acwrForLogic > acwrTargetRange.max) {
    return "recovery";
  }

  return BASELINE_FOCUS_BY_DAY[dayOfWeek] || "strength";
}
