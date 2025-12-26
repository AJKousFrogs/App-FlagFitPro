// Netlify Function: Games API
// Handles game creation, retrieval, and statistics

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const { validate, sanitize } = require("./validation.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  handleNotFoundError,
  handleAuthorizationError,
  logFunctionCall,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const {
  authenticateRequest,
  checkTeamMembership,
  getUserTeamId,
} = require("./utils/auth-helper.cjs");
const {
  applyRateLimit,
  getRateLimitType,
} = require("./utils/rate-limiter.cjs");
const crypto = require("crypto");

// Secure game ID generation
function generateGameId() {
  const id = crypto.randomBytes(12).toString("base64url");
  return `GAME_${id}`;
}

// Create a new game with validation
const createGame = async (userId, gameData) => {
  try {
    checkEnvVars();

    // Validate input data
    const validation = validate(gameData, "createGame");
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    // Sanitize input
    const sanitizedData = sanitize(gameData);

    // Generate secure game ID
    const gameId = generateGameId();

    // Get user's team ID
    const teamId = await getUserTeamId(userId);

    const { data, error } = await supabaseAdmin
      .from("games")
      .insert({
        game_id: gameId,
        team_id: teamId,
        opponent_team_name: sanitizedData.opponentName,
        game_date: sanitizedData.gameDate,
        game_time: sanitizedData.gameTime || null,
        location: sanitizedData.location || null,
        is_home_game: sanitizedData.isHomeGame !== false,
        weather_conditions: sanitizedData.weather || null,
        temperature: sanitizedData.temperature
          ? parseInt(sanitizedData.temperature)
          : null,
        field_conditions: sanitizedData.fieldConditions || null,
        season: sanitizedData.season || new Date().getFullYear().toString(),
        tournament_name: sanitizedData.tournamentName || null,
        game_type: sanitizedData.gameType || "regular_season",
        team_score: sanitizedData.teamScore || 0,
        opponent_score: sanitizedData.opponentScore || 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

// Get games for a user/team
// Always filters to show games up to and including today by default
const getGames = async (userId, options = {}) => {
  try {
    checkEnvVars();

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
        : `TEAM_${userId}`;

    let query = supabaseAdmin
      .from("games")
      .select("*")
      .eq("team_id", teamId)
      .order("game_date", { ascending: false });

    // By default, only show games up to and including today
    // This ensures users always see accurate, up-to-date data
    if (options.includeFuture !== true) {
      const todayEndOfDay = new Date();
      todayEndOfDay.setHours(23, 59, 59, 999);
      query = query.lte("game_date", todayEndOfDay.toISOString());
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.season) {
      query = query.eq("season", options.season);
    }

    // Support date range filtering
    if (options.startDate) {
      query = query.gte("game_date", new Date(options.startDate).toISOString());
    }

    if (options.endDate) {
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("game_date", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error getting games:", error);
    throw error;
  }
};

// Get game details
const getGameDetails = async (gameId) => {
  try {
    checkEnvVars();

    const { data, error } = await supabaseAdmin
      .from("games")
      .select("*")
      .eq("game_id", gameId)
      .single();

    if (error) {
      // Handle not found error
      if (error.code === "PGRST116") {
        throw new Error(`Game with ID ${gameId} not found`);
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error getting game details:", error);
    throw error;
  }
};

// Update game with authorization check
const updateGame = async (userId, gameId, updates) => {
  try {
    checkEnvVars();

    // First, get the game to verify ownership
    const { data: game, error: fetchError } = await supabaseAdmin
      .from("games")
      .select("team_id")
      .eq("game_id", gameId)
      .single();

    if (fetchError || !game) {
      throw new Error(`Game with ID ${gameId} not found`);
    }

    // Verify user is on this team
    const { authorized, error: _authError } = await checkTeamMembership(
      userId,
      game.team_id,
    );
    if (!authorized) {
      throw new Error("You don't have permission to modify this game");
    }

    // Sanitize updates
    const sanitizedUpdates = sanitize(updates);

    // Only allow certain fields to be updated
    const allowedFields = [
      "team_score",
      "opponent_score",
      "weather_conditions",
      "temperature",
      "field_conditions",
      "game_time",
      "location",
    ];
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (sanitizedUpdates[field] !== undefined) {
        filteredUpdates[field] = sanitizedUpdates[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from("games")
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("game_id", gameId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};

// Save a play/event
const savePlay = async (gameId, playData) => {
  try {
    checkEnvVars();

    // Get current play number
    const { data: existingPlays, error: countError } = await supabaseAdmin
      .from("game_events")
      .select("play_number")
      .eq("game_id", gameId)
      .order("play_number", { ascending: false })
      .limit(1);

    if (countError && countError.code !== "PGRST116") {
      throw countError;
    }

    const playNumber =
      existingPlays && existingPlays.length > 0
        ? existingPlays[0].play_number + 1
        : 1;

    const { data, error } = await supabaseAdmin
      .from("game_events")
      .insert({
        game_id: gameId,
        team_id: playData.teamId,
        play_number: playNumber,
        quarter: playData.quarter,
        down: playData.down,
        distance: playData.distance,
        yard_line: playData.yardLine,
        play_type: playData.playType,
        play_category: playData.playCategory || "offensive",
        primary_player_id: playData.primaryPlayerId,
        secondary_player_ids: playData.secondaryPlayerIds || [],
        defender_ids: playData.defenderIds || [],
        play_result: playData.playResult,
        yards_gained: playData.yardsGained || 0,
        yards_after_catch: playData.yardsAfterCatch || 0,
        is_successful: playData.isSuccessful,
        is_turnover: playData.isTurnover || false,
        play_notes: playData.notes || null,
      })
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
const getGameStats = async (gameId) => {
  try {
    checkEnvVars();

    // Get all plays for the game
    const { data: plays, error: playsError } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .order("play_number", { ascending: true });

    if (playsError) {
      throw playsError;
    }

    // Calculate statistics
    const stats = {
      totalPlays: plays.length,
      completions: plays.filter((p) => p.play_result === "completion").length,
      incompletions: plays.filter((p) => p.play_result === "incompletion")
        .length,
      drops: plays.filter((p) => p.play_result === "drop").length,
      flagPulls: plays.filter((p) => p.play_result === "flag_pull").length,
      touchdowns: plays.filter((p) => p.play_result === "touchdown").length,
      totalYards: plays.reduce((sum, p) => sum + (p.yards_gained || 0), 0),
      turnovers: plays.filter((p) => p.is_turnover).length,
    };

    return stats;
  } catch (error) {
    console.error("Error getting game stats:", error);
    throw error;
  }
};

// Get player's game statistics (FIXED SQL INJECTION)
// Only returns stats for games up to and including today
const getPlayerGameStats = async (playerId, gameId) => {
  try {
    checkEnvVars();

    // SECURITY: Validate playerId format to prevent SQL injection
    if (
      !playerId ||
      typeof playerId !== "string" ||
      !/^[A-Z0-9_-]+$/i.test(playerId)
    ) {
      throw new Error("Invalid player ID format");
    }

    // First verify the game exists and is not in the future
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);

    const { data: game, error: gameError } = await supabaseAdmin
      .from("games")
      .select("game_id, game_date")
      .eq("game_id", gameId)
      .lte("game_date", todayEndOfDay.toISOString())
      .single();

    if (gameError || !game) {
      throw new Error(`Game not found or is in the future`);
    }

    // SECURITY: Use separate queries instead of string interpolation
    // Query 1: Get plays where player is primary
    const { data: primaryPlays, error: error1 } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .eq("primary_player_id", playerId);

    if (error1) {
      throw error1;
    }

    // Query 2: Get plays where player is in secondary players array
    const { data: secondaryPlays, error: error2 } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .contains("secondary_player_ids", [playerId]);

    if (error2) {
      throw error2;
    }

    // Combine results and remove duplicates
    const allPlays = [...(primaryPlays || []), ...(secondaryPlays || [])];
    const uniquePlays = Array.from(
      new Map(allPlays.map((p) => [p.id, p])).values(),
    );

    return {
      plays: uniquePlays.length,
      completions: uniquePlays.filter((p) => p.play_result === "completion")
        .length,
      yards: uniquePlays.reduce((sum, p) => sum + (p.yards_gained || 0), 0),
      touchdowns: uniquePlays.filter((p) => p.play_result === "touchdown")
        .length,
      flagPulls: uniquePlays.filter((p) => p.play_result === "flag_pull")
        .length,
    };
  } catch (error) {
    console.error("Error getting player game stats:", error);
    throw error;
  }
};

// Main handler
exports.handler = async (event, _context) => {
  logFunctionCall("Games", event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS };
  }

  try {
    // SECURITY: Apply rate limiting
    const rateLimitType = getRateLimitType(event.httpMethod, event.path);
    const rateLimitResponse = applyRateLimit(event, rateLimitType);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;

    // SECURITY: Safe path parsing with regex
    const pathMatch = event.path.match(
      /^\/\.netlify\/functions\/games\/?(.*)$/,
    );
    const path = pathMatch ? pathMatch[1] : "";

    // Parse request body for POST/PUT
    let body = {};
    if (
      event.body &&
      (event.httpMethod === "POST" || event.httpMethod === "PUT")
    ) {
      try {
        body = JSON.parse(event.body);
      } catch (_parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
    }

    const queryParams = event.queryStringParameters || {};
    let result;

    // SECURITY: Use explicit route matching instead of path.includes()
    if (event.httpMethod === "POST" && (path === "" || path === "/")) {
      result = await createGame(userId, body);
    } else if (event.httpMethod === "GET" && (path === "" || path === "/")) {
      result = await getGames(userId, queryParams);
    } else if (
      event.httpMethod === "GET" &&
      path.match(/^([A-Z0-9_-]+)\/stats$/i)
    ) {
      const gameId = path.match(/^([A-Z0-9_-]+)\/stats$/i)[1];
      result = await getGameStats(gameId);
    } else if (
      event.httpMethod === "GET" &&
      path.match(/^([A-Z0-9_-]+)\/player-stats$/i)
    ) {
      const gameId = path.match(/^([A-Z0-9_-]+)\/player-stats$/i)[1];
      const playerId = queryParams.playerId;
      if (!playerId) {
        return handleValidationError("Player ID is required");
      }
      result = await getPlayerGameStats(playerId, gameId);
    } else if (event.httpMethod === "GET" && path.match(/^([A-Z0-9_-]+)$/i)) {
      const gameId = path.match(/^([A-Z0-9_-]+)$/i)[1];
      result = await getGameDetails(gameId);
    } else if (event.httpMethod === "PUT" && path.match(/^([A-Z0-9_-]+)$/i)) {
      const gameId = path.match(/^([A-Z0-9_-]+)$/i)[1];
      result = await updateGame(userId, gameId, body);
    } else if (
      event.httpMethod === "POST" &&
      path.match(/^([A-Z0-9_-]+)\/plays$/i)
    ) {
      const gameId = path.match(/^([A-Z0-9_-]+)\/plays$/i)[1];
      result = await savePlay(gameId, body);
    } else {
      return createErrorResponse("Endpoint not found", 404, "not_found");
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error in games function:", error);

    if (error.message && error.message.includes("not found")) {
      return handleNotFoundError(
        error.message.replace("Game with ID ", "").replace(" not found", ""),
      );
    }

    if (error.message && error.message.includes("permission")) {
      return handleAuthorizationError(error.message);
    }

    return handleServerError(error, "Games");
  }
};
