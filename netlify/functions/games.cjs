// Netlify Function: Games API
// Handles game creation, retrieval, and statistics

const jwt = require("jsonwebtoken");
const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const { validateQueryParams, validateRequestBody } = require("./validation.cjs");
const {
  validateJWT,
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  handleValidationError,
  handleNotFoundError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");

// JWT_SECRET will be checked at runtime, not module load time
// This prevents the function from failing to load if env var is missing
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("CRITICAL: JWT_SECRET environment variable is not set!");
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  return secret;
};

// Create a new game
const createGame = async (userId, gameData) => {
  try {
    checkEnvVars();

    const gameId = `GAME_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabaseAdmin
      .from("games")
      .insert({
        game_id: gameId,
        team_id: gameData.teamId || `TEAM_${userId}`,
        opponent_team_name: gameData.opponentName,
        game_date: gameData.gameDate,
        game_time: gameData.gameTime || null,
        location: gameData.location || null,
        is_home_game: gameData.isHomeGame !== false,
        weather_conditions: gameData.weather || null,
        temperature: gameData.temperature ? parseInt(gameData.temperature) : null,
        field_conditions: gameData.fieldConditions || null,
        season: gameData.season || new Date().getFullYear().toString(),
        tournament_name: gameData.tournamentName || null,
        game_type: gameData.gameType || "regular_season",
        team_score: gameData.teamScore || 0,
        opponent_score: gameData.opponentScore || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

// Get games for a user/team
const getGames = async (userId, options = {}) => {
  try {
    checkEnvVars();

    // Get user's team
    const { data: teamMemberships, error: teamError } = await supabaseAdmin
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1);

    if (teamError) throw teamError;

    const teamId = teamMemberships && teamMemberships.length > 0
      ? teamMemberships[0].team_id
      : `TEAM_${userId}`;

    let query = supabaseAdmin
      .from("games")
      .select("*")
      .eq("team_id", teamId)
      .order("game_date", { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.season) {
      query = query.eq("season", options.season);
    }

    const { data, error } = await query;

    if (error) throw error;
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
      if (error.code === 'PGRST116') {
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

// Update game (scores, etc.)
const updateGame = async (gameId, updates) => {
  try {
    checkEnvVars();

    const { data, error } = await supabaseAdmin
      .from("games")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("game_id", gameId)
      .select()
      .single();

    if (error) {
      // Handle not found error
      if (error.code === 'PGRST116') {
        throw new Error(`Game with ID ${gameId} not found`);
      }
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

    if (countError && countError.code !== "PGRST116") throw countError;

    const playNumber = existingPlays && existingPlays.length > 0
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

    if (error) throw error;
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

    if (playsError) throw playsError;

    // Calculate statistics
    const stats = {
      totalPlays: plays.length,
      completions: plays.filter((p) => p.play_result === "completion").length,
      incompletions: plays.filter((p) => p.play_result === "incompletion").length,
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

// Get player's game statistics
const getPlayerGameStats = async (playerId, gameId) => {
  try {
    checkEnvVars();

    const { data: plays, error } = await supabaseAdmin
      .from("game_events")
      .select("*")
      .eq("game_id", gameId)
      .or(`primary_player_id.eq.${playerId},secondary_player_ids.cs.{${playerId}}`);

    if (error) throw error;

    // Calculate player stats
    const playerPlays = plays.filter(
      (p) => p.primary_player_id === playerId || (p.secondary_player_ids || []).includes(playerId)
    );

    return {
      plays: playerPlays.length,
      completions: playerPlays.filter((p) => p.play_result === "completion").length,
      yards: playerPlays.reduce((sum, p) => sum + (p.yards_gained || 0), 0),
      touchdowns: playerPlays.filter((p) => p.play_result === "touchdown").length,
      flagPulls: playerPlays.filter((p) => p.play_result === "flag_pull").length,
    };
  } catch (error) {
    console.error("Error getting player game stats:", error);
    throw error;
  }
};

// Main handler
exports.handler = async (event, context) => {
  // Log function call
  logFunctionCall('Games', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    // Validate JWT token
    const JWT_SECRET = getJWTSecret();
    const jwtValidation = validateJWT(event, jwt, JWT_SECRET);
    if (!jwtValidation.success) {
      return jwtValidation.error;
    }
    const { decoded } = jwtValidation;

    const userId = decoded.userId;
    const path = event.path.replace("/.netlify/functions/games", "");

    // Validate query parameters for GET requests
    const queryParams = event.queryStringParameters || {};
    const queryValidation = validateQueryParams(queryParams);
    if (!queryValidation.valid) {
      return queryValidation.response;
    }

    // Parse and validate request body for POST/PUT requests
    let body = {};
    if (event.body && (event.httpMethod === "POST" || event.httpMethod === "PUT")) {
      try {
        body = JSON.parse(event.body);
      } catch (parseError) {
        return handleValidationError("Invalid JSON in request body");
      }
    }

    let result;

    if (event.httpMethod === "POST" && path === "" || path === "/") {
      // Create new game
      result = await createGame(userId, body);
    } else if (event.httpMethod === "GET" && path === "" || path === "/") {
      // Get games list
      result = await getGames(userId, queryParams);
    } else if (event.httpMethod === "GET" && path.includes("/stats")) {
      // Get game statistics
      const gameId = path.replace("/stats", "").replace("/", "");
      if (!gameId) {
        return handleValidationError("Game ID is required");
      }
      result = await getGameStats(gameId);
    } else if (event.httpMethod === "GET" && path.includes("/player-stats")) {
      // Get player game statistics
      const parts = path.split("/");
      const gameId = parts[1];
      const playerId = body.playerId || queryParams.playerId;
      if (!gameId || !playerId) {
        return handleValidationError("Game ID and Player ID are required");
      }
      result = await getPlayerGameStats(playerId, gameId);
    } else if (event.httpMethod === "GET") {
      // Get game details
      const gameId = path.replace("/", "");
      if (!gameId) {
        return handleValidationError("Game ID is required");
      }
      result = await getGameDetails(gameId);
    } else if (event.httpMethod === "PUT") {
      // Update game
      const gameId = path.replace("/", "");
      if (!gameId) {
        return handleValidationError("Game ID is required");
      }
      result = await updateGame(gameId, body);
    } else if (event.httpMethod === "POST" && path.includes("/plays")) {
      // Save a play
      const gameId = path.replace("/plays", "").replace("/", "");
      if (!gameId) {
        return handleValidationError("Game ID is required");
      }
      result = await savePlay(gameId, body);
    } else {
      return createErrorResponse("Endpoint not found", 404, 'not_found');
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Error in games function:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });
    
    // Handle not found errors specifically
    if (error.message && error.message.includes("not found")) {
      return handleNotFoundError(error.message.replace("Game with ID ", "").replace(" not found", ""));
    }
    
    return handleServerError(error, 'Games');
  }
};

