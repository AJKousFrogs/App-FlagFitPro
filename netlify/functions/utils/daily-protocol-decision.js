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

// Fallback session labels when the COMPOSE layer sends an intent without a label
// (it normally sends intentLabel). Keeps the rationale descriptor honest + aligned
// with the hero. Not a periodization source — just display text for the intent.
const COMPOSE_INTENT_LABELS = {
  rest: "Rest + daily mobility",
  recovery: "Active recovery",
  mobility: "Mobility session",
  travel: "Travel day",
  competition: "Game day",
  sprint: "Speed & acceleration",
  "taper-prime": "Pre-game prime",
  strength: "Strength session",
  mixed: "Mixed session",
  technical: "Technical skills",
  practice_day: "Flag football practice",
};

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
  injuryResponse = null,
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

  if (context.intent) {
    // COMPOSE single authority (Phase 2 B4/B5): the rationale descriptor is the
    // intent's OWN label — the exact text the hero and This-Week render — so a
    // day-of-week `training_session_templates` row ("Monday - Speed") or
    // BASELINE_FOCUS_BY_DAY can never override it. trainingFocus/isSprintSession/
    // isGymTrainingDay are set authoritatively by the COMPOSE layer downstream
    // (daily-protocol.js), so this branch owns only the framing text.
    const label =
      context.intentLabel ||
      COMPOSE_INTENT_LABELS[context.intent] ||
      "Today's session";
    aiRationale = `📋 ${label}.`;
  } else if (isPracticeDay && context.teamActivity?.activity) {
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

  // SINGLE PHASE AUTHORITY (Phase 2 — kill the drift). The rationale renders ONE
  // phase, and periodizationPhase derives ONLY from the resolved season phase —
  // NEVER from the calendar month. The old chain fell back to a month-switch
  // (getCurrentPeriodizationPhase → July="Mid-Season Reload"), which contradicted
  // the canonical resolvePhase result and fabricated a plausible-but-wrong phase
  // for an athlete with no season plan. Priority:
  //   1. context.dbSeasonPhase — team_season_phases DB row (canonical, coach-set)
  //   2. context.seasonPhase   — client calendar-derived (resolvePhase → COMPOSE)
  //   3. no season info → a CONSERVATIVE base, and the rationale SAYS so (the
  //      "no invented inputs" rule — never silently guess a mid-season block).
  const CLIENT_PHASE_MAP = {
    offseason: "off_season_rest",
    preseason: "competition_prep",
    inseason: "in_season_maintenance",
    transition: "active_recovery",
  };
  const hasSeasonInfo = !!(context.dbSeasonPhase || context.seasonPhase);
  const periodizationPhase = context.dbSeasonPhase
    ? context.dbSeasonPhase
    : context.seasonPhase
      ? (CLIENT_PHASE_MAP[context.seasonPhase] ?? "off_season_rest")
      : "off_season_rest";
  aiRationale += ` 📅 Phase: ${PERIODIZATION_PHASE_NAMES[periodizationPhase] || periodizationPhase}.`;
  if (!hasSeasonInfo) {
    aiRationale +=
      " (No season plan set — using a conservative base. Set your season calendar in Settings to periodize toward your first gameday.)";
  }

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

  // Injury down-regulation (Tissue Load Engine §4.3): a minor/moderate active
  // injury cuts today's LOAD target (which flows into ACWR as the athlete logs
  // the lighter session). Graded, not a shutdown — the athlete keeps training.
  let injuryLoadAdjustment = null;
  if (
    injuryResponse?.hasInjury &&
    !injuryResponse.goRtp &&
    injuryResponse.loadFactor < 1
  ) {
    const beforeInjury = adjustedLoadTarget;
    adjustedLoadTarget = Math.round(
      adjustedLoadTarget * injuryResponse.loadFactor,
    );
    injuryLoadAdjustment = {
      severity: injuryResponse.severity,
      regions: injuryResponse.injuredRegions,
      loadFactor: injuryResponse.loadFactor,
      beforeAu: beforeInjury,
      afterAu: adjustedLoadTarget,
    };
    aiRationale += ` 🩹 ${injuryResponse.severity} ${injuryResponse.injuredRegions.join(", ") || "soft-tissue"} flag — load down-regulated to ${Math.round(injuryResponse.loadFactor * 100)}% (${beforeInjury}→${adjustedLoadTarget} AU); injured-region work removed. Keep training, don't train through it.`;
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
    injuryLoadAdjustment,
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
