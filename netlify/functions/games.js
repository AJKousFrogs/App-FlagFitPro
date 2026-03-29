import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import crypto from "node:crypto";
import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { validate, validateRequestBody, VALIDATION_RULES } from "./validation.js";
import { parseJsonObjectBody, sanitizeObject } from "./utils/input-validator.js";
import { createSuccessResponse, createErrorResponse, handleValidationError, handleNotFoundError, handleAuthorizationError } from "./utils/error-handler.js";
import { checkTeamMembership as _checkTeamMembership, getUserTeamId } from "./utils/auth-helper.js";
import { baseHandler } from "./utils/base-handler.js";
import { getRateLimitType } from "./utils/rate-limiter.js";
import { hasAnyRole, TEAM_OPERATIONS_ROLES } from "./utils/role-sets.js";

// Netlify Function: Games API
// Handles game creation, retrieval, and statistics
// Supports team games (coach/admin) and personal games (player domestic leagues)

// Helper to get user role from team_members (authoritative source)
async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !Array.isArray(data) || !data[0]) {
    return "player";
  }
  return data[0].role || "player";
}

// Check if user is coach/admin
function isCoachOrAdmin(role) {
  return hasAnyRole(role, TEAM_OPERATIONS_ROLES);
}

function getPersonalGameTeamId(userId) {
  return `TEAM_${userId}`;
}

function isPersonalGameRecord(game, userId) {
  return game?.team_id === getPersonalGameTeamId(userId);
}

function deriveGameResult(teamScore, opponentScore) {
  if (!Number.isFinite(teamScore) || !Number.isFinite(opponentScore)) {
    return "scheduled";
  }
  if (teamScore > opponentScore) {
    return "win";
  }
  if (teamScore < opponentScore) {
    return "loss";
  }
  return "draw";
}

function normalizeGameRecord(game, userId, fallbackOwnerType = "player") {
  const visibilityScope =
    game?.visibility_scope ||
    (isPersonalGameRecord(game, userId) ? "personal" : "team");
  const playerOwnerId =
    game?.player_owner_id ||
    (visibilityScope === "personal" && isPersonalGameRecord(game, userId)
      ? userId
      : null);
  return {
    ...game,
    game_id: game.game_id || String(game.id),
    opponent_name: game.opponent_name || game.opponent_team_name,
    opponent_team_name: game.opponent_team_name || game.opponent_name,
    team_score: game.team_score ?? game.our_score,
    our_score: game.our_score ?? game.team_score,
    is_home_game:
      typeof game.is_home_game === "boolean"
        ? game.is_home_game
        : game.home_away === "home",
    home_away:
      game.home_away ||
      (typeof game.is_home_game === "boolean"
        ? game.is_home_game
          ? "home"
          : "away"
        : null),
    visibility_scope: visibilityScope,
    owner_type: visibilityScope === "personal" ? "player" : fallbackOwnerType,
    player_owner_id: playerOwnerId,
    created_by: game.created_by || userId,
    status: game.status || game.game_result || "scheduled",
  };
}

function getGameOwnerId(game, fallbackUserId) {
  if (isPersonalGameRecord(game, fallbackUserId)) {
    return fallbackUserId;
  }
  return null;
}

async function fetchGameByIdentifier(identifier) {
  const normalized = `${identifier || ""}`.trim();

  if (/^\d+$/.test(normalized)) {
    return supabaseAdmin.from("games").select("*").eq("id", Number(normalized)).single();
  }

  const byGameId = await supabaseAdmin
    .from("games")
    .select("*")
    .eq("game_id", normalized)
    .single();

  if (!byGameId.error) {
    return byGameId;
  }

  return supabaseAdmin.from("games").select("*").eq("id", normalized).single();
}

function canAccessLegacyPersonalGame(game, userId) {
  return (
    game?.visibility_scope === "personal" ||
    isPersonalGameRecord(game, userId)
  );
}

function isGameOwner(game, userId) {
  return (
    game?.player_owner_id === userId ||
    game?.created_by === userId ||
    isPersonalGameRecord(game, userId)
  );
}

function mapGameEventType(record) {
  return record.event_type || record.play_type || record.play_category || "unknown";
}

function mapGameEventYards(record) {
  return record.yards ?? record.yards_gained ?? 0;
}

function calculateStatsFromEvents(events) {
  return {
    totalPlays: events.length,
    completions: events.filter((e) => mapGameEventType(e) === "completion").length,
    receptions: events.filter((e) => mapGameEventType(e) === "reception").length,
    drops: events.filter((e) => mapGameEventType(e) === "drop").length,
    flagPulls: events.filter((e) => mapGameEventType(e) === "flag_pull").length,
    touchdowns: events.filter((e) => mapGameEventType(e) === "touchdown").length,
    interceptions: events.filter((e) => mapGameEventType(e) === "interception").length,
    totalYards: events.reduce((sum, e) => sum + mapGameEventYards(e), 0),
  };
}

function normalizeGameEventForLegacySchema(game, userId, playData, playNumber) {
  return {
    game_id: game.game_id || String(game.id),
    team_id: game.team_id,
    play_number: playNumber,
    timestamp: new Date().toISOString(),
    quarter: playData.quarter || playData.half || null,
    play_type: playData.eventType || playData.playType || null,
    play_category: playData.eventCategory || null,
    primary_player_id: playData.playerId || userId,
    yards_gained: playData.yards || playData.yardsGained || 0,
    play_notes: playData.description || playData.notes || null,
    field_conditions: playData.fieldConditions || null,
    weather_conditions: playData.weather || null,
  };
}

function parseBoundedInt(value, fieldName, { min, max }) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

async function getTeamMembership(userId, teamId) {
  if (!teamId) {
    return { authorized: false, role: null };
  }
  const membership = await _checkTeamMembership(userId, teamId);
  return {
    authorized: membership?.authorized === true,
    role: membership?.role || null,
  };
}

// Check if coach has consent to view player's personal games
async function hasPlayerConsent(coachId, playerId) {
  const { data, error } = await supabaseAdmin
    .from("player_stats_consent")
    .select("id")
    .eq("coach_id", coachId)
    .eq("player_id", playerId)
    .eq("consent_granted", true)
    .is("revoked_at", null)
    .limit(1);

  if (error) {
    const code = error?.code;
    const message = `${error?.message || ""}`.toLowerCase();
    if (code === "42P01" || code === "PGRST204" || message.includes("player_stats_consent")) {
      return false;
    }
  }

  return !error && data && data.length > 0;
}

// Create a new game with validation
const createGame = async (userId, gameData) => {
  try {
    checkEnvVars();

    // SECURITY: Validate input against schema
    const validation = validate(gameData, "createGame");
    if (!validation.valid) {
      const error = new Error(
        `Validation failed: ${validation.errors.join(", ")}`,
      );
      error.isValidation = true;
      error.errors = validation.errors;
      throw error;
    }

    // Get user role to determine game type
    const userRole = await getUserRole(userId);
    const isCoach = isCoachOrAdmin(userRole);

    // Sanitize input
    const sanitizedData = sanitizeObject(gameData);

    const requestedTeamId = await getUserTeamId(userId);
    const visibilityScope =
      !isCoach || sanitizedData.visibilityScope === "personal"
        ? "personal"
        : "team";
    const teamId =
      visibilityScope === "personal"
        ? getPersonalGameTeamId(userId)
        : requestedTeamId;
    const teamScore = Number.isFinite(Number(sanitizedData.teamScore))
      ? Number(sanitizedData.teamScore)
      : 0;
    const opponentScore = Number.isFinite(Number(sanitizedData.opponentScore))
      ? Number(sanitizedData.opponentScore)
      : 0;
    const gameDate = `${sanitizedData.gameDate || ""}`.split("T")[0];
    const gameTime = sanitizedData.gameTime || null;

    const { data, error } = await supabaseAdmin
      .from("games")
      .insert({
        team_id: teamId,
        game_id: crypto.randomUUID(),
        opponent_team_name: sanitizedData.opponentName,
        game_date: gameDate,
        game_time: gameTime,
        location: sanitizedData.location || null,
        is_home_game: !!sanitizedData.isHomeGame,
        weather_conditions: sanitizedData.weather || null,
        temperature: sanitizedData.temperature || null,
        field_conditions: sanitizedData.fieldConditions || null,
        season: gameDate ? gameDate.slice(0, 4) : null,
        tournament_name: sanitizedData.tournamentName || null,
        game_type: sanitizedData.gameType || "regular_season",
        team_score: teamScore,
        opponent_score: opponentScore,
        game_result: deriveGameResult(teamScore, opponentScore),
        game_video_url: sanitizedData.gameVideoUrl || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...normalizeGameRecord(data, userId, isCoach ? "coach" : "player"),
      message:
        visibilityScope === "personal"
          ? "Personal game created - visible only to you and coaches with consent"
          : "Team game created - visible to all team members",
    };
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

// Get games for a user/team with visibility filtering
const getGames = async (userId, options = {}) => {
  try {
    checkEnvVars();

    const userRole = await getUserRole(userId);
    const isCoach = isCoachOrAdmin(userRole);

    // Get user's team
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);

    if (teamError) {
      throw teamError;
    }

    const teamId =
      teamMemberships && teamMemberships.length > 0
        ? teamMemberships[0].team_id
        : null;
    const personalTeamId = getPersonalGameTeamId(userId);

    let query = supabaseAdmin
      .from("games")
      .select("*")
      .order("game_date", { ascending: false });

    // By default, only show games up to and including today
    if (options.includeFuture !== "true" && options.includeFuture !== true) {
      const todayEndOfDay = new Date();
      todayEndOfDay.setHours(23, 59, 59, 999);
      query = query.lte("game_date", todayEndOfDay.toISOString());
    }

    if (options.limit !== undefined) {
      const limit = parseBoundedInt(options.limit, "limit", {
        min: 1,
        max: 200,
      });
      query = query.limit(limit);
    }

    if (options.season) {
      // Filter by year from game_date
      const year = parseBoundedInt(options.season, "season", {
        min: 1900,
        max: 2100,
      });
      query = query
        .gte("game_date", `${year}-01-01`)
        .lte("game_date", `${year}-12-31`);
    }

    const { data: allGames, error } = await query;

    if (error) {
      throw error;
    }

    // Apply visibility filtering
    const filteredGames = [];

    for (const game of allGames || []) {
      if (game.team_id === personalTeamId) {
        filteredGames.push(game);
      } else if (teamId && game.team_id === teamId) {
          filteredGames.push(game);
      }
    }

    // Transform to consistent format
    return filteredGames.map((game) =>
      normalizeGameRecord(game, userId, isCoach ? "coach" : "player"),
    );
  } catch (error) {
    console.error("Error getting games:", error);
    throw error;
  }
};

// Get game details with permission check
const getGameDetails = async (userId, gameId) => {
  try {
    checkEnvVars();

    const userRole = await getUserRole(userId);
    const isCoach = isCoachOrAdmin(userRole);

    const { data: game, error } = await fetchGameByIdentifier(gameId);

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      throw error;
    }

    // Check visibility permissions
    const normalizedGame = normalizeGameRecord(game, userId, isCoach ? "coach" : "player");

    if (normalizedGame.visibility_scope === "personal") {
      const isOwner = isGameOwner(game, userId);
      if (!isOwner) {
        if (isCoach && game.player_owner_id) {
          const hasConsent = await hasPlayerConsent(userId, game.player_owner_id);
          if (!hasConsent) {
            throw new Error("You don't have permission to view this game");
          }
        } else {
          throw new Error("You don't have permission to view this game");
        }
      }
    } else if (normalizedGame.visibility_scope === "team") {
      const teamAccess = await getTeamMembership(userId, game.team_id);
      if (!teamAccess.authorized) {
        throw new Error("You don't have permission to view this game");
      }
    }

    return normalizedGame;
  } catch (error) {
    console.error("Error getting game details:", error);
    throw error;
  }
};

// Trigger game day recovery protocol
async function triggerGameDayRecovery(playerId, gameDate) {
  try {
    // Import game day recovery service logic
    // Since this is backend, we'll create recovery protocol directly
    const day1 = new Date(gameDate);
    day1.setDate(day1.getDate() + 1);
    day1.setHours(0, 0, 0, 0);

    const day2 = new Date(gameDate);
    day2.setDate(day2.getDate() + 2);
    day2.setHours(0, 0, 0, 0);

    const endDate = new Date(day2);
    endDate.setHours(23, 59, 59, 999);

    // Check if recovery protocol already exists
    const { data: existing } = await supabaseAdmin
      .from("recovery_protocols")
      .select("id")
      .eq("player_id", playerId)
      .eq("protocol_type", "game_day_recovery")
      .eq("start_date", day1.toISOString().split("T")[0])
      .maybeSingle();

    if (existing) {
      return; // Already exists
    }

    // Create recovery protocol
    await supabaseAdmin.from("recovery_protocols").insert({
      player_id: playerId,
      protocol_type: "game_day_recovery",
      start_date: day1.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      max_load_percent: 50,
      restrictions: [
        "no_intense_work",
        "hydration_focus",
        "light_movement_only",
        "no_contact",
      ],
      focus: "sleep_and_recovery",
      created_at: new Date().toISOString(),
    });

    // Create recovery blocks
    await Promise.all([
      supabaseAdmin.from("recovery_blocks").insert({
        player_id: playerId,
        block_date: day1.toISOString().split("T")[0],
        max_load_percent: 30,
        focus: "sleep",
        restrictions: ["no_intense_work", "hydration_focus"],
        protocol_type: "game_day_recovery",
        created_at: new Date().toISOString(),
      }),
      supabaseAdmin.from("recovery_blocks").insert({
        player_id: playerId,
        block_date: day2.toISOString().split("T")[0],
        max_load_percent: 50,
        focus: "active_recovery",
        restrictions: ["light_movement_only", "no_contact"],
        protocol_type: "game_day_recovery",
        created_at: new Date().toISOString(),
      }),
    ]);

    console.log(
      `[GameDayRecovery] Created 48h recovery protocol for player ${playerId}`,
    );
  } catch (error) {
    console.error("[GameDayRecovery] Error creating recovery protocol:", error);
  }
}

// Update game with authorization check
const updateGame = async (userId, gameId, updates) => {
  try {
    checkEnvVars();

    // SECURITY: Validate input against schema
    const validation = validate(updates, "updateGame");
    if (!validation.valid) {
      const error = new Error(
        `Validation failed: ${validation.errors.join(", ")}`,
      );
      error.isValidation = true;
      error.errors = validation.errors;
      throw error;
    }

    // First, get the game to verify ownership
    const { data: game, error: fetchError } = await fetchGameByIdentifier(gameId);

    if (fetchError || !game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Permission check
    const normalizedGame = normalizeGameRecord(game, userId);
    const isOwner = isGameOwner(game, userId);

    if (normalizedGame.visibility_scope === "personal" && !isOwner) {
      const userRole = await getUserRole(userId);
      if (!isCoachOrAdmin(userRole) || !game.player_owner_id) {
        throw new Error("You don't have permission to modify this game");
      }
      const hasConsent = await hasPlayerConsent(userId, game.player_owner_id);
      if (!hasConsent) {
        throw new Error("You don't have permission to modify this game");
      }
    }

    if (normalizedGame.visibility_scope === "team") {
      const teamAccess = await getTeamMembership(userId, game.team_id);
      if (!teamAccess.authorized || !isCoachOrAdmin(teamAccess.role)) {
        // Players can't modify team games directly
        throw new Error("Only coaches can modify team games");
      }
    }

    // Sanitize updates
    const sanitizedUpdates = sanitizeObject(updates);

    // Build update object
    const updateObj = {
      updated_at: new Date().toISOString(),
    };

    // Map fields
    if (sanitizedUpdates.teamScore !== undefined) {
      updateObj.team_score = sanitizedUpdates.teamScore;
    }
    if (sanitizedUpdates.opponentScore !== undefined) {
      updateObj.opponent_score = sanitizedUpdates.opponentScore;
    }
    if (sanitizedUpdates.location !== undefined) {
      updateObj.location = sanitizedUpdates.location;
    }
    if (
      sanitizedUpdates.weather !== undefined ||
      sanitizedUpdates.temperature !== undefined
    ) {
      updateObj.weather_conditions =
        sanitizedUpdates.weather || game.weather_conditions || null;
      updateObj.temperature =
        sanitizedUpdates.temperature ?? game.temperature ?? null;
    }
    if (sanitizedUpdates.fieldConditions !== undefined) {
      updateObj.field_conditions = sanitizedUpdates.fieldConditions;
    }
    if (
      updateObj.team_score !== undefined ||
      updateObj.opponent_score !== undefined
    ) {
      updateObj.game_result = deriveGameResult(
        updateObj.team_score ?? game.team_score,
        updateObj.opponent_score ?? game.opponent_score,
      );
    }

    const { data: updatedGame, error: updateError } = await supabaseAdmin
      .from("games")
      .update(updateObj)
      .eq("id", gameId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // If game was just completed (status changed to completed or scores were added), trigger recovery
    const wasCompleted =
      (updateObj.game_result &&
        updateObj.game_result !== game.game_result &&
        ["win", "loss", "draw"].includes(updateObj.game_result)) ||
      ((updateObj.team_score !== undefined ||
        updateObj.opponent_score !== undefined) &&
        ["win", "loss", "draw"].includes(
          updateObj.game_result || game.game_result || "scheduled",
        ));

    if (wasCompleted && updatedGame.game_date) {
      // Get all players on the team
      const { data: teamMembers } = await supabaseAdmin
        .from("team_members")
        .select("user_id")
        .eq("team_id", updatedGame.team_id)
        .eq("role", "player");

      if (teamMembers && teamMembers.length > 0) {
        const gameDate = new Date(updatedGame.game_date);
        // Trigger recovery for each player
        for (const member of teamMembers) {
          await triggerGameDayRecovery(member.user_id, gameDate);
        }
      }
    }

    return normalizeGameRecord(updatedGame, userId);
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};

// Save a play/event with recorder tracking
const savePlay = async (userId, gameId, playData) => {
  try {
    checkEnvVars();

    // Verify game exists and user has access
    const { data: game, error: gameError } = await fetchGameByIdentifier(gameId);

    if (gameError || !game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Check permission to add stats
    let recordedByRole = "player";
    const normalizedGame = normalizeGameRecord(game, userId);

    if (normalizedGame.visibility_scope === "personal") {
      const isOwner = isGameOwner(game, userId);
      if (!isOwner) {
        const userRole = await getUserRole(userId);
        const isCoach = isCoachOrAdmin(userRole);
        if (!isCoach || !game.player_owner_id) {
          throw new Error("You don't have permission to add stats to this game");
        }
        const hasConsent = await hasPlayerConsent(userId, game.player_owner_id);
        if (!hasConsent) {
          throw new Error("You don't have permission to add stats to this game");
        }
        recordedByRole = "coach";
      }
    }

    if (normalizedGame.visibility_scope === "team") {
      const teamAccess = await getTeamMembership(userId, game.team_id);
      if (!teamAccess.authorized) {
        throw new Error("You don't have permission to add stats to this game");
      }
      recordedByRole = isCoachOrAdmin(teamAccess.role) ? "coach" : "player";
    }

    const { count: currentPlayCount } = await supabaseAdmin
      .from("game_events")
      .select("id", { count: "exact", head: true })
      .eq("game_id", normalizedGame.game_id);
    const normalizedPlay = normalizeGameEventForLegacySchema(
      normalizedGame,
      userId,
      playData,
      (currentPlayCount || 0) + 1,
    );

    // Retry-safe dedupe: if an identical event was recorded very recently,
    // return the existing row instead of creating a duplicate.
    const duplicateWindowStart = new Date(Date.now() - 30 * 1000).toISOString();
    let duplicateQuery = supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", normalizedPlay.game_id)
      .eq("primary_player_id", normalizedPlay.primary_player_id)
      .eq("play_type", normalizedPlay.play_type)
      .eq("quarter", normalizedPlay.quarter)
      .eq("yards_gained", normalizedPlay.yards_gained)
      .gte("created_at", duplicateWindowStart)
      .order("created_at", { ascending: false })
      .limit(1);

    duplicateQuery =
      normalizedPlay.play_notes === null
        ? duplicateQuery.is("play_notes", null)
        : duplicateQuery.eq("play_notes", normalizedPlay.play_notes);
    duplicateQuery =
      normalizedPlay.timestamp === null
        ? duplicateQuery.is("timestamp", null)
        : duplicateQuery;

    const { data: duplicateEvent, error: duplicateError } =
      await duplicateQuery.maybeSingle();

    if (!duplicateError && duplicateEvent) {
      return duplicateEvent;
    }

    const { data, error } = await supabaseAdmin
      .from("game_events")
      .insert(normalizedPlay)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      recorded_by_role: recordedByRole,
    };
  } catch (error) {
    console.error("Error saving play:", error);
    throw error;
  }
};

// Get game statistics
const getGameStats = async (userId, gameId) => {
  try {
    checkEnvVars();

    // Verify access
    await getGameDetails(userId, gameId);

    // Get all events for the game
    const { data: events, error } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Calculate statistics
    return calculateStatsFromEvents(events || []);
  } catch (error) {
    console.error("Error getting game stats:", error);
    throw error;
  }
};

// Get aggregated player stats across all games (for player profile)
const getPlayerAggregatedStats = async (
  requestingUserId,
  playerId,
  options = {},
) => {
  try {
    checkEnvVars();

    const requestingUserRole = await getUserRole(requestingUserId);
    const isCoach = isCoachOrAdmin(requestingUserRole);
    const isSelf = requestingUserId === playerId;

    // If not self, check consent (for coaches)
    if (!isSelf && isCoach) {
      const hasConsent = await hasPlayerConsent(requestingUserId, playerId);
      if (!hasConsent) {
        throw new Error("You don't have consent to view this player's stats");
      }
    } else if (!isSelf && !isCoach) {
      throw new Error("You don't have permission to view this player's stats");
    }

    // Get all game events for the player
    let query = supabaseAdmin
      .from("game_events")
      .select(
        `
        *,
        games!inner(id, game_id, game_date, opponent_team_name, team_id)
      `,
      )
      .eq("primary_player_id", playerId);

    // Filter by year if specified
    if (options.year) {
      const year = parseInt(options.year);
      if (!isNaN(year)) {
        query = query
          .gte("games.game_date", `${year}-01-01`)
          .lte("games.game_date", `${year}-12-31`);
      }
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    // Filter events based on visibility (if viewing as coach)
    let filteredEvents = events || [];
    if (!isSelf && isCoach) {
      filteredEvents = events || [];
    }

    // Calculate aggregated statistics
    const stats = {
      totalGames: new Set(filteredEvents.map((e) => e.game_id)).size,
      totalEvents: filteredEvents.length,
      completions: filteredEvents.filter((e) => mapGameEventType(e) === "completion")
        .length,
      receptions: filteredEvents.filter((e) => mapGameEventType(e) === "reception")
        .length,
      drops: filteredEvents.filter((e) => mapGameEventType(e) === "drop").length,
      flagPulls: filteredEvents.filter((e) => mapGameEventType(e) === "flag_pull")
        .length,
      touchdowns: filteredEvents.filter((e) => mapGameEventType(e) === "touchdown")
        .length,
      interceptions: filteredEvents.filter(
        (e) => mapGameEventType(e) === "interception",
      ).length,
      totalYards: filteredEvents.reduce((sum, e) => sum + mapGameEventYards(e), 0),
      // Breakdown by game type
      teamGameStats: calculateEventStats(
        filteredEvents.filter(
          (e) => e.games.team_id !== getPersonalGameTeamId(playerId),
        ),
      ),
      personalGameStats: calculateEventStats(
        filteredEvents.filter(
          (e) => e.games.team_id === getPersonalGameTeamId(playerId),
        ),
      ),
    };

    return stats;
  } catch (error) {
    console.error("Error getting player aggregated stats:", error);
    throw error;
  }
};

// Helper to calculate stats from events
function calculateEventStats(events) {
  return {
    games: new Set(events.map((e) => e.game_id)).size,
    completions: events.filter((e) => mapGameEventType(e) === "completion").length,
    receptions: events.filter((e) => mapGameEventType(e) === "reception").length,
    drops: events.filter((e) => mapGameEventType(e) === "drop").length,
    flagPulls: events.filter((e) => mapGameEventType(e) === "flag_pull").length,
    touchdowns: events.filter((e) => mapGameEventType(e) === "touchdown").length,
    yards: events.reduce((sum, e) => sum + mapGameEventYards(e), 0),
  };
}

// Manage player stats consent
const manageConsent = async (playerId, coachId, action, options = {}) => {
  try {
    checkEnvVars();

    if (action === "grant") {
      const { data, error } = await supabaseAdmin
        .from("player_stats_consent")
        .upsert(
          {
            player_id: playerId,
            coach_id: coachId,
            consent_granted: true,
            consent_type: options.consentType || "full",
            can_view_personal_games: options.canViewPersonalGames !== false,
            can_view_domestic_league: options.canViewDomesticLeague !== false,
            can_view_detailed_stats: options.canViewDetailedStats !== false,
            can_view_historical: options.canViewHistorical !== false,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "player_id,coach_id",
          },
        )
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { success: true, message: "Consent granted", data };
    } else if (action === "revoke") {
      const { data, error } = await supabaseAdmin
        .from("player_stats_consent")
        .update({
          consent_granted: false,
          revoked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("player_id", playerId)
        .eq("coach_id", coachId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return { success: true, message: "Consent revoked", data };
    } else if (action === "list") {
      // List all consents for a player
      const { data, error } = await supabaseAdmin
        .from("player_stats_consent")
        .select(
          `
          *,
          coach:coach_id(id, full_name, email)
        `,
        )
        .eq("player_id", playerId);

      if (error) {
        throw error;
      }
      return data || [];
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error managing consent:", error);
    throw error;
  }
};

// Main handler
const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "games",
    allowedMethods: ["GET", "POST", "PUT", "DELETE"],
    rateLimitType: getRateLimitType(event.httpMethod, event.path),
    requireAuth: true, // P0-003: Explicitly require authentication for game data
    handler: async (event, _context, { userId }) => {
      // Safe path parsing
      const pathMatch = event.path.match(
        /^\/\.netlify\/functions\/games\/?(.*)$/,
      );
      const path = pathMatch ? pathMatch[1] : "";

      // Parse request body
      let body = {};
      if (event.body && ["POST", "PUT", "DELETE"].includes(event.httpMethod)) {
        try {
          body = parseJsonObjectBody(event.body);
        } catch (error) {
          if (error?.message === "Request body must be an object") {
            return createErrorResponse(
              "Request body must be an object",
              422,
              "validation_error",
            );
          }
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
          );
        }
      }

      const queryParams = event.queryStringParameters || {};
      let result;

      try {
        // Route: POST / - Create game
        if (event.httpMethod === "POST" && (path === "" || path === "/")) {
          result = await createGame(userId, body);
        }
        // Route: GET / - Get games list
        else if (event.httpMethod === "GET" && (path === "" || path === "/")) {
          result = await getGames(userId, queryParams);
        }
        // Route: GET /:gameId - Get game details
        else if (event.httpMethod === "GET" && path.match(/^[a-f0-9-]+$/i)) {
          result = await getGameDetails(userId, path);
        }
        // Route: PUT /:gameId - Update game
        else if (event.httpMethod === "PUT" && path.match(/^[a-f0-9-]+$/i)) {
          result = await updateGame(userId, path, body);
        }
        // Route: GET /:gameId/stats - Get game stats
        else if (
          event.httpMethod === "GET" &&
          path.match(/^([a-f0-9-]+)\/stats$/i)
        ) {
          const gameId = path.match(/^([a-f0-9-]+)\/stats$/i)[1];
          result = await getGameStats(userId, gameId);
        }
        // Route: POST /:gameId/events - Save event/play
        else if (
          event.httpMethod === "POST" &&
          path.match(/^([a-f0-9-]+)\/events$/i)
        ) {
          const gameId = path.match(/^([a-f0-9-]+)\/events$/i)[1];
          result = await savePlay(userId, gameId, body);
        }
        // Route: GET /player/:playerId/stats - Get player aggregated stats
        else if (
          event.httpMethod === "GET" &&
          path.match(/^player\/([a-f0-9-]+)\/stats$/i)
        ) {
          const playerId = path.match(/^player\/([a-f0-9-]+)\/stats$/i)[1];
          result = await getPlayerAggregatedStats(
            userId,
            playerId,
            queryParams,
          );
        }
        // Route: POST /consent - Manage consent
        else if (event.httpMethod === "POST" && path === "consent") {
          const { coachId, action, ...options } = body;
          result = await manageConsent(userId, coachId, action, options);
        }
        // Route: GET /consent - List player's consents
        else if (event.httpMethod === "GET" && path === "consent") {
          result = await manageConsent(userId, null, "list");
        } else {
          return createErrorResponse("Endpoint not found", 404, "not_found");
        }

        return createSuccessResponse(result);
      } catch (error) {
        // SECURITY: Handle validation errors with proper 422 status
        if (error.isValidation) {
          return handleValidationError(error.errors || error.message);
        }
        if (
          error.message &&
          (error.message.includes("must be") ||
            error.message.includes("Invalid"))
        ) {
          return handleValidationError(error.message);
        }

        if (error.message && error.message.includes("not found")) {
          return handleNotFoundError(error.message);
        }

        if (
          error.message &&
          (error.message.includes("permission") ||
            error.message.includes("consent") ||
            error.message.includes("Only coaches"))
        ) {
          return handleAuthorizationError(error.message);
        }

        throw error;
      }
    },
  });
};

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
