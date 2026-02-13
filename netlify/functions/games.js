import { checkEnvVars, supabaseAdmin } from "./supabase-client.js";
import { validate, validateRequestBody, VALIDATION_RULES } from "./validation.js";
import { sanitizeObject } from "./utils/input-validator.js";
import { createSuccessResponse, createErrorResponse, handleValidationError, handleNotFoundError, handleAuthorizationError } from "./utils/error-handler.js";
import { checkTeamMembership as _checkTeamMembership, getUserTeamId } from "./utils/auth-helper.js";
import { baseHandler } from "./utils/base-handler.js";
import { getRateLimitType } from "./utils/rate-limiter.js";

// Netlify Function: Games API
// Handles game creation, retrieval, and statistics
// Supports team games (coach/admin) and personal games (player domestic leagues)

// Helper to get user role from team_members (authoritative source)
async function getUserRole(userId) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return "player";
  }
  return data.role || "player";
}

// Check if user is coach/admin
function isCoachOrAdmin(role) {
  return [
    "coach",
    "head_coach",
    "assistant_coach",
    "manager",
    "admin",
  ].includes(role);
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

    // Get user's team ID
    const teamId = await getUserTeamId(userId);

    // Determine visibility and owner type based on user role and request
    let visibilityScope = "team";
    let ownerType = "coach";
    let playerOwnerId = null;

    if (!isCoach) {
      // Players creating games = personal/domestic league games
      visibilityScope = sanitizedData.visibilityScope || "personal";
      ownerType = "player";
      playerOwnerId = userId;
    } else if (sanitizedData.visibilityScope === "personal") {
      // Coach can also create personal games for specific players
      visibilityScope = "personal";
      ownerType = "coach";
      playerOwnerId = sanitizedData.playerOwnerId || null;
    }

    const { data, error } = await supabaseAdmin
      .from("games")
      .insert({
        team_id: teamId,
        opponent_name: sanitizedData.opponentName,
        game_date: sanitizedData.gameDate,
        location: sanitizedData.location || null,
        home_away: sanitizedData.isHomeGame ? "home" : "away",
        weather_conditions: sanitizedData.weather
          ? {
              condition: sanitizedData.weather,
              temperature: sanitizedData.temperature,
            }
          : null,
        game_type: sanitizedData.gameType || "regular_season",
        our_score: sanitizedData.teamScore || 0,
        opponent_score: sanitizedData.opponentScore || 0,
        status: "scheduled",
        notes: sanitizedData.notes || null,
        created_by: userId,
        visibility_scope: visibilityScope,
        owner_type: ownerType,
        player_owner_id: playerOwnerId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      game_id: data.id,
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
      // Team games - visible to team members
      if (game.visibility_scope === "team") {
        if (teamId && game.team_id === teamId) {
          filteredGames.push(game);
        }
      }
      // Personal games
      else if (game.visibility_scope === "personal") {
        // Owner can always see their own games
        if (game.player_owner_id === userId || game.created_by === userId) {
          filteredGames.push(game);
        }
        // Coaches can see if they have consent
        else if (isCoach && game.player_owner_id) {
          const hasConsent = await hasPlayerConsent(
            userId,
            game.player_owner_id,
          );
          if (hasConsent) {
            filteredGames.push(game);
          }
        }
      }
    }

    // Transform to consistent format
    return filteredGames.map((game) => ({
      ...game,
      game_id: game.id,
      opponent_team_name: game.opponent_name,
      team_score: game.our_score,
      is_home_game: game.home_away === "home",
    }));
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

    const { data: game, error } = await supabaseAdmin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      throw error;
    }

    // Check visibility permissions
    if (game.visibility_scope === "personal") {
      const isOwner =
        game.player_owner_id === userId || game.created_by === userId;

      if (!isOwner) {
        if (isCoach && game.player_owner_id) {
          const hasConsent = await hasPlayerConsent(
            userId,
            game.player_owner_id,
          );
          if (!hasConsent) {
            throw new Error("You don't have permission to view this game");
          }
        } else {
          throw new Error("You don't have permission to view this game");
        }
      }
    } else if (game.visibility_scope === "team") {
      const teamAccess = await getTeamMembership(userId, game.team_id);
      if (!teamAccess.authorized) {
        throw new Error("You don't have permission to view this game");
      }
    }

    return {
      ...game,
      game_id: game.id,
      opponent_team_name: game.opponent_name,
      team_score: game.our_score,
      is_home_game: game.home_away === "home",
    };
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
    const { data: game, error: fetchError } = await supabaseAdmin
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();

    if (fetchError || !game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Permission check
    const isOwner =
      game.player_owner_id === userId || game.created_by === userId;

    if (game.visibility_scope === "personal" && !isOwner) {
      const userRole = await getUserRole(userId);
      if (!isCoachOrAdmin(userRole) || !game.player_owner_id) {
        throw new Error("You don't have permission to modify this game");
      }
      const hasConsent = await hasPlayerConsent(userId, game.player_owner_id);
      if (!hasConsent) {
        throw new Error("You don't have permission to modify this game");
      }
    }

    if (game.visibility_scope === "team") {
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
      updateObj.our_score = sanitizedUpdates.teamScore;
    }
    if (sanitizedUpdates.opponentScore !== undefined) {
      updateObj.opponent_score = sanitizedUpdates.opponentScore;
    }
    if (sanitizedUpdates.location !== undefined) {
      updateObj.location = sanitizedUpdates.location;
    }
    if (sanitizedUpdates.notes !== undefined) {
      updateObj.notes = sanitizedUpdates.notes;
    }
    if (sanitizedUpdates.status !== undefined) {
      updateObj.status = sanitizedUpdates.status;
    }
    if (
      sanitizedUpdates.weather !== undefined ||
      sanitizedUpdates.temperature !== undefined
    ) {
      updateObj.weather_conditions = {
        condition:
          sanitizedUpdates.weather || game.weather_conditions?.condition,
        temperature:
          sanitizedUpdates.temperature || game.weather_conditions?.temperature,
      };
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
      (updateObj.status === "completed" && game.status !== "completed") ||
      ((updateObj.our_score !== undefined ||
        updateObj.opponent_score !== undefined) &&
        (game.status === "completed" || updateObj.status === "completed"));

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

    return {
      ...updatedGame,
      game_id: updatedGame.id,
      opponent_team_name: updatedGame.opponent_name,
      team_score: updatedGame.our_score,
      is_home_game: updatedGame.home_away === "home",
    };
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
    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("id, visibility_scope, player_owner_id, created_by, team_id")
      .eq("id", gameId)
      .single();

    if (gameError || !game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Check permission to add stats
    const isOwner =
      game.player_owner_id === userId || game.created_by === userId;

    let recordedByRole = "player";

    if (game.visibility_scope === "personal" && !isOwner) {
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

    if (game.visibility_scope === "team") {
      const teamAccess = await getTeamMembership(userId, game.team_id);
      if (!teamAccess.authorized) {
        throw new Error("You don't have permission to add stats to this game");
      }
      recordedByRole = isCoachOrAdmin(teamAccess.role) ? "coach" : "player";
    }

    const normalizedPlay = {
      game_id: gameId,
      player_id: playData.playerId || userId,
      event_type: playData.eventType || playData.playType,
      quarter: playData.quarter || playData.half,
      game_time: playData.gameTime || null,
      yards: playData.yards || playData.yardsGained || 0,
      description: playData.description || playData.notes || null,
      recorded_by: userId,
      recorded_by_role: recordedByRole,
    };

    // Retry-safe dedupe: if an identical event was recorded very recently,
    // return the existing row instead of creating a duplicate.
    const duplicateWindowStart = new Date(Date.now() - 30 * 1000).toISOString();
    let duplicateQuery = supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", normalizedPlay.game_id)
      .eq("player_id", normalizedPlay.player_id)
      .eq("event_type", normalizedPlay.event_type)
      .eq("quarter", normalizedPlay.quarter)
      .eq("recorded_by", normalizedPlay.recorded_by)
      .eq("yards", normalizedPlay.yards)
      .gte("created_at", duplicateWindowStart)
      .order("created_at", { ascending: false })
      .limit(1);

    duplicateQuery =
      normalizedPlay.game_time === null
        ? duplicateQuery.is("game_time", null)
        : duplicateQuery.eq("game_time", normalizedPlay.game_time);
    duplicateQuery =
      normalizedPlay.description === null
        ? duplicateQuery.is("description", null)
        : duplicateQuery.eq("description", normalizedPlay.description);

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

    return data;
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
    const stats = {
      totalPlays: events.length,
      completions: events.filter((e) => e.event_type === "completion").length,
      receptions: events.filter((e) => e.event_type === "reception").length,
      drops: events.filter((e) => e.event_type === "drop").length,
      flagPulls: events.filter((e) => e.event_type === "flag_pull").length,
      touchdowns: events.filter((e) => e.event_type === "touchdown").length,
      interceptions: events.filter((e) => e.event_type === "interception")
        .length,
      totalYards: events.reduce((sum, e) => sum + (e.yards || 0), 0),
    };

    return stats;
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
        games!inner(id, game_date, opponent_name, visibility_scope, player_owner_id, team_id)
      `,
      )
      .eq("player_id", playerId);

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
      // Coach can see team games and personal games they have consent for
      filteredEvents = events.filter(
        (e) =>
          e.games.visibility_scope === "team" ||
          e.games.player_owner_id === playerId,
      );
    }

    // Calculate aggregated statistics
    const stats = {
      totalGames: new Set(filteredEvents.map((e) => e.game_id)).size,
      totalEvents: filteredEvents.length,
      completions: filteredEvents.filter((e) => e.event_type === "completion")
        .length,
      receptions: filteredEvents.filter((e) => e.event_type === "reception")
        .length,
      drops: filteredEvents.filter((e) => e.event_type === "drop").length,
      flagPulls: filteredEvents.filter((e) => e.event_type === "flag_pull")
        .length,
      touchdowns: filteredEvents.filter((e) => e.event_type === "touchdown")
        .length,
      interceptions: filteredEvents.filter(
        (e) => e.event_type === "interception",
      ).length,
      totalYards: filteredEvents.reduce((sum, e) => sum + (e.yards || 0), 0),
      // Breakdown by game type
      teamGameStats: calculateEventStats(
        filteredEvents.filter((e) => e.games.visibility_scope === "team"),
      ),
      personalGameStats: calculateEventStats(
        filteredEvents.filter((e) => e.games.visibility_scope === "personal"),
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
    completions: events.filter((e) => e.event_type === "completion").length,
    receptions: events.filter((e) => e.event_type === "reception").length,
    drops: events.filter((e) => e.event_type === "drop").length,
    flagPulls: events.filter((e) => e.event_type === "flag_pull").length,
    touchdowns: events.filter((e) => e.event_type === "touchdown").length,
    yards: events.reduce((sum, e) => sum + (e.yards || 0), 0),
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
export const handler = async (event, context) => {
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
          body = JSON.parse(event.body);
        } catch (_parseError) {
          return createErrorResponse(
            "Invalid JSON in request body",
            400,
            "invalid_json",
          );
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return createErrorResponse(
            "Request body must be an object",
            422,
            "validation_error",
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
