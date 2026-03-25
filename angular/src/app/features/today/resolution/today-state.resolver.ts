/**
 * TODAY State → Behavior Resolution Contract v1 Implementation
 *
 * Pure deterministic function that maps protocol JSON + current time
 * to a TodayViewModel according to the contract priority stack.
 *
 * Contract: CONTRACT_2.2_TODAY_State_Behavior_Resolution.md
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

export interface ProtocolJson {
  // Core data
  id?: string;
  protocol_date?: string;
  readiness_score?: number | null;
  acwr_value?: number | null;
  acwr_presentation?: {
    value?: number | null;
    level?:
      | "sweet-spot"
      | "under-training"
      | "elevated-risk"
      | "danger-zone"
      | "no-data";
    label?: string | null;
    text?: string | null;
  };

  // Confidence metadata (from backend)
  confidence_metadata?: {
    readiness?: {
      hasData?: boolean;
      source?: string;
      daysStale?: number | null;
      confidence?: "none" | "stale" | "measured" | "high";
    };
    acwr?: {
      hasData?: boolean;
      source?: string;
      trainingDaysLogged?: number | null;
      confidence?: "none" | "building_baseline" | "high";
    };
    sessionResolution?: {
      success?: boolean;
      status?: string;
      hasProgram?: boolean;
      hasSessionTemplate?: boolean;
      override?: string | null;
    };
    hasActiveProgram?: boolean;
    injuryProtocolActive?: boolean;
  };

  // Session resolution (from backend)
  session_resolution?: {
    success?: boolean;
    status?: string;
    override?: {
      type?: string;
      reason?: string;
    } | null;
  };

  // Coach modifications
  coach_modified?: boolean;
  modified_by_coach_id?: string;
  modified_by_coach_name?: string;
  modified_at?: string;
  coach_alert_active?: boolean;
  coach_alert_type?: string;
  coach_alert_message?: string;
  coach_note?: {
    content: string;
    created_at?: string;
  };
  coach_alert_requires_acknowledgment?: boolean;
  coach_acknowledged?: boolean;

  // Team activity (canonical source of truth - PROMPT 2.11)
  teamActivity?: {
    type: "practice" | "film_room" | "cancelled" | "other" | null;
    startTimeLocal?: string | null;
    endTimeLocal?: string | null;
    location?: string | null;
    participation?: "required" | "optional" | "excluded" | null;
    createdByCoachName?: string | null;
    updatedAtLocal?: string | null;
    note?: string | null;
  } | null;

  // DEPRECATED: availability is informational only; team_activities is authority.

  // Taper context
  taper_active?: boolean;
  taper_days_until?: number;
  tournament_name?: string;

  // Weather
  weather_override?: boolean;
  weather_condition?: string;

  // Blocks (simplified for resolution)
  blocks?: Array<{
    type: string;
    title: string;
  }>;
}

export interface TodayViewModel {
  // Core state
  trainingAllowed: boolean;
  errorState?: {
    reason_code: string;
    message: string;
    cta?: {
      label: string;
      action: string;
    };
  };

  // Banners (ordered by priority)
  banners: Array<{
    type: "error" | "alert" | "warning" | "info";
    style: "red" | "amber" | "blue";
    text: string;
    ctas?: Array<{
      label: string;
      action: string;
      variant?: "primary" | "secondary";
    }>;
  }>;

  // Blocks to display (ordered)
  blocksDisplayed: string[];

  // CTAs
  primaryCta?: {
    label: string;
    action: string;
  };
  secondaryCta?: {
    label: string;
    action: string;
  };

  // Merlin posture
  merlinPosture: "silent" | "explanatory" | "warning" | "refusal";

  // Header context
  headerContext?: {
    practiceTime?: string;
    filmRoomTime?: string;
    coachAttribution?: string;
    rehabPhase?: string;
    taperContext?: string;
  };

  // ACWR baseline info
  acwrBaseline?: {
    trainingDaysLogged: number;
    progressPercent: number;
  };
}

type SessionResolutionState = {
  success?: boolean;
  status?: string;
  override?: {
    type?: string;
    reason?: string;
  } | null;
};

type ConfidenceSessionResolutionState = {
  success?: boolean;
  status?: string;
  hasProgram?: boolean;
  hasSessionTemplate?: boolean;
  override?: string | null;
};

function resolveSessionStatus(
  sessionResolution: SessionResolutionState | undefined,
  confidenceSessionResolution: ConfidenceSessionResolutionState | undefined,
): string {
  const primaryStatus = sessionResolution?.status;
  const fallbackStatus = confidenceSessionResolution?.status;
  const exceptionalStatus =
    [primaryStatus, fallbackStatus].find(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0 &&
        value !== "resolved",
    ) ?? null;

  if (exceptionalStatus) {
    return exceptionalStatus;
  }

  return primaryStatus || fallbackStatus || "unknown";
}

function resolveOverrideType(
  sessionResolution: SessionResolutionState | undefined,
  confidenceSessionResolution: ConfidenceSessionResolutionState | undefined,
): string | null {
  const primaryOverride =
    sessionResolution?.override &&
    typeof sessionResolution.override.type === "string"
      ? sessionResolution.override.type
      : null;
  const fallbackOverride =
    typeof confidenceSessionResolution?.override === "string"
      ? confidenceSessionResolution.override
      : null;

  return primaryOverride || fallbackOverride || null;
}

/**
 * Resolve TODAY screen state from protocol JSON
 *
 * Applies exact priority stack from contract:
 * 1. Session Resolution Failure
 * 2. No Active Program
 * 3. Injury Protocol Active
 * 4. Coach Alert Active
 * 5. Weather Override
 * 6. Flag Football Practice
 * 7. Film Room / Team Activity
 * 8. Taper Period
 * 9. Wellness State + ACWR Confidence
 */
export function resolveTodayState(
  protocolJson: ProtocolJson | null,
  _nowLocal: Date = new Date(),
): TodayViewModel {
  // Handle null/undefined protocol
  if (!protocolJson) {
    return {
      trainingAllowed: false,
      errorState: {
        reason_code: "NO_PROTOCOL_DATA",
        message: "No protocol data available. Generating your plan...",
      },
      banners: [],
      blocksDisplayed: [],
      merlinPosture: "explanatory",
    };
  }

  const resolveBlocks = (fallback: string[]): string[] =>
    protocolJson.blocks?.length
      ? protocolJson.blocks.map((b) => b.type)
      : fallback;

  const cm = protocolJson.confidence_metadata || {};
  const sr = protocolJson.session_resolution || {};
  const readiness = cm.readiness || {};
  const acwr = cm.acwr || {};
  const sessionRes = cm.sessionResolution || {};
  const status = resolveSessionStatus(sr, sessionRes);
  const overrideType = resolveOverrideType(sr, sessionRes);

  // ========================================================================
  // PRIORITY 1: Session Resolution Failure (excluding external_program and no_program)
  // ========================================================================
  if (
    (sr.success === false || sessionRes.success === false) &&
    status !== "external_program" &&
    status !== "no_program"
  ) {
    const failureMessage =
      status === "no_template"
        ? "No session found for today. Program not configured for this date. Contact your coach."
        : "Unable to resolve training session. Contact your coach.";

    return {
      trainingAllowed: false,
      errorState: {
        reason_code: "SESSION_RESOLUTION_FAILED",
        message: failureMessage,
        cta: {
          label: "Contact Coach",
          action: "contact_coach",
        },
      },
      banners: [
        {
          type: "error",
          style: "red",
          text: failureMessage,
          ctas: [
            {
              label: "Contact Coach",
              action: "contact_coach",
              variant: "primary",
            },
          ],
        },
      ],
      blocksDisplayed: [],
      merlinPosture: "explanatory",
    };
  }

  // ========================================================================
  // PRIORITY 2: No Active Program (status = 'no_program')
  // ========================================================================
  if (
    status === "no_program" ||
    (cm.hasActiveProgram === false &&
      sessionRes.hasProgram !== true &&
      status !== "external_program")
  ) {
    return {
      trainingAllowed: false,
      errorState: {
        reason_code: "NO_ACTIVE_PROGRAM",
        message:
          "No training program assigned. Complete onboarding or contact your coach to get started.",
        cta: {
          label: "Contact Coach",
          action: "contact_coach",
        },
      },
      banners: [
        {
          type: "error",
          style: "red",
          text: "No training program assigned. Complete onboarding or contact your coach to get started.",
          ctas: [
            {
              label: "Contact Coach",
              action: "contact_coach",
              variant: "primary",
            },
          ],
        },
      ],
      blocksDisplayed: [],
      merlinPosture: "refusal",
    };
  }

  // ========================================================================
  // PRIORITY 2b: External Program (self-managed training)
  // ========================================================================
  if (status === "external_program") {
    const banners: TodayViewModel["banners"] = [
      {
        type: "info",
        style: "blue",
        text: "📋 External Program Active. You're managing your own training. Log workouts to track ACWR.",
        ctas: [
          {
            label: "Log Workout",
            action: "log_workout",
            variant: "primary",
          },
        ],
      },
    ];

    // ACWR baseline info
    const acwrBaseline =
      acwr.confidence === "building_baseline" &&
      acwr.trainingDaysLogged !== null &&
      acwr.trainingDaysLogged !== undefined
        ? {
            trainingDaysLogged: acwr.trainingDaysLogged,
            progressPercent: Math.min(
              (acwr.trainingDaysLogged / 21) * 100,
              100,
            ),
          }
        : undefined;

    return {
      trainingAllowed: true,
      banners,
      blocksDisplayed: ["morning_mobility", "foam_roll", "recovery"],
      primaryCta: {
        label: "Log Workout",
        action: "log_workout",
      },
      merlinPosture: "explanatory",
      acwrBaseline,
    };
  }

  // ========================================================================
  // PRIORITY 3: Injury Protocol Active
  // ========================================================================
  if (
    cm.injuryProtocolActive === true ||
    overrideType === "rehab_protocol"
  ) {
    // Check if team activity exists (even if excluded)
    const hasTeamActivity =
      protocolJson.teamActivity &&
      protocolJson.teamActivity.type !== null &&
      protocolJson.teamActivity.participation === "excluded";

    const banners: TodayViewModel["banners"] = [
      {
        type: "alert",
        style: "amber",
        text: hasTeamActivity
          ? `🏥 Return-to-Play Protocol Active. Team practice today, but you're excluded for rehab. Pain > 3/10? Stop immediately.`
          : `🏥 Return-to-Play Protocol Active. Pain > 3/10? Stop immediately.`,
        ctas: [
          {
            label: "View Rehab Phase Details",
            action: "view_rehab",
            variant: "primary",
          },
          {
            label: "Contact Physio",
            action: "contact_physio",
            variant: "secondary",
          },
        ],
      },
    ];

    // Add practice context if team activity exists (even though excluded)
    if (hasTeamActivity && protocolJson.teamActivity?.startTimeLocal) {
      banners.push({
        type: "info",
        style: "blue",
        text: `🏈 Team practice today at ${protocolJson.teamActivity.startTimeLocal}. You're excluded for rehab.`,
      });
    }

    return {
      trainingAllowed: true,
      banners,
      blocksDisplayed: ["morning_mobility", "rehab_exercises", "recovery"],
      primaryCta: {
        label: "View Rehab Phase Details",
        action: "view_rehab",
      },
      secondaryCta: {
        label: "Contact Physio",
        action: "contact_physio",
      },
      merlinPosture: "refusal",
      headerContext: {
        rehabPhase: "Active",
      },
    };
  }

  // ========================================================================
  // PRIORITY 4: Coach Alert Active
  // ========================================================================
  if (protocolJson.coach_alert_active === true) {
    const requiresAck =
      protocolJson.coach_alert_requires_acknowledgment === true;
    const acknowledged = protocolJson.coach_acknowledged === true;
    // Training blocked if acknowledgment required AND not yet acknowledged
    const trainingBlocked = requiresAck && !acknowledged;

    const banners: TodayViewModel["banners"] = [
      {
        type: "alert",
        style: "amber",
        text: `🔔 Coach Alert: ${protocolJson.coach_alert_message || "Coach has updated your plan."}${trainingBlocked ? " Acknowledgment required before training." : ""}`,
        ctas: trainingBlocked
          ? [
              {
                label: "Read Coach Message",
                action: "read_coach_alert",
                variant: "primary",
              },
            ]
          : [],
      },
    ];

    return {
      trainingAllowed: !trainingBlocked,
      banners,
      blocksDisplayed: protocolJson.blocks?.map((b) => b.type) || [],
      primaryCta: trainingBlocked
        ? {
            label: "Acknowledge",
            action: "acknowledge_coach_alert",
          }
        : undefined,
      merlinPosture: trainingBlocked ? "silent" : "explanatory",
      headerContext: protocolJson.modified_by_coach_name
        ? {
            coachAttribution: `Updated by Coach ${protocolJson.modified_by_coach_name}`,
          }
        : undefined,
    };
  }

  // ========================================================================
  // PRIORITY 5: Weather Override
  // ========================================================================
  if (
    protocolJson.weather_override === true ||
    overrideType === "weather_override"
  ) {
    const banners: TodayViewModel["banners"] = [
      {
        type: "alert",
        style: "amber",
        text: `🌧️ Weather Alert: ${protocolJson.weather_condition || "Practice moved indoors"}. ${protocolJson.modified_by_coach_name ? `Updated plan from Coach ${protocolJson.modified_by_coach_name}` : "Updated plan from coach"}.`,
        ctas: [
          {
            label: "View Coach Note",
            action: "view_coach_note",
            variant: "primary",
          },
        ],
      },
    ];

    // Add wellness CTA if missing
    if (!readiness.hasData) {
      banners.push({
        type: "info",
        style: "blue",
        text: "Check-in not logged yet. Your plan uses program defaults until you update.",
        ctas: [
          {
            label: "2-min Check-in",
            action: "open_checkin",
            variant: "primary",
          },
          {
            label: "Start Anyway",
            action: "start_training",
            variant: "secondary",
          },
        ],
      });
    }

    return {
      trainingAllowed: true,
      banners,
      blocksDisplayed: ["morning_mobility", "film_room", "recovery"],
      primaryCta: {
        label: "View Coach Note",
        action: "view_coach_note",
      },
      secondaryCta: !readiness.hasData
        ? {
            label: "2-min Check-in",
            action: "open_checkin",
          }
        : undefined,
      merlinPosture: "explanatory",
      headerContext: protocolJson.modified_by_coach_name
        ? {
            coachAttribution: `Updated by Coach ${protocolJson.modified_by_coach_name}`,
          }
        : undefined,
    };
  }

  // ========================================================================
  // PRIORITY 6: Flag Football Practice
  // PROMPT 2.11: Practice day determined ONLY from sessionResolution.override (which comes from teamActivity)
  // ========================================================================
  if (overrideType === "flag_practice") {
    const teamActivity = protocolJson.teamActivity;
    const practiceTime = teamActivity?.startTimeLocal || "18:00";
    const practiceLocation = teamActivity?.location;

    const banners: TodayViewModel["banners"] = [];

    // Add stale readiness warning if applicable
    if (
      readiness.daysStale !== null &&
      readiness.daysStale !== undefined &&
      readiness.daysStale > 0
    ) {
      const daysStale = Math.round(readiness.daysStale);
      banners.push({
        type: "warning",
        style: "amber",
        text: `⚠️ Last check-in was ${daysStale} day${daysStale > 1 ? "s" : ""} ago. Plan uses program defaults for practice prep.`,
        ctas: [
          {
            label: "Update Check-in",
            action: "open_checkin",
            variant: "primary",
          },
        ],
      });
    }

    // Add practice banner (from teamActivity, not player schedule)
    const practiceText = practiceLocation
      ? `🏈 Flag Practice Today — ${practiceTime} at ${practiceLocation}. Training adjusted.`
      : `🏈 Flag Practice Today — ${practiceTime}. Training adjusted.`;

    banners.push({
      type: "info",
      style: "blue",
      text: practiceText,
      ctas: [
        {
          label: "View Practice Details",
          action: "view_practice",
          variant: "secondary",
        },
      ],
    });

    return {
      trainingAllowed: true,
      banners,
      blocksDisplayed: resolveBlocks([
        "morning_mobility",
        "foam_roll",
        "warm_up",
        "main_session",
        "cool_down",
        "evening_recovery",
      ]),
      primaryCta:
        readiness.daysStale !== null &&
        readiness.daysStale !== undefined &&
        readiness.daysStale > 0
          ? {
              label: "Update Check-in",
              action: "open_checkin",
            }
          : {
              label: "View Practice Details",
              action: "view_practice",
            },
      secondaryCta:
        readiness.daysStale !== null &&
        readiness.daysStale !== undefined &&
        readiness.daysStale > 0
          ? {
              label: "Continue to Practice Prep",
              action: "start_training",
            }
          : undefined,
      merlinPosture:
        readiness.daysStale !== null &&
        readiness.daysStale !== undefined &&
        readiness.daysStale > 0
          ? "warning"
          : "explanatory",
      headerContext: {
        practiceTime,
      },
    };
  }

  // ========================================================================
  // PRIORITY 7: Film Room / Team Activity
  // PROMPT 2.11: Film room determined ONLY from sessionResolution.override (which comes from teamActivity)
  // ========================================================================
  if (overrideType === "film_room") {
    const teamActivity = protocolJson.teamActivity;
    const filmRoomTime = teamActivity?.startTimeLocal || "10:00";
    const filmRoomLocation = teamActivity?.location;

    const filmRoomText = filmRoomLocation
      ? `📽️ Film Room Today — ${filmRoomTime} at ${filmRoomLocation}. No field training scheduled. Recovery and mental prep day.`
      : `📽️ Film Room Today — ${filmRoomTime}. No field training scheduled. Recovery and mental prep day.`;

    return {
      trainingAllowed: true,
      banners: [
        {
          type: "info",
          style: "blue",
          text: filmRoomText,
          ctas: [
            {
              label: "View Film Room Details",
              action: "view_film_room",
              variant: "primary",
            },
          ],
        },
      ],
      blocksDisplayed: resolveBlocks([
        "morning_mobility",
        "foam_roll",
        "warm_up",
        "main_session",
        "cool_down",
        "evening_recovery",
      ]),
      primaryCta: {
        label: "View Film Room Details",
        action: "view_film_room",
      },
      merlinPosture: "explanatory",
      headerContext: {
        filmRoomTime,
      },
    };
  }

  // ========================================================================
  // PRIORITY 8: Taper Period
  // ========================================================================
  if (protocolJson.taper_active === true || overrideType === "taper") {
    const banners: TodayViewModel["banners"] = [
      {
        type: "info",
        style: "blue",
        text: `🎯 Tapering for ${protocolJson.tournament_name || "competition"} — ${protocolJson.taper_days_until || 0} days out. Volume reduced. Trust the process.`,
        ctas: [
          {
            label: "View Taper Plan",
            action: "view_taper",
            variant: "primary",
          },
        ],
      },
    ];

    return {
      trainingAllowed: true,
      banners,
      blocksDisplayed: resolveBlocks([
        "morning_mobility",
        "foam_roll",
        "warm_up",
        "main_session",
        "cool_down",
        "evening_recovery",
      ]),
      primaryCta: {
        label: "View Taper Plan",
        action: "view_taper",
      },
      merlinPosture: "warning",
      headerContext: {
        taperContext: `${protocolJson.tournament_name || "Competition"} in ${protocolJson.taper_days_until || 0} days`,
      },
    };
  }

  // ========================================================================
  // PRIORITY 9: Wellness State + ACWR Confidence (Normal Day)
  // ========================================================================
  const banners: TodayViewModel["banners"] = [];

  // Handle missing readiness
  if (
    !readiness.hasData ||
    protocolJson.readiness_score === null ||
    protocolJson.readiness_score === undefined
  ) {
    banners.push({
      type: "info",
      style: "blue",
      text: "ℹ️ Check-in not logged yet. Your plan uses program defaults until you update.",
      ctas: [
        {
          label: "2-min Check-in",
          action: "open_checkin",
          variant: "primary",
        },
        {
          label: "Start Anyway",
          action: "start_training",
          variant: "secondary",
        },
      ],
    });
  }

  // Handle stale readiness (1-2 days)
  if (
    readiness.daysStale !== null &&
    readiness.daysStale !== undefined &&
    readiness.daysStale > 0 &&
    readiness.daysStale <= 2
  ) {
    const daysStale = Math.round(readiness.daysStale);
    banners.push({
      type: "warning",
      style: "amber",
      text: `⚠️ Last check-in was ${daysStale} day${daysStale > 1 ? "s" : ""} ago. Update recommended.`,
      ctas: [
        {
          label: "Update Check-in",
          action: "open_checkin",
          variant: "primary",
        },
      ],
    });
  }

  // Determine blocks (normal training day)
  // Use blocks from protocol if available, otherwise default list
  // This ensures we show whatever blocks the backend generated (warm_up, main_session, cool_down, etc.)
  const blocksDisplayed: string[] = protocolJson.blocks?.length
    ? protocolJson.blocks.map((b) => b.type)
    : ["morning_mobility", "foam_roll", "main_session", "recovery"];

  // ACWR baseline info
  const acwrBaseline =
    acwr.confidence === "building_baseline" &&
    acwr.trainingDaysLogged !== null &&
    acwr.trainingDaysLogged !== undefined
      ? {
          trainingDaysLogged: acwr.trainingDaysLogged,
          progressPercent: Math.min((acwr.trainingDaysLogged / 21) * 100, 100),
        }
      : undefined;

  return {
    trainingAllowed: true,
    banners,
    blocksDisplayed,
    primaryCta: !readiness.hasData
      ? {
          label: "2-min Check-in",
          action: "open_checkin",
        }
      : undefined,
    secondaryCta: !readiness.hasData
      ? {
          label: "Start Training Anyway",
          action: "start_training",
        }
      : undefined,
    merlinPosture: "explanatory",
    acwrBaseline,
  };
}
