import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./supabase-client.js";
import { canCoachViewWellness, filterWellnessDataForCoach } from "./utils/consent-guard.js";
import { detectPainTrigger } from "./utils/safety-override.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { hasAnyRole, HEALTH_DATA_ACCESS_ROLES } from "./utils/role-sets.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.wellness-checkin" });

function isOptionalSchemaError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

function splitDisplayName(value) {
  const normalized = `${value || ""}`.trim();
  if (!normalized) {
    return { firstName: "User", lastName: "Account" };
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Account" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

async function ensurePublicUserProfile(supabase, userId, log = logger) {
  if (!userId) {
    return;
  }

  const existingProfile = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile.data || !existingProfile.error || existingProfile.error.code === "PGRST116") {
    if (existingProfile.data) {
      return;
    }
  } else {
    log.warn("wellness_public_user_profile_lookup_failed", {
      user_id: userId,
    }, existingProfile.error);
    return;
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.admin.getUserById(userId);

    if (authError || !user) {
      log.warn("wellness_auth_user_lookup_failed_for_profile_sync", {
        user_id: userId,
        has_user: Boolean(user),
      }, authError || new Error("missing auth user"));
      return;
    }

    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "User";
    const { firstName, lastName } = splitDisplayName(fullName);
    const profilePayload = {
      id: user.id,
      email: user.email,
      password_hash: null,
      first_name: firstName,
      last_name: lastName,
      position: user.user_metadata?.position || null,
      full_name: fullName,
      name: fullName,
      email_verified: user.email_confirmed_at !== null,
      onboarding_completed: false,
      is_active: true,
      last_login: user.last_sign_in_at || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      profile_photo_url: user.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("users").upsert(profilePayload, { onConflict: "id" });
  } catch (error) {
    log.warn("wellness_public_user_profile_backfill_failed", {
      user_id: userId,
    }, error);
  }
}

function mapLegacyWellnessRecord(data) {
  if (!data) {
    return null;
  }

  return {
    sleepQuality: data.sleep_quality,
    sleepHours: data.sleep_hours ?? null,
    energyLevel: data.energy_level,
    muscleSoreness: data.muscle_soreness,
    stressLevel: data.stress_level,
    sorenessAreas: data.soreness_areas || [],
    notes: data.notes,
    readinessScore: data.calculated_readiness ?? null,
    motivationLevel: data.motivation_level ?? data.motivation ?? null,
    mood: data.mood ?? null,
    hydrationLevel: data.hydration_level ?? null,
  };
}

async function fetchWellnessCheckinRecord(supabase, athleteId, date) {
  const primary = await supabase
    .from("daily_wellness_checkin")
    .select("*")
    .eq("user_id", athleteId)
    .eq("checkin_date", date)
    .single();

  if (!primary.error || primary.error.code === "PGRST116") {
    return primary;
  }

  if (!isOptionalSchemaError(primary.error)) {
    return primary;
  }

  return supabase
    .from("wellness_logs")
    .select("*")
    .or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`)
    .eq("log_date", date)
    .maybeSingle();
}

async function savePrimaryWellnessCheckin(supabase, userId, targetDate, payload) {
  const primaryPayload = {
    user_id: userId,
    checkin_date: targetDate,
    sleep_quality: payload.sleepQuality,
    sleep_hours: payload.sleepHours,
    energy_level: payload.energyLevel,
    muscle_soreness: payload.muscleSoreness,
    stress_level: payload.stressLevel,
    soreness_areas: payload.sorenessAreas || [],
    notes: payload.notes,
    calculated_readiness: payload.calculatedReadiness,
    motivation_level: payload.motivationLevel,
    mood: payload.mood,
    hydration_level: payload.hydrationLevel,
  };

  const primaryResult = await supabase
    .from("daily_wellness_checkin")
    .upsert(primaryPayload, {
      onConflict: "user_id,checkin_date",
    })
    .select()
    .single();

  if (!primaryResult.error) {
    return primaryResult;
  }

  if (!isOptionalSchemaError(primaryResult.error)) {
    return primaryResult;
  }

  const legacyPayload = {
    athlete_id: userId,
    user_id: userId,
    log_date: targetDate,
    date: targetDate,
    sleep_quality: payload.sleepQuality,
    sleep_hours: payload.sleepHours,
    energy_level: payload.energyLevel,
    muscle_soreness: payload.muscleSoreness,
    stress_level: payload.stressLevel,
    soreness_areas: payload.sorenessAreas || [],
    notes: payload.notes,
    calculated_readiness: payload.calculatedReadiness,
    motivation_level: payload.motivationLevel,
    motivation: payload.motivationLevel,
    mood: payload.mood,
    hydration_level: payload.hydrationLevel,
    updated_at: new Date().toISOString(),
  };

  return supabase
    .from("wellness_logs")
    .upsert(legacyPayload, {
      onConflict: "athlete_id,log_date",
    })
    .select()
    .single();
}

async function saveWellnessCheckinTransactional(supabase, userId, targetDate, payload) {
  const { error: rpcError } = await supabase.rpc("upsert_wellness_checkin", {
    p_user_id: userId,
    p_checkin_date: targetDate,
    p_sleep_quality: payload.sleepQuality ?? null,
    p_sleep_hours: payload.sleepHours ?? null,
    p_energy_level: payload.energyLevel ?? null,
    p_muscle_soreness: payload.muscleSoreness ?? null,
    p_stress_level: payload.stressLevel ?? null,
    p_soreness_areas: payload.sorenessAreas || [],
    p_notes: payload.notes ?? null,
    p_calculated_readiness: payload.calculatedReadiness ?? null,
    p_motivation_level: payload.motivationLevel ?? null,
    p_mood: payload.mood ?? null,
    p_hydration_level: payload.hydrationLevel ?? null,
  });

  if (rpcError) {
    if (rpcError.code !== "PGRST202") {
      return { data: null, error: rpcError, usedRpc: false };
    }

    const fallbackResult = await savePrimaryWellnessCheckin(
      supabase,
      userId,
      targetDate,
      payload,
    );

    return {
      data: fallbackResult.data,
      error: fallbackResult.error,
      usedRpc: false,
    };
  }

  const persisted = await fetchWellnessCheckinRecord(supabase, userId, targetDate);
  return {
    data: persisted.data,
    error: persisted.error,
    usedRpc: true,
  };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "wellness-checkin",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId, correlationId }) => {
      const requestLogger = logger.child(
        buildRequestLogContext(evt, {
          user_id: userId,
          request_id: requestId,
          correlation_id: correlationId,
          trace_id: correlationId,
        }),
      );
      try {
        if (evt.httpMethod === "GET") {
          const params = evt.queryStringParameters || {};
          const date = params.date || new Date().toISOString().split("T")[0];
          const athleteId = params.athleteId || userId;
          return getCheckin(supabaseAdmin, userId, athleteId, date, requestId);
        }

        const parsedPayload = tryParseJsonObjectBody(evt.body);
        if (!parsedPayload.ok) {
          return parsedPayload.error;
        }
        const payload = parsedPayload.data;
        return saveCheckin(supabaseAdmin, userId, payload, requestId, requestLogger);
      } catch (error) {
        requestLogger.error("wellness_checkin_request_failed", error, {
          http_method: evt.httpMethod,
        });
        return createErrorResponse(
          "Failed to process wellness check-in request",
          500,
          "server_error",
          requestId,
        );
      }
    },
  });

async function getCheckin(supabase, userId, requestedAthleteId, date, requestId) {
  const targetAthleteId = requestedAthleteId || userId;
  const role = await getUserRole(userId);
  const isCoach = hasAnyRole(role, HEALTH_DATA_ACCESS_ROLES);
  if (targetAthleteId !== userId && !isCoach) {
    return createErrorResponse(
      "Not authorized to view another athlete's wellness data",
      403,
      "authorization_error",
    );
  }

  const { data, error } = await fetchWellnessCheckinRecord(
    supabase,
    targetAthleteId,
    date,
  );

  if (error && error.code !== "PGRST116") {
    return createErrorResponse(
      "Failed to retrieve wellness check-in",
      500,
      "database_error",
      requestId,
    );
  }

  if (!data) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: null }),
    };
  }

  // Check consent if coach requesting another athlete's data
  let responseData = mapLegacyWellnessRecord(data);

  if (isCoach && targetAthleteId !== userId) {
    const consentCheck = await canCoachViewWellness(userId, targetAthleteId);
    if (!consentCheck.allowed) {
      // Return compliance-only data
      responseData = {
        check_in_completed: true,
        check_in_date: data.checkin_date,
        // All wellness answers hidden
      };
    } else {
      // Filter based on consent level
      responseData = filterWellnessDataForCoach(
        responseData,
        consentCheck.reason === "CONSENT_GRANTED",
        consentCheck.safetyOverride,
      );
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: responseData,
    }),
  };
}

async function saveCheckin(supabase, userId, payload, requestId, log = logger) {
  const {
    date,
    sleepQuality,
    sleepHours,
    energyLevel,
    muscleSoreness,
    stressLevel,
    sorenessAreas,
    notes,
    readinessScore,
    // Additional wellness fields (previously missing from daily_wellness_checkin)
    motivationLevel,
    mood,
    hydrationLevel,
  } = payload;

  const targetDate = date || new Date().toISOString().split("T")[0];

  await ensurePublicUserProfile(supabase, userId, log);

  // Safety override: Check for pain triggers (muscleSoreness >3/10)
  if (
    muscleSoreness !== undefined &&
    muscleSoreness !== null &&
    muscleSoreness > 3
  ) {
    await detectPainTrigger(
      userId,
      muscleSoreness,
      sorenessAreas?.join(", ") || "general",
      null,
    );
  }

  // Calculate readiness if not provided
  const calculatedReadiness = readinessScore || calculateReadiness(payload);

  // Check for low wellness and create next-day recovery focus
  if (calculatedReadiness < 40) {
    // Schedule recovery focus for tomorrow (will be checked/created tomorrow)
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Check if recovery block already scheduled
      const { data: existing } = await supabase
        .from("recovery_blocks")
        .select("id")
        .eq("player_id", userId)
        .eq("block_date", tomorrowStr)
        .eq("protocol_type", "wellness_recovery")
        .maybeSingle();

      if (!existing) {
        // Create recovery block for tomorrow
        await supabase.from("recovery_blocks").insert({
          player_id: userId,
          block_date: tomorrowStr,
          max_load_percent: 50,
          focus: "recovery",
          restrictions: [
            "light_movement_only",
            "sleep_focus",
            "hydration_focus",
            "no_intense_work",
          ],
          protocol_type: "wellness_recovery",
          created_at: new Date().toISOString(),
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          notification_type: "wellness",
          message: `Your wellness is low today (${calculatedReadiness}%). Tomorrow's training will focus on recovery - prioritize sleep, hydration, and light movement.`,
          priority: "normal",
        });
      }
    } catch (recoveryError) {
      log.warn("wellness_recovery_focus_creation_failed", {
        user_id: userId,
        target_date: targetDate,
        calculated_readiness: calculatedReadiness,
      }, recoveryError);
      // Non-fatal - continue with check-in
    }
  }

  // Check for low wellness and log ownership transition
  if (calculatedReadiness < 40) {
    try {
      // Get player's team and coach
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "player")
        .single();

      if (teamMember) {
        const { data: coaches } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamMember.team_id)
          .eq("role", "coach")
          .limit(1);

        if (coaches && coaches.length > 0) {
          // Log ownership transition
          await supabase.from("ownership_transitions").insert({
            trigger: "wellness_low",
            from_role: "player",
            to_role: "coach",
            player_id: userId,
            action_required: "Review player status - wellness below 40%",
            status: "pending",
            created_at: new Date().toISOString(),
          });

          // Notify coach
          await supabase.from("notifications").insert({
            user_id: coaches[0].user_id,
            notification_type: "wellness",
            message: `Player wellness check-in below 40% (${calculatedReadiness}%) - review recommended`,
            priority: "high",
            metadata: { playerId: userId, readinessScore: calculatedReadiness },
          });
        }
      }
    } catch (transitionError) {
      log.warn("wellness_ownership_transition_logging_failed", {
        user_id: userId,
        target_date: targetDate,
        calculated_readiness: calculatedReadiness,
      }, transitionError);
      // Non-fatal - continue with check-in
    }
  }

  // Upsert the checkin to daily_wellness_checkin (primary table)
  const { data, error, usedRpc } = await saveWellnessCheckinTransactional(
    supabase,
    userId,
    targetDate,
    {
      sleepQuality,
      sleepHours,
      energyLevel,
      muscleSoreness,
      stressLevel,
      sorenessAreas,
      notes,
      calculatedReadiness,
      motivationLevel,
      mood,
      hydrationLevel,
    },
  );

  if (error) {
    return createErrorResponse(
      "Failed to save wellness check-in",
      500,
      "database_error",
      requestId,
    );
  }

  // PHASE 2: Dual-write to wellness_entries for historical continuity
  // This ensures legacy reads (exports, trends, historical data) continue to work
  // while we migrate all reads to daily_wellness_checkin in Phase 3
  if (!usedRpc) {
    try {
      await supabase.from("wellness_entries").upsert(
        {
          athlete_id: userId,
          user_id: userId,
          date: targetDate,
          sleep_quality: sleepQuality,
          energy_level: energyLevel,
          stress_level: stressLevel,
          muscle_soreness: muscleSoreness,
          motivation_level: motivationLevel,
          mood,
          hydration_level: hydrationLevel,
          notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "athlete_id,date",
        },
      );
    } catch (dualWriteError) {
      if (!isOptionalSchemaError(dualWriteError)) {
        log.warn("wellness_legacy_dual_write_failed", {
          user_id: userId,
          target_date: targetDate,
          table: "wellness_entries",
        }, dualWriteError);
      }
    }
  }

  // Update wellness streak
  try {
    await supabase.rpc("update_player_streak", {
      p_user_id: userId,
      p_streak_type: "wellness",
      p_activity_date: targetDate,
    });
  } catch (streakError) {
    log.warn("wellness_streak_update_failed", {
      user_id: userId,
      target_date: targetDate,
    }, streakError);
  }

  // Check for mental fatigue indicators
  try {
    const mentalFatigueIndicators = [];
    if (stressLevel !== undefined && stressLevel !== null && stressLevel >= 7) {
      mentalFatigueIndicators.push(`High stress (${stressLevel}/10)`);
    }
    if (energyLevel !== undefined && energyLevel !== null && energyLevel <= 3) {
      mentalFatigueIndicators.push(`Low energy (${energyLevel}/10)`);
    }
    // Check recent wellness for mood if available
    const { data: recentWellness } = await supabase
      .from("daily_wellness_checkin")
      .select("sleep_quality, energy_level, stress_level")
      .eq("user_id", userId)
      .order("checkin_date", { ascending: false })
      .limit(3);

    if (recentWellness && recentWellness.length >= 2) {
      const avgStress =
        recentWellness.reduce((sum, w) => sum + (w.stress_level || 5), 0) /
        recentWellness.length;
      const avgEnergy =
        recentWellness.reduce((sum, w) => sum + (w.energy_level || 5), 0) /
        recentWellness.length;

      if (avgStress >= 7 && avgEnergy <= 4) {
        mentalFatigueIndicators.push("Sustained high stress with low energy");
      }
    }

    // If multiple indicators or severe single indicator, flag for psychologist
    if (
      mentalFatigueIndicators.length >= 2 ||
      (stressLevel >= 8 && energyLevel <= 2)
    ) {
      // Get player's team and psychologist
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("role", "player")
        .single();

      if (teamMember) {
        // Get player name (use 'users' table - profiles doesn't exist)
        const { data: playerData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", userId)
          .single();

        const playerName = playerData?.full_name || "Player";

        // Get psychologist for team
        const { data: psychologists } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamMember.team_id)
          .eq("role", "psychologist")
          .limit(1);

        if (psychologists && psychologists.length > 0) {
          // Create shared insight for psychologist
          await supabase.from("shared_insights").insert({
            insight_type: "psychology_flag",
            from_role: "system",
            to_roles: ["psychologist", "coach"],
            player_id: userId,
            player_name: playerName,
            team_id: teamMember.team_id,
            title: "Mental Fatigue Indicators Detected",
            content: `Player showing signs of mental fatigue: ${mentalFatigueIndicators.join(", ")}. Current stress: ${stressLevel || "N/A"}/10, Energy: ${energyLevel || "N/A"}/10.`,
            metadata: {
              stress_level: stressLevel,
              energy_level: energyLevel,
              indicators: mentalFatigueIndicators,
              checkin_date: targetDate,
              system_generated: true,
            },
            priority: stressLevel >= 8 ? "high" : "medium",
            status: "active",
            created_at: new Date().toISOString(),
          });

          // Notify psychologist
          await supabase.from("notifications").insert({
            user_id: psychologists[0].user_id,
            notification_type: "wellness",
            message: `${playerName} showing mental fatigue indicators - review recommended`,
            priority: stressLevel >= 8 ? "high" : "normal",
            metadata: { playerId: userId, indicators: mentalFatigueIndicators },
          });
        }
      }
    }
  } catch (mentalFatigueError) {
    log.warn("wellness_mental_fatigue_detection_failed", {
      user_id: userId,
      target_date: targetDate,
    }, mentalFatigueError);
    // Non-fatal - continue
  }

  // Check for tournament nutrition deviation
  try {
    // Get player's team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("role", "player")
      .single();

    if (teamMember) {
      // Check if player is in active tournament (check player_tournament_availability)
      const { data: tournamentAvailability } = await supabase
        .from("player_tournament_availability")
        .select("tournament_id")
        .eq("player_id", userId)
        .eq("status", "confirmed")
        .single();

      if (tournamentAvailability) {
        // Get tournament details
        const { data: tournament } = await supabase
          .from("tournaments")
          .select("id, name, start_date, end_date")
          .eq("id", tournamentAvailability.tournament_id)
          .single();

        if (tournament) {
          const tournamentStart = new Date(tournament.start_date);
          const tournamentEnd = new Date(tournament.end_date);
          const checkinDate = new Date(targetDate);

          // Check if check-in date is within tournament dates
          if (checkinDate >= tournamentStart && checkinDate <= tournamentEnd) {
            // Get today's nutrition logs
            const { data: nutritionLogs } = await supabase
              .from("nutrition_logs")
              .select("meal_type, calories")
              .eq("user_id", userId)
              .gte("logged_at", `${targetDate}T00:00:00`)
              .lt("logged_at", `${targetDate}T23:59:59`);

            // Check for nutrition deviations
            const deviations = [];
            const loggedMeals = nutritionLogs?.length || 0;
            const expectedMeals = 4; // Default tournament expectation

            // Check meal compliance (expect at least 3 meals during tournament)
            if (loggedMeals < expectedMeals * 0.75) {
              deviations.push(
                `Missing meals: ${loggedMeals}/${expectedMeals} logged`,
              );
            }

            // Check calorie compliance (basic check - expect reasonable intake)
            const totalCalories =
              nutritionLogs?.reduce(
                (sum, log) => sum + (log.calories || 0),
                0,
              ) || 0;
            const expectedCalories = 2500; // Baseline tournament expectation
            if (totalCalories > 0 && totalCalories < expectedCalories * 0.6) {
              deviations.push(
                `Low calorie intake: ${Math.round(totalCalories)}/${expectedCalories} (${Math.round((totalCalories / expectedCalories) * 100)}% of target)`,
              );
            }

            if (deviations.length > 0) {
              // Get player name (use 'users' table - profiles doesn't exist)
              const { data: playerData } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", userId)
                .single();

              const playerName = playerData?.full_name || "Player";

              // Get nutritionist for team
              const { data: nutritionists } = await supabase
                .from("team_members")
                .select("user_id")
                .eq("team_id", teamMember.team_id)
                .eq("role", "nutritionist")
                .limit(1);

              if (nutritionists && nutritionists.length > 0) {
                // Create shared insight for nutritionist
                await supabase.from("shared_insights").insert({
                  insight_type: "nutrition_compliance",
                  from_role: "system",
                  to_roles: ["nutritionist", "coach"],
                  player_id: userId,
                  player_name: playerName,
                  team_id: teamMember.team_id,
                  title: `Tournament Nutrition Deviation - ${tournament.name}`,
                  content: `Player deviating from tournament nutrition plan: ${deviations.join("; ")}.`,
                  metadata: {
                    tournament_id: tournament.id,
                    tournament_name: tournament.name,
                    deviations,
                    logged_meals: loggedMeals,
                    expected_meals: expectedMeals,
                    total_calories: totalCalories,
                    target_calories: expectedCalories,
                    checkin_date: targetDate,
                  },
                  priority:
                    loggedMeals < expectedMeals * 0.5 ? "high" : "medium",
                  status: "active",
                  created_at: new Date().toISOString(),
                });

                // Notify nutritionist
                await supabase.from("notifications").insert({
                  user_id: nutritionists[0].user_id,
                  notification_type: "nutrition",
                  message: `${playerName} deviating from tournament nutrition plan - review recommended`,
                  priority:
                    loggedMeals < expectedMeals * 0.5 ? "high" : "normal",
                  metadata: {
                    playerId: userId,
                    tournamentId: tournament.id,
                    deviations,
                  },
                });
              }
            }
          }
        }
      }
    }
  } catch (nutritionError) {
    log.warn("wellness_tournament_nutrition_detection_failed", {
      user_id: userId,
      target_date: targetDate,
    }, nutritionError);
    // Non-fatal - continue
  }

  // Check for wellness achievements
  try {
    const { data: streak } = await supabase
      .from("player_streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .eq("streak_type", "wellness")
      .single();

    if (streak) {
      if (streak.current_streak >= 7) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: "wellness_streak_7",
          p_context: JSON.stringify({ streak: streak.current_streak }),
        });
      }
      if (streak.current_streak >= 30) {
        await supabase.rpc("award_achievement", {
          p_user_id: userId,
          p_achievement_slug: "wellness_streak_30",
          p_context: JSON.stringify({ streak: streak.current_streak }),
        });
      }
    }

    // High readiness achievement
    if (calculatedReadiness >= 90) {
      await supabase.rpc("award_achievement", {
        p_user_id: userId,
        p_achievement_slug: "high_readiness",
        p_context: JSON.stringify({ score: calculatedReadiness }),
      });
    }
  } catch (achievementError) {
    log.warn("wellness_achievement_check_failed", {
      user_id: userId,
      target_date: targetDate,
    }, achievementError);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      data: {
        sleepQuality: data.sleep_quality,
        sleepHours: data.sleep_hours,
        energyLevel: data.energy_level,
        muscleSoreness: data.muscle_soreness,
        stressLevel: data.stress_level,
        sorenessAreas: data.soreness_areas || [],
        notes: data.notes,
        readinessScore: data.calculated_readiness,
        // Additional wellness fields
        motivationLevel: data.motivation_level,
        mood: data.mood,
        hydrationLevel: data.hydration_level,
      },
    }),
  };
}

/**
 * Calculate readiness score from wellness data
 *
 * IMPORTANT: Returns null if required data is missing.
 * DO NOT use default values - readiness must be calculated from real user input.
 *
 * Required: sleepQuality AND energyLevel (minimum for valid calculation)
 *
 * Evidence-based weights (team-sport optimized):
 * - Sleep Quality: 30% (strong evidence - Halson 2014, Fullagar et al. 2015)
 * - Energy Level: 25% (correlates with perceived performance)
 * - Stress Level: 25% (inverted - lower stress = better readiness)
 * - Muscle Soreness: 20% (inverted - lower soreness = better readiness)
 *
 * Scale: Input values are on 1-5 scale (from quick check-in) or 0-10 scale (full check-in)
 */
function calculateReadiness(data) {
  const { sleepQuality, energyLevel, muscleSoreness, stressLevel } = data;

  // CRITICAL: Require at least sleep quality AND energy level
  // DO NOT use defaults - user must provide real data
  if (
    sleepQuality === null ||
    sleepQuality === undefined ||
    energyLevel === null ||
    energyLevel === undefined
  ) {
    return null;
  }

  // Detect scale (1-5 quick check-in vs 0-10 full check-in)
  // If max value is <= 5, assume 1-5 scale
  const maxValue = Math.max(
    sleepQuality || 0,
    energyLevel || 0,
    muscleSoreness || 0,
    stressLevel || 0,
  );
  const scale = maxValue <= 5 ? 5 : 10;

  // Normalize all values to 0-100
  const sleepScore = (sleepQuality / scale) * 100;
  const energyScore = (energyLevel / scale) * 100;

  const hasStress = stressLevel !== null && stressLevel !== undefined;
  const hasSoreness = muscleSoreness !== null && muscleSoreness !== undefined;

  let score;

  if (hasStress && hasSoreness) {
    // Full calculation with all 4 metrics
    // Invert stress and soreness (lower = better)
    const stressScore = ((scale - stressLevel) / scale) * 100;
    const sorenessScore = ((scale - muscleSoreness) / scale) * 100;
    score =
      sleepScore * 0.3 +
      energyScore * 0.25 +
      stressScore * 0.25 +
      sorenessScore * 0.2;
  } else if (hasStress) {
    // Sleep, energy, stress (redistribute soreness weight)
    const stressScore = ((scale - stressLevel) / scale) * 100;
    score = sleepScore * 0.375 + energyScore * 0.3125 + stressScore * 0.3125;
  } else if (hasSoreness) {
    // Sleep, energy, soreness (redistribute stress weight)
    const sorenessScore = ((scale - muscleSoreness) / scale) * 100;
    score = sleepScore * 0.4 + energyScore * 0.333 + sorenessScore * 0.267;
  } else {
    // Minimal: sleep and energy only
    score = sleepScore * 0.55 + energyScore * 0.45;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
