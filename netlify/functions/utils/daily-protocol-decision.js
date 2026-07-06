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
      baselineProgram: context.sessionResolution?.status === "baseline_program",
      originalStatus:
        context.sessionResolution?.metadata?.originalStatus || null,
      reason: context.sessionResolution?.reason || null,
    },
  };

  // Readiness thresholds: prefer readiness_gates table over hardcoded values.
  // Conservative fall-backs (50/70/55) match the seeded rows and the prior
  // hardcoded values — so behaviour is identical until a coach edits the table.
  const { data: gateRows } = await supabase
    .from("readiness_gates")
    .select("context, threshold_low, threshold_mid")
    .in("context", ["session_type_select", "baseline_focus"])
    .eq("is_active", true);
  const gateMap = Object.fromEntries(
    (gateRows ?? []).map((g) => [g.context, g]),
  );
  const sessionGate = gateMap["session_type_select"] ?? {
    threshold_low: 50,
    threshold_mid: 70,
  };
  const baselineGate = gateMap["baseline_focus"] ?? { threshold_low: 55 };

  // No fabrication (SOT Spec Laws 6/7): when readiness/load is unknown, do NOT
  // assume a healthy 70/1.0 and push a full session. Missing readiness uses a
  // CONSERVATIVE proxy (biases the day to a lighter skill session via the <70
  // branch and a lower load) and gates on logging; missing ACWR stays neutral
  // (won't trip the danger thresholds, but won't flatter either).
  const CONSERVATIVE_NO_DATA_READINESS = 60;
  const hasReadiness = readinessScore !== null && readinessScore !== undefined;
  const hasAcwr = acwrValue !== null && acwrValue !== undefined;
  const readinessForLogic = hasReadiness
    ? readinessScore
    : CONSERVATIVE_NO_DATA_READINESS;
  const acwrForLogic = hasAcwr ? acwrValue : 1.0;

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
    readinessForLogic < sessionGate.threshold_low ||
    acwrForLogic > context.acwrTargetRange.max
  ) {
    trainingFocus = "recovery";
    aiRationale =
      "⚠️ Readiness is low or ACWR is high. Today focuses on recovery and mobility.";
  } else if (readinessForLogic < sessionGate.threshold_mid) {
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
      baselineGate.threshold_low,
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

  // Phase resolution priority (highest → lowest):
  // 1. context.dbSeasonPhase — team_season_phases DB row (set by daily-protocol.js)
  // 2. context.seasonPhase   — client calendar-derived override (COMPOSE intent layer)
  // 3. getCurrentPeriodizationPhase month-switch fallback
  const CLIENT_PHASE_MAP = {
    offseason: "off_season_rest",
    preseason: "competition_prep",
    inseason: "in_season_maintenance",
    transition: "active_recovery",
  };
  const periodizationPhase = context.dbSeasonPhase
    ? context.dbSeasonPhase
    : context.seasonPhase
      ? (CLIENT_PHASE_MAP[context.seasonPhase] ??
        getCurrentPeriodizationPhase(parseIsoDateString(date)))
      : getCurrentPeriodizationPhase(parseIsoDateString(date));
  aiRationale += ` 📊 Periodization: ${PERIODIZATION_PHASE_NAMES[periodizationPhase] || periodizationPhase}.`;

  // Only surface the ACWR-elevated warning when ACWR is actually known.
  if (hasAcwr && acwrForLogic > 1.3) {
    aiRationale += ` ⚠️ ACWR elevated (${acwrForLogic.toFixed(2)}) - load auto-adjusted for safety.`;
  }

  // Gate: tell the athlete the day is a conservative default, not a real read.
  if (!hasReadiness) {
    aiRationale +=
      " 📋 No wellness data yet — using a conservative default. Log your check-in to personalise today's session.";
  }

  const baseLoadTarget = Math.round(readinessForLogic * 15);
  let adjustedLoadTarget = Math.round(
    baseLoadTarget / (context.ageModifier?.recovery_modifier || 1),
  );

  if (taperLoadMultiplier < 1) {
    adjustedLoadTarget = Math.round(adjustedLoadTarget * taperLoadMultiplier);
  }

  // Recovery-block load cap (S2): a coach/system-imposed recovery block (e.g. after
  // a heavy game weekend, set in games-core.js / wellness-checkin.js) carries a
  // max_load_percent. ENFORCE it here so the day's prescribed load is actually
  // capped — previously the block was only surfaced in chat, never applied to the
  // protocol, so a deload the system ordered was silently ignored.
  let recoveryBlockCap = null;
  const { data: activeBlock } = await supabase
    .from("recovery_blocks")
    .select("max_load_percent, focus, restrictions")
    .eq("user_id", userId)
    .lte("block_start_date", date)
    .gte("block_end_date", date)
    .not("max_load_percent", "is", null)
    .order("block_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (
    activeBlock?.max_load_percent !== null &&
    activeBlock?.max_load_percent !== undefined &&
    activeBlock.max_load_percent < 100
  ) {
    const beforeCap = adjustedLoadTarget;
    adjustedLoadTarget = Math.round(
      adjustedLoadTarget * (activeBlock.max_load_percent / 100),
    );
    recoveryBlockCap = {
      maxLoadPercent: activeBlock.max_load_percent,
      focus: activeBlock.focus ?? null,
      restrictions: activeBlock.restrictions ?? null,
    };
    aiRationale += ` 🛡️ Recovery block active — load capped to ${activeBlock.max_load_percent}% (${beforeCap}→${adjustedLoadTarget} AU).`;
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
    taperLoadMultiplier,
    recoveryBlockCap,
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
  baselineThreshold = 55,
) {
  if (
    readinessForLogic < baselineThreshold ||
    acwrForLogic > acwrTargetRange.max
  ) {
    return "recovery";
  }

  return BASELINE_FOCUS_BY_DAY[dayOfWeek] || "strength";
}
